import { Product, UserProfile, HazardLevel, ScanResult } from './types';
import { ADDITIVES_DB } from '../data/additives';

export function isBeverage(product: Product): boolean {
  const nameL = product.name.toLowerCase();
  const ingrL = product.ingredients.join(' ').toLowerCase();
  const beverageKeywords = ['drink', 'soda', 'juice', 'water', 'cola', 'beverage', 'tea', 'coffee', 'liquid', 'syrup', 'squash', 'nectar'];
  
  if (beverageKeywords.some(kw => nameL.includes(kw))) return true;
  if ((ingrL.startsWith('carbonated water') || ingrL.startsWith('water')) && (ingrL.includes('sugar') || ingrL.includes('syrup'))) return true;
  return false;
}

function normalizeProduct(product: Product): Product {
  const n = { ...product.nutrients };
  const unitStr = (n.unit || '').toLowerCase();
  let factor = 1;

  const match = unitStr.match(/(\d+(?:\.\d+)?)\s*(g|ml|oz)/);
  if (match) {
    const amount = parseFloat(match[1]);
    if (amount > 0 && amount !== 100) {
      factor = 100 / amount;
    }
  }

  const scale = (val: number | null) => val !== null ? Number((val * factor).toFixed(2)) : null;

  return {
    ...product,
    nutrients: {
      unit: isBeverage(product) ? '100ml' : '100g',
      calories: scale(n.calories),
      sugar: scale(n.sugar),
      sodium: scale(n.sodium),
      fat: scale(n.fat),
      satFat: scale(n.satFat),
      protein: scale(n.protein),
      fiber: scale(n.fiber),
      carbs: scale(n.carbs)
    }
  };
}

function getIngredientIndex(ingredients: string[], keywords: string[]): number {
  for (let i = 0; i < ingredients.length; i++) {
    const lower = ingredients[i].toLowerCase();
    if (keywords.some(kw => lower.includes(kw))) {
      return i;
    }
  }
  return -1;
}

function detectKeywords(ingredients: string[], keywords: string[]): boolean {
  return getIngredientIndex(ingredients, keywords) !== -1;
}

export function computeHealthScore(
  rawProduct: Product,
  profile: UserProfile
): Omit<ScanResult, 'id' | 'date'> {
  const product = normalizeProduct(rawProduct);
  const n = product.nutrients;
  const isDrink = isBeverage(product);
  
  let score = 100;
  const warnings: string[] = [];
  const scoreReasons: string[] = [];
  const mainConcerns: string[] = [];
  const personalizedWarnings: string[] = [];

  const conditionsLower = (profile.conditions || []).map(c => c.toLowerCase());
  const ingredientsL = product.ingredients.map(i => i.toLowerCase());
  const combinedText = ingredientsL.join(' ') + ' ' + product.name.toLowerCase();

  // ── Allergen Check ────────────────────────────────────────────────────────
  const matchedAllergens = product.allergens.filter(a =>
    (profile.allergens || []).map(x => x.toLowerCase()).includes(a.toLowerCase())
  );
  if (matchedAllergens.length > 0) {
    score -= 30;
    const allergenList = matchedAllergens.map(a => a.charAt(0).toUpperCase() + a.slice(1)).join(', ');
    scoreReasons.push(`Allergens Detected: -30`);
    mainConcerns.push(`Allergen Alert: Contains ${allergenList}`);
    personalizedWarnings.push(`Avoid this product due to ${allergenList} allergy.`);
  }

  let sugarPenalty = 0;
  let sodiumPenalty = 0;

  // ── STEP 2: SUGAR PENALTY ─────────────────────────────────────────────────
  if (n.sugar !== null) {
    if (isDrink) {
      if (n.sugar >= 15) sugarPenalty = 70;
      else if (n.sugar >= 12) sugarPenalty = 55;
      else if (n.sugar >= 10) sugarPenalty = 40;
      else if (n.sugar >= 8) sugarPenalty = 25;
      else if (n.sugar >= 5) sugarPenalty = 15;
      else if (n.sugar >= 2) sugarPenalty = 5;
    } else {
      if (n.sugar >= 40) sugarPenalty = 60;
      else if (n.sugar >= 30) sugarPenalty = 45;
      else if (n.sugar >= 20) sugarPenalty = 30;
      else if (n.sugar >= 15) sugarPenalty = 20;
      else if (n.sugar >= 10) sugarPenalty = 10;
      else if (n.sugar >= 5) sugarPenalty = 5;
    }

    if (sugarPenalty > 0) {
      score -= sugarPenalty;
      scoreReasons.push(`Sugar (${n.sugar}g): -${sugarPenalty}`);
      if (sugarPenalty >= 30) mainConcerns.push(`High Sugar: Risk of obesity, diabetes, dental decay.`);
    }
  }

  // ── STEP 3: SODIUM PENALTY ────────────────────────────────────────────────
  if (n.sodium !== null) {
    if (n.sodium >= 1200) sodiumPenalty = 40;
    else if (n.sodium >= 900) sodiumPenalty = 30;
    else if (n.sodium >= 600) sodiumPenalty = 20;
    else if (n.sodium >= 300) sodiumPenalty = 10;
    else if (n.sodium >= 120) sodiumPenalty = 5;

    if (sodiumPenalty > 0) {
      score -= sodiumPenalty;
      scoreReasons.push(`Sodium (${n.sodium}mg): -${sodiumPenalty}`);
      if (sodiumPenalty >= 20) mainConcerns.push('High Sodium: Risk of hypertension.');
    }
  }

  // ── STEP 4: SATURATED FAT PENALTY ─────────────────────────────────────────
  if (n.satFat !== null) {
    let p = 0;
    if (n.satFat >= 10) p = 25;
    else if (n.satFat >= 5) p = 15;
    else if (n.satFat >= 3) p = 8;
    else if (n.satFat >= 1) p = 3;
    if (p > 0) {
      score -= p;
      scoreReasons.push(`Saturated Fat (${n.satFat}g): -${p}`);
    }
  }

  // ── STEP 5: TRANS FAT ─────────────────────────────────────────────────────
  if (detectKeywords(ingredientsL, ['partially hydrogenated', 'hydrogenated oil', 'trans fat'])) {
    score -= 25;
    scoreReasons.push(`Trans Fat detected: -25`);
    mainConcerns.push('Trans Fats: Extremely harmful for cardiovascular health.');
  }

  // ── STEP 6: REFINED FLOUR PENALTY ─────────────────────────────────────────
  const flourIdx = getIngredientIndex(ingredientsL, ['refined wheat', 'maida', 'bleached flour']);
  if (flourIdx === 0) {
    score -= 15;
    scoreReasons.push(`Refined Flour (Primary): -15`);
  } else if (flourIdx > 0) {
    score -= 8;
    scoreReasons.push(`Refined Flour: -8`);
  }

  // ── STEP 7: OIL QUALITY ───────────────────────────────────────────────────
  if (detectKeywords(ingredientsL, ['palm oil', 'palmolein', 'hydrogenated oil', 'partially hydrogenated oil'])) {
    score -= 8;
    scoreReasons.push(`Bad Oils (Palm/Hydrogenated): -8`);
  }
  if (detectKeywords(ingredientsL, ['olive oil', 'avocado oil', 'mustard oil'])) {
    score += 5;
    scoreReasons.push(`Healthy Oil Bonus: +5`);
  }

  // ── STEP 11: PROCESSING LEVEL (NOVA 4) ────────────────────────────────────
  const upfMarkers = ['flavour enhancer', 'flavor enhancer', 'artificial flavour', 'artificial flavor', 'artificial colour', 'artificial color', 'sweetener', 'aspartame', 'sucralose', 'maltodextrin', 'dextrose', 'isolate'];
  const upfHeuristic = combinedText.includes('instant noodle') || combinedText.includes('cola') || combinedText.includes('energy drink') || combinedText.includes('chips') || combinedText.includes('candy') || combinedText.includes('processed meat');
  
  if (upfHeuristic || detectKeywords(ingredientsL, upfMarkers)) {
    score -= 15; // v3.1 adjustment
    scoreReasons.push(`Ultra-Processed (NOVA 4): -15`);
    mainConcerns.push('Ultra-Processed: Associated with poorer long-term health outcomes.');
  }

  // ── STEP 12: ADDITIVE SCORING ─────────────────────────────────────────────
  const allAdditives = [...new Set([...product.additives, ...Object.keys(product.dynamicAdditives || {})])];
  let totalAdditivePenalty = 0;
  
  for (const code of allAdditives) {
    const additive = product.dynamicAdditives?.[code] || ADDITIVES_DB[code];
    let penalty = 0;
    
    if (additive) {
      if (additive.hazard === 'hazardous' || additive.hazard === 'harmful') penalty = 7;
      else if (additive.hazard === 'caution') penalty = 3;
      else if (additive.hazard === 'mild') penalty = 1;
    } else {
      penalty = 3; // default
    }

    if (penalty > 0) {
      totalAdditivePenalty += penalty;
      scoreReasons.push(`${code} (${additive?.hazard || 'unknown'}): -${penalty}`);
    }
  }

  if (totalAdditivePenalty > 25) totalAdditivePenalty = 25; // Capped at -25
  score -= totalAdditivePenalty;

  // ── BONUS GATING ──────────────────────────────────────────────────────────
  const isBonusGated = (sugarPenalty >= 30 || sodiumPenalty >= 30);
  const bonusMultiplier = isBonusGated ? 0.5 : 1;
  if (isBonusGated) {
    warnings.push("High sugar or sodium limits the positive impact of other nutrients.");
  }

  // ── STEP 8: FIBER BONUS ───────────────────────────────────────────────────
  if (n.fiber !== null) {
    let bonus = 0;
    if (n.fiber >= 8) bonus = 15;
    else if (n.fiber >= 5) bonus = 10;
    else if (n.fiber >= 2) bonus = 5;

    bonus = Math.round(bonus * bonusMultiplier);
    if (bonus > 0) {
      score += bonus;
      scoreReasons.push(`Fiber (${n.fiber}g): +${bonus}`);
    }
  }

  // ── STEP 9: PROTEIN BONUS ─────────────────────────────────────────────────
  if (n.protein !== null) {
    let bonus = 0;
    if (n.protein >= 20) bonus = 15;
    else if (n.protein >= 10) bonus = 10;
    else if (n.protein >= 5) bonus = 5;

    bonus = Math.round(bonus * bonusMultiplier);
    if (bonus > 0) {
      score += bonus;
      scoreReasons.push(`Protein (${n.protein}g): +${bonus}`);
    }
  }

  // ── STEP 10: WHOLE FOOD BONUS ─────────────────────────────────────────────
  let wfBonus = 0;
  if (detectKeywords(ingredientsL, ['whole grain', 'whole wheat', 'oat'])) wfBonus += 5;
  if (detectKeywords(ingredientsL, ['fruit', 'apple', 'banana', 'berry', 'mango'])) wfBonus += 5;
  if (detectKeywords(ingredientsL, ['vegetable', 'spinach', 'carrot', 'tomato'])) wfBonus += 5;
  if (detectKeywords(ingredientsL, ['nut', 'almond', 'cashew', 'walnut'])) wfBonus += 5;
  if (detectKeywords(ingredientsL, ['seed', 'chia', 'flax', 'pumpkin'])) wfBonus += 5;
  if (detectKeywords(ingredientsL, ['probiotic', 'culture', 'kefir'])) wfBonus += 5;
  if (detectKeywords(ingredientsL, ['legume', 'lentil', 'chickpea', 'pea'])) wfBonus += 5;

  wfBonus = Math.min(20, wfBonus);
  wfBonus = Math.round(wfBonus * bonusMultiplier);
  if (wfBonus > 0) {
    score += wfBonus;
    scoreReasons.push(`Whole Foods: +${wfBonus}`);
  }

  // ── FINAL CAP ─────────────────────────────────────────────────────────────
  score = Math.max(0, Math.min(100, Math.round(score)));

  // ── STEP 16: FINAL VERDICT ────────────────────────────────────────────────
  let verdict: HazardLevel = 'safe';
  let dietAdvice = '';
  let prefix = '';

  if (score >= 90) {
    verdict = 'safe'; prefix = 'Excellent.';
  } else if (score >= 80) {
    verdict = 'safe'; prefix = 'Very Good.';
  } else if (score >= 70) {
    verdict = 'safe'; prefix = 'Good.';
  } else if (score >= 55) {
    verdict = 'caution'; prefix = 'Moderate.';
  } else if (score >= 40) {
    verdict = 'caution'; prefix = 'Poor.';
  } else if (score >= 20) {
    verdict = 'hazardous'; prefix = 'Bad.';
  } else {
    verdict = 'hazardous'; prefix = 'High Concern.';
  }

  // Synthesize dynamic reasoning for the verdict
  const drivingFactors = [];
  if (sugarPenalty >= 30) drivingFactors.push("excessively high sugar (linked to diabetes and obesity)");
  else if (sugarPenalty >= 15) drivingFactors.push("high sugar content");
  
  if (sodiumPenalty >= 20) drivingFactors.push("dangerous sodium levels (linked to hypertension)");
  
  if (detectKeywords(ingredientsL, ['partially hydrogenated', 'hydrogenated oil', 'trans fat'])) {
    drivingFactors.push("toxic trans fats (linked to cardiovascular disease)");
  }
  
  if (totalAdditivePenalty >= 10) {
    drivingFactors.push("multiple chemical additives and preservatives (linked to long-term health risks and gut disruption)");
  }
  
  if (upfHeuristic || detectKeywords(ingredientsL, upfMarkers)) {
    drivingFactors.push("heavy ultra-processing (NOVA 4)");
  }

  if (flourIdx === 0) {
    drivingFactors.push("refined flours lacking nutritional value");
  }

  if (score < 70 && drivingFactors.length > 0) {
    dietAdvice = `${prefix} This product's low score is primarily driven by ${drivingFactors.join(', and ')}. Frequent consumption is strongly discouraged.`;
  } else if (score >= 70) {
    if (drivingFactors.length > 0) {
      dietAdvice = `${prefix} Generally a reasonable nutritional choice, though it contains some ${drivingFactors[0]}. Suitable for regular consumption.`;
    } else {
      dietAdvice = `${prefix} Clean nutritional profile with minimal processing. Excellent choice for regular consumption.`;
    }
  } else {
    dietAdvice = `${prefix} Proceed with caution due to nutritional imbalances.`;
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