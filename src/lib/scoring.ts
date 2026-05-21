import { Product, UserProfile, HazardLevel, ScanResult } from './types';
import { ADDITIVES_DB } from '../data/additives';
import { classifyIngredient } from './ingredientRisk';

export function computeHealthScore(
  product: Product,
  profile: UserProfile
): Omit<ScanResult, 'id' | 'date'> {
  let score = 100;
  const warnings: string[] = [];
  const scoreReasons: string[] = [];
  const mainConcerns: string[] = [];
  const personalizedWarnings: string[] = [];
  const conditionsLower = (profile.conditions || []).map(c => c.toLowerCase());

  // 1. Allergen Check - Penalty-based, not catastrophic
  const matchedAllergens = product.allergens.filter((a) =>
    (profile.allergens || []).map(x => x.toLowerCase()).includes(a.toLowerCase())
  );
  if (matchedAllergens.length > 0) {
    score -= 35;
    const allergenList = matchedAllergens.map(a => a.charAt(0).toUpperCase() + a.slice(1)).join(', ');
    scoreReasons.push(`⚠️ Contains allergen(s) from your profile: ${allergenList}. Consult your doctor if you have a severe allergy.`);
    mainConcerns.push(`Allergen Alert: This product contains ${allergenList}, which is in your allergy profile.`);
    personalizedWarnings.push(`This product contains ${allergenList}. If you have a confirmed allergy, avoid this product. If it's a sensitivity/intolerance, consume with caution.`);
  }

  // 2. Processing and Additives Check
  let upiCount = 0; 
  let refinedOilCount = 0;
  let processedSugarCount = 0;

  product.ingredients.forEach(ingr => {
    const risk = classifyIngredient(ingr);
    if (risk.level === 'hazardous') upiCount += 2;
    if (risk.level === 'harmful') upiCount += 1.25;
    if (risk.level === 'moderate') upiCount += 0.75;
    if (risk.level === 'mild') upiCount += 0.25;

    const lower = ingr.toLowerCase();
    if (lower.includes('palm') || lower.includes('palmolein') || lower.includes('refined oil') || lower.includes('hydrogenated')) {
      refinedOilCount++;
    }
    if (lower.includes('dextrose') || lower.includes('maltodextrin') || lower.includes('syrup') || lower.includes('glucose') || lower.includes('sucrose')) {
      processedSugarCount++;
    }
  });

  // Balanced Processing Penalties
  if (upiCount >= 8) {
    score -= 25;
    scoreReasons.push('Ultra-processed: Extremely high density of industrial ingredients.');
    mainConcerns.push('Ultra-processed: Highly formulated with synthetic agents.');
  } else if (upiCount >= 5) {
    score -= 15;
    scoreReasons.push('Highly processed: Contains multiple industrial elements.');
  } else if (upiCount >= 3) {
    score -= 8;
    scoreReasons.push('Moderately processed.');
  }

  if (refinedOilCount > 0) {
    score -= 10;
    scoreReasons.push('Contains refined/inflammatory oils.');
    mainConcerns.push('Refined Oils: High in heavily processed industrial fats.');
  }

  if (processedSugarCount > 0) {
    score -= 5;
    scoreReasons.push('Contains processed sugars/sweeteners.');
  }

  // 3. Nutrient Penalties (per 100g)
  const n = product.nutrients;
  
  if (n.sugar !== null) {
    if (n.sugar > 20) {
      score -= 20;
      scoreReasons.push('Excessive sugar content (>20g per 100g).');
      mainConcerns.push('High Sugar: Promotes energy crashes and metabolic strain.');
    } else if (n.sugar > 10) {
      score -= 10;
      scoreReasons.push('High sugar content.');
    }
    if (conditionsLower.includes('diabetes') && n.sugar > 5) {
      score -= 20;
      personalizedWarnings.push(`High risk for Diabetes: Contains ${n.sugar}g sugar.`);
    }
  }

  if (n.sodium !== null) {
    if (n.sodium > 800) {
      score -= 15;
      scoreReasons.push('Extremely high sodium content.');
      mainConcerns.push('High Sodium: Can negatively affect blood pressure.');
    } else if (n.sodium > 400) {
      score -= 8;
      scoreReasons.push('Moderate sodium content.');
    }
    if ((conditionsLower.includes('hypertension') || conditionsLower.includes('heart disease')) && n.sodium > 150) {
      score -= 15;
      personalizedWarnings.push(`High sodium (${n.sodium}mg) - Dangerous for heart health conditions.`);
    }
  }

  if (n.satFat !== null) {
    if (n.satFat > 7) {
      score -= 12;
      scoreReasons.push('High saturated fat content.');
    } else if (n.satFat > 3) {
      score -= 6;
      scoreReasons.push('Moderate saturated fat.');
    }
  }

  // Bonuses (Only for clean label products)
  const isClean = upiCount < 3;
  if (isClean) {
    if (n.fiber !== null && n.fiber > 5) score += 8;
    if (n.protein !== null && n.protein > 10) score += 8;
  }

  // 4. Additive Severity Check
  let hazardousCount = 0;
  const allAdditives = [...new Set([...product.additives, ...Object.keys(product.dynamicAdditives || {})])];
  
  allAdditives.forEach((code) => {
    const additive = product.dynamicAdditives?.[code] || ADDITIVES_DB[code];
    if (additive) {
      if (additive.hazard === 'hazardous') {
        score -= 18;
        hazardousCount++;
      } else if (additive.hazard === 'caution') {
        score -= 6;
      } else if (additive.hazard === 'safe' && (additive.name.toLowerCase().includes('flavor') || additive.name.toLowerCase().includes('color'))) {
        score -= 2;
      }
    }
  });

  if (hazardousCount > 0) {
    scoreReasons.push(`Contains ${hazardousCount} hazardous/banned additive(s).`);
    mainConcerns.push('Hazardous Additive: Contains ingredients banned in other regions.');
  }

  // Clamp score
  score = Math.max(5, Math.min(100, Math.round(score)));

  // Determine Smart Verdict
  let verdict: HazardLevel = 'safe';
  let dietAdvice = 'Safe for occasional consumption.';

  if (score < 40 || hazardousCount > 0) {
    verdict = 'hazardous';
    dietAdvice = score < 25 ? 'Avoid this product entirely.' : 'Highly processed. Better to avoid.';
  } else if (score < 65) {
    verdict = 'caution';
    dietAdvice = 'Eat in moderation. Watch out for high processing.';
  } else {
    verdict = 'safe';
    dietAdvice = 'Great choice! Matches your health profile well.';
  }

  return {
    productId: product.id,
    score,
    verdict,
    warnings,
    scoreReasons,
    mainConcerns,
    personalizedWarnings,
    dietAdvice
  };
}