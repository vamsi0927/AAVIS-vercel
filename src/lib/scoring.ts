import { Product, UserProfile, HazardLevel, ScanResult } from './types';
import { ADDITIVES_DB } from '../data/additives';
import { classifyIngredient } from './ingredientRisk';

function isBeverage(product: Product): boolean {
  const nameL = product.name.toLowerCase();
  const ingrL = product.ingredients.join(' ').toLowerCase();
  const beverageKeywords = ['drink', 'soda', 'juice', 'water', 'cola', 'beverage', 'tea', 'coffee', 'liquid', 'syrup', 'squash', 'nectar'];
  
  // Check if name has a strong beverage keyword
  if (beverageKeywords.some(kw => nameL.includes(kw))) {
    return true;
  }
  
  // If the first ingredient is carbonated water or just water and it has sugar/syrup, likely beverage
  if ((ingrL.startsWith('carbonated water') || ingrL.startsWith('water')) && (ingrL.includes('sugar') || ingrL.includes('syrup'))) {
    return true;
  }

  return false;
}

// ─── Processing level estimator ──────────────────────────────────────────────
function checkUltraProcessed(ingredients: string[], totalAdditives: number): boolean {
  const allText = ingredients.join(' ').toLowerCase();

  // Ultra-processing markers (artificial sweeteners, colors, industrial emulsifiers)
  const ultraMarkers = [
    'modified starch', 'maltodextrin', 'hydrolyzed', 'emulsifier', 'stabilizer',
    'artificial flavor', 'artificial colour', 'artificial color', 'sodium benzoate',
    'tbhq', 'bha', 'bht', 'polysorbate', 'carrageenan', 'acesulfame', 'aspartame',
    'sucralose', 'saccharin', 'titanium dioxide', 'silicon dioxide', 'dextrose',
    'corn syrup', 'high fructose', 'maida', 'bleached flour', 'vanillin',
    'natural flavour', 'natural flavor', 'caramel color', 'caramel colour'
  ];

  let ultraScore = 0;
  for (const marker of ultraMarkers) {
    if (allText.includes(marker)) ultraScore++;
  }

  // Contains 3 or more additives OR has multiple ultra-processed markers
  if (totalAdditives >= 3 || ultraScore >= 3) {
    return true;
  }

  return false;
}

// ─── Marketing claim detector ─────────────────────────────────────────────────
function detectMarketingClaims(ingredients: string[], productName: string): string[] {
  const allText = (ingredients.join(' ') + ' ' + productName).toLowerCase();
  const claims: string[] = [];
  const claimKeywords = [
    ['fortified', '"Fortified" — vitamins added to a heavily processed base do not make it healthy.'],
    ['cholesterol free', '"Cholesterol free" — plant-based products are naturally cholesterol-free; this is misleading.'],
    [' lite ', '"Lite" — may mean reduced fat but can have added sugar or artificial sweeteners.'],
    ['low fat', '"Low fat" — often compensated with added sugar or thickeners.'],
    ['zero sugar', '"Zero sugar" — often uses artificial sweeteners.'],
    ['natural flavor', '"Natural flavor" — legally vague; can include highly processed extracts.'],
  ];
  for (const [kw, note] of claimKeywords) {
    if (allText.includes(kw)) claims.push(note);
  }
  return claims;
}

// ─── Main scoring function ────────────────────────────────────────────────────
export function computeHealthScore(
  product: Product,
  profile: UserProfile
): Omit<ScanResult, 'id' | 'date'> {
  let score = 100; // Base Score
  const warnings: string[] = [];
  const scoreReasons: string[] = [];
  const mainConcerns: string[] = [];
  const personalizedWarnings: string[] = [];
  const conditionsLower = (profile.conditions || []).map(c => c.toLowerCase());

  const n = product.nutrients;
  const isDrink = isBeverage(product);

  // ── PILLAR 0: Allergen check ──────────────────────────────────────────────
  const matchedAllergens = product.allergens.filter(a =>
    (profile.allergens || []).map(x => x.toLowerCase()).includes(a.toLowerCase())
  );
  if (matchedAllergens.length > 0) {
    score -= 30;
    const allergenList = matchedAllergens.map(a => a.charAt(0).toUpperCase() + a.slice(1)).join(', ');
    scoreReasons.push(`⚠️ Contains your allergen(s): ${allergenList}`);
    mainConcerns.push(`Allergen Alert: Contains ${allergenList} — in your allergy profile.`);
    personalizedWarnings.push(`This product contains ${allergenList}. Avoid if you have a confirmed allergy.`);
  }

  // ── PILLAR 1: Negative Factors (Nutritional Penalties) ─────────────────────

  // Sugar Penalty
  if (n.sugar !== null) {
    let penalty = 0;
    if (isDrink) {
      if (n.sugar > 10) penalty = 45;
      else if (n.sugar > 7.5) penalty = 35;
      else if (n.sugar > 5) penalty = 25;
      else if (n.sugar > 2.5) penalty = 15;
    } else {
      if (n.sugar > 20) penalty = 40;
      else if (n.sugar > 15) penalty = 30;
      else if (n.sugar > 10) penalty = 20;
      else if (n.sugar > 5) penalty = 10;
    }

    if (penalty > 0) {
      score -= penalty;
      scoreReasons.push(`High added sugar (${n.sugar}g): -${penalty} points.`);
      if (penalty >= 30) mainConcerns.push(`Excessive Sugar: ${n.sugar}g per serving is strongly linked to metabolic disease.`);
    }

    // Personalized warning for Diabetes
    if (conditionsLower.includes('diabetes') && n.sugar > 5) {
      score -= 15;
      personalizedWarnings.push(`High sugar (${n.sugar}g) is highly dangerous for Diabetes. Avoid.`);
    }
  }

  // Sodium Penalty
  if (n.sodium !== null) {
    let penalty = 0;
    if (n.sodium > 600) penalty = 20;
    else if (n.sodium > 300) penalty = 10;
    else if (n.sodium > 120) penalty = 5;

    if (penalty > 0) {
      score -= penalty;
      scoreReasons.push(`High sodium (${n.sodium}mg): -${penalty} points.`);
      if (penalty >= 10) mainConcerns.push('High Sodium: Linked to hypertension and cardiovascular strain.');
    }

    // Personalized warning for Hypertension
    if ((conditionsLower.includes('hypertension') || conditionsLower.includes('heart disease')) && n.sodium > 150) {
      score -= 10;
      personalizedWarnings.push(`Sodium (${n.sodium}mg) is a concern for hypertension/heart disease.`);
    }
  }

  // Saturated Fat Penalty
  if (n.satFat !== null) {
    let penalty = 0;
    if (n.satFat > 10) penalty = 20;
    else if (n.satFat > 5) penalty = 10;
    else if (n.satFat > 2) penalty = 5;

    if (penalty > 0) {
      score -= penalty;
      scoreReasons.push(`Saturated fat (${n.satFat}g): -${penalty} points.`);
      if (penalty >= 10) mainConcerns.push('High Saturated Fat: Raises LDL cholesterol.');
    }
    
    if ((conditionsLower.includes('heart disease') || conditionsLower.includes('cholesterol')) && n.satFat > 3) {
      score -= 10;
      personalizedWarnings.push('Saturated fat content is a risk factor for heart disease and high cholesterol.');
    }
  }

  // ── PILLAR 2: Positive Factors (Nutritional Bonuses) ─────────────────────

  // Protein Bonus
  if (n.protein !== null) {
    let bonus = 0;
    if (n.protein > 10) bonus = 15;
    else if (n.protein >= 5) bonus = 10;
    else if (n.protein >= 2) bonus = 5;

    if (bonus > 0) {
      score += bonus;
      scoreReasons.push(`Good protein content (${n.protein}g): +${bonus} points.`);
    }
  }

  // Fiber Bonus
  if (n.fiber !== null) {
    let bonus = 0;
    if (n.fiber > 6) bonus = 15;
    else if (n.fiber >= 3) bonus = 10;
    else if (n.fiber >= 1) bonus = 5;

    if (bonus > 0) {
      score += bonus;
      scoreReasons.push(`Good dietary fiber (${n.fiber}g): +${bonus} points.`);
    }
  }

  // ── PILLAR 3: Additives Penalty ───────────────────────────────────────────
  let totalAdditivePenalty = 0;
  let highRiskAdditiveCount = 0;
  const allAdditives = [...new Set([...product.additives, ...Object.keys(product.dynamicAdditives || {})])];

  for (const code of allAdditives) {
    const additive = product.dynamicAdditives?.[code] || ADDITIVES_DB[code];
    let penalty = 0;
    
    if (additive) {
      if (additive.hazard === 'hazardous') penalty = 12; // Avoid
      else if (additive.hazard === 'harmful') penalty = 7;
      else if (additive.hazard === 'caution') penalty = 3;
      else if (additive.hazard === 'mild') penalty = 1;
    } else {
      // Unknown additive, treat as caution
      penalty = 3; 
    }

    if (penalty >= 7) highRiskAdditiveCount++;
    totalAdditivePenalty += penalty;
  }

  if (totalAdditivePenalty > 0) {
    score -= totalAdditivePenalty;
    scoreReasons.push(`Additives impact: -${totalAdditivePenalty} points.`);
    if (highRiskAdditiveCount > 0) {
      mainConcerns.push('Harmful Additives: Contains synthetic compounds with significant health concerns.');
    }
  }

  // ── PILLAR 4: Ultra-Processed Food Penalty ───────────────────────────────
  const isUPF = checkUltraProcessed(product.ingredients, allAdditives.length);
  // Additional heuristic: if it has virtually no protein or fiber, and high sugar, it's very poor nutrition
  const isPoorNutrition = (n.protein === null || n.protein < 1) && (n.fiber === null || n.fiber < 1) && (n.sugar !== null && n.sugar > 5);

  if (isUPF || isPoorNutrition) {
    score -= 10;
    scoreReasons.push('Ultra-processed / Poor nutritional value: -10 points.');
    if (!mainConcerns.includes('Ultra-Processed Food: Strongly associated with metabolic disease risk.')) {
        mainConcerns.push('Ultra-Processed Food: Strongly associated with metabolic disease risk.');
    }
  }

  // ── PILLAR 5: Marketing claim bypass ─────────────────────────────────────
  const claims = detectMarketingClaims(product.ingredients, product.name);
  for (const claim of claims) {
    warnings.push(claim);
  }

  // ── Final clamp ───────────────────────────────────────────────────────────
  score = Math.max(0, Math.min(100, Math.round(score)));

  // ── Verdict determination ─────────────────────────────────────────────────
  // 90-100 -> Excellent
  // 75-89  -> Good
  // 60-74  -> Fair
  // 40-59  -> Poor
  // <40    -> Avoid Frequent Consumption
  let verdict: HazardLevel = 'safe';
  let dietAdvice: string;

  if (score >= 90) {
    verdict = 'safe';
    dietAdvice = 'Excellent choice! High in beneficial nutrients and minimal processing. Perfect for regular consumption.';
    scoreReasons.unshift('✅ Excellent: Outstanding nutritional profile.');
  } else if (score >= 75) {
    verdict = 'safe';
    dietAdvice = 'Good choice. Reasonable nutritional balance. Suitable for regular consumption.';
    scoreReasons.unshift('✅ Good: Strong nutritional value with minor drawbacks.');
  } else if (score >= 60) {
    verdict = 'mild'; // Equivalent to Fair
    dietAdvice = 'Fair choice. Has some nutritional value but notable drawbacks. Consume in moderation.';
    scoreReasons.unshift('⚡ Fair: Moderate nutritional profile.');
  } else if (score >= 40) {
    verdict = 'caution'; // Equivalent to Poor
    dietAdvice = 'Poor nutritional profile. Likely high in sugar, fat, or sodium with low beneficial nutrients. Limit consumption.';
    scoreReasons.unshift('⚠️ Poor: Significant nutritional drawbacks or heavy processing.');
    if (!mainConcerns.length) mainConcerns.push('Low nutritional value with concerning macros.');
  } else {
    verdict = 'hazardous'; // Equivalent to Avoid
    dietAdvice = 'High in detrimental ingredients (like added sugar) and provides limited nutritional value. Best consumed occasionally rather than as a daily staple.';
    scoreReasons.unshift('🚫 Avoid Frequent Consumption: Poor nutritional value.');
    if (!mainConcerns.length) mainConcerns.push('This product provides almost no nutritional benefit and contains concerning levels of sugar/fat/additives.');
  }

  return {
    productId: product.id,
    score,
    verdict,
    warnings,
    scoreReasons,
    mainConcerns,
    personalizedWarnings,
    dietAdvice,
  };
}