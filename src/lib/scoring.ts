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

  // Extract explicit serving size like "30g" or "250ml"
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

// ─── Main scoring function ────────────────────────────────────────────────────
export function computeHealthScore(
  rawProduct: Product,
  profile: UserProfile
): Omit<ScanResult, 'id' | 'date'> {
  // Normalize units first
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
    scoreReasons.push(`⚠️ Contains allergen(s): ${allergenList}`);
    mainConcerns.push(`Allergen Alert: Contains ${allergenList}`);
    personalizedWarnings.push(`Avoid this product due to ${allergenList} allergy.`);
  }

  // ── PART 1: SUGAR ─────────────────────────────────────────────────────────
  if (n.sugar !== null) {
    let penalty = 0;
    if (isDrink) {
      if (n.sugar > 20) penalty = 55;
      else if (n.sugar > 15) penalty = 45;
      else if (n.sugar > 10) penalty = 35;
      else if (n.sugar > 8) penalty = 25;
      else if (n.sugar > 5) penalty = 15;
      else if (n.sugar > 2) penalty = 5;
    } else {
      if (n.sugar > 40) penalty = 55;
      else if (n.sugar > 30) penalty = 45;
      else if (n.sugar > 20) penalty = 35;
      else if (n.sugar > 15) penalty = 25;
      else if (n.sugar > 10) penalty = 15;
      else if (n.sugar > 5) penalty = 5;
    }

    // Liquid sugar penalty multiplier
    if (isDrink) {
      penalty = Math.round(penalty * 1.5);
    }

    const sugarIdx = getIngredientIndex(ingredientsL, ['sugar', 'syrup', 'fructose', 'sucrose']);
    let posMultiplier = 1;
    if (sugarIdx === 0) posMultiplier = 2;
    else if (sugarIdx > 0 && sugarIdx <= 2) posMultiplier = 1.5;

    penalty = Math.round(penalty * posMultiplier);

    // Extra penalty
    if (sugarIdx >= 0 && sugarIdx <= 2) {
      penalty += 10;
    }

    if (penalty > 0) {
      score -= penalty;
      scoreReasons.push(`Sugar (${n.sugar}g): -${penalty}`);
      if (penalty >= 30) mainConcerns.push(`High Sugar: Risk of obesity, diabetes, dental decay.`);
    }
  }

  // ── PART 2: SODIUM ────────────────────────────────────────────────────────
  if (n.sodium !== null) {
    let penalty = 0;
    if (n.sodium > 1500) penalty = 45;
    else if (n.sodium > 1000) penalty = 35;
    else if (n.sodium > 600) penalty = 25;
    else if (n.sodium > 300) penalty = 15;
    else if (n.sodium > 120) penalty = 5;

    if (penalty > 0) {
      score -= penalty;
      scoreReasons.push(`Sodium (${n.sodium}mg): -${penalty}`);
      if (penalty >= 15) mainConcerns.push('High Sodium: Risk of hypertension.');
    }
  }

  // ── PART 3: SATURATED FAT ─────────────────────────────────────────────────
  if (n.satFat !== null) {
    let penalty = 0;
    if (n.satFat > 10) penalty = 25;
    else if (n.satFat > 5) penalty = 15;
    else if (n.satFat > 3) penalty = 8;
    else if (n.satFat > 1) penalty = 3;

    if (penalty > 0) {
      score -= penalty;
      scoreReasons.push(`Saturated Fat (${n.satFat}g): -${penalty}`);
    }
  }

  // ── PART 4: TRANS FAT ─────────────────────────────────────────────────────
  if (detectKeywords(ingredientsL, ['partially hydrogenated', 'hydrogenated oil', 'trans fat'])) {
    score -= 25;
    scoreReasons.push(`Trans Fat detected: -25`);
    mainConcerns.push('Trans Fats: Extremely harmful for cardiovascular health.');
  }

  // ── PART 5: PROCESSING LEVEL ──────────────────────────────────────────────
  let upfPenalty = 0;
  const isUpfByHeuristic = 
    combinedText.includes('instant noodle') || 
    combinedText.includes('energy drink') || 
    combinedText.includes('candy') ||
    combinedText.includes('soft drink') ||
    combinedText.includes('cola');

  if (isUpfByHeuristic) {
    upfPenalty = 25;
  } else {
    // NOVA generic markers
    const processedMarkers = ['emulsifier', 'preservative', 'flavor', 'colour', 'color', 'extract'];
    const upfMarkers = ['maltodextrin', 'dextrose', 'hydrolyzed', 'isolate', 'artificial'];
    
    if (detectKeywords(ingredientsL, upfMarkers)) {
      upfPenalty = 25;
    } else if (detectKeywords(ingredientsL, processedMarkers) || product.additives.length > 0) {
      upfPenalty = 8;
    } else if (ingredientsL.length > 1) {
      upfPenalty = 2; // Minimally
    }
  }

  if (upfPenalty > 0) {
    score -= upfPenalty;
    scoreReasons.push(`Processing Level Penalty: -${upfPenalty}`);
    if (upfPenalty === 25) mainConcerns.push('Ultra Processed: Associated with poorer long-term health outcomes.');
  }

  // ── PART 6: REFINED FLOUR ─────────────────────────────────────────────────
  const flourIdx = getIngredientIndex(ingredientsL, ['refined wheat', 'maida', 'bleached flour']);
  if (flourIdx === 0) {
    score -= 15;
    scoreReasons.push(`Refined Flour (Primary): -15`);
  } else if (flourIdx > 0) {
    score -= 10;
    scoreReasons.push(`Refined Flour: -10`);
  }

  // ── PART 7: OIL QUALITY ───────────────────────────────────────────────────
  const palmIdx = getIngredientIndex(ingredientsL, ['palm oil', 'palmolein']);
  if (palmIdx !== -1) {
    let p = 5;
    if (palmIdx === 0) p = 10;
    else if (palmIdx <= 2) p = 7.5;
    score -= Math.round(p);
    scoreReasons.push(`Palm Oil: -${Math.round(p)}`);
  }
  
  if (detectKeywords(ingredientsL, ['olive oil', 'avocado oil'])) {
    score += 3;
    scoreReasons.push(`Healthy Oil: +3`);
  } else if (detectKeywords(ingredientsL, ['groundnut oil', 'mustard oil'])) {
    score += 2;
    scoreReasons.push(`Healthy Oil: +2`);
  }

  // ── EMPTY CALORIE / LOW NUTRITION ─────────────────────────────────────────
  if ((n.protein !== null && n.protein < 2) && (n.fiber !== null && n.fiber < 1)) {
    score -= 15;
    scoreReasons.push(`Empty Calories: -15`);
    score -= 10; // Low Nutrition Penalty
    scoreReasons.push(`Low Nutrition: -10`);
  }

  // ── PART 8: FIBER ─────────────────────────────────────────────────────────
  if (n.fiber !== null) {
    let bonus = 0;
    if (n.fiber > 10) bonus = 15;
    else if (n.fiber > 6) bonus = 10;
    else if (n.fiber > 3) bonus = 5;
    else if (n.fiber > 1) bonus = 2;

    if (bonus > 0) {
      score += bonus;
      scoreReasons.push(`Fiber (${n.fiber}g): +${bonus}`);
    }
  }

  // ── PART 9: PROTEIN ───────────────────────────────────────────────────────
  if (n.protein !== null) {
    let bonus = 0;
    if (n.protein > 25) bonus = 15;
    else if (n.protein > 15) bonus = 12;
    else if (n.protein > 8) bonus = 8;
    else if (n.protein > 3) bonus = 3;

    if (bonus > 0) {
      score += bonus;
      scoreReasons.push(`Protein (${n.protein}g): +${bonus}`);
    }
  }

  // ── PART 10, 15: WHOLE FOODS & POSITIVE INGREDIENTS ───────────────────────
  let hasWholeFoods = false;
  if (detectKeywords(ingredientsL, ['whole grain', 'whole wheat', 'oat'])) {
    score += 10; hasWholeFoods = true; scoreReasons.push(`Whole Grains: +10`);
  }
  if (detectKeywords(ingredientsL, ['fruit', 'apple', 'banana', 'berry', 'mango'])) {
    score += 10; hasWholeFoods = true; scoreReasons.push(`Fruit: +10`);
  }
  if (detectKeywords(ingredientsL, ['vegetable', 'spinach', 'carrot', 'tomato'])) {
    score += 10; hasWholeFoods = true; scoreReasons.push(`Vegetables: +10`);
  }
  if (detectKeywords(ingredientsL, ['legume', 'lentil', 'chickpea', 'bean', 'pea'])) {
    score += 8; hasWholeFoods = true; scoreReasons.push(`Legumes: +8`);
  }
  if (detectKeywords(ingredientsL, ['nut', 'almond', 'cashew', 'walnut'])) {
    score += 8; hasWholeFoods = true; scoreReasons.push(`Nuts: +8`);
  }
  if (detectKeywords(ingredientsL, ['seed', 'chia', 'flax', 'pumpkin'])) {
    score += 5; hasWholeFoods = true; scoreReasons.push(`Seeds: +5`);
  }
  if (detectKeywords(ingredientsL, ['ferment', 'culture', 'kefir'])) {
    score += 5; hasWholeFoods = true; scoreReasons.push(`Fermented: +5`);
  }
  if (detectKeywords(ingredientsL, ['probiotic', 'bifido', 'lactobacillus'])) {
    score += 5; hasWholeFoods = true; scoreReasons.push(`Probiotics: +5`);
  }

  // ── PART 11-14: ADDITIVES ─────────────────────────────────────────────────
  const allAdditives = [...new Set([...product.additives, ...Object.keys(product.dynamicAdditives || {})])];
  let highRiskAdditiveCount = 0;
  
  for (const code of allAdditives) {
    const additive = product.dynamicAdditives?.[code] || ADDITIVES_DB[code];
    let penalty = 0;
    
    if (additive) {
      if (additive.hazard === 'hazardous') penalty = 15; 
      else if (additive.hazard === 'harmful') penalty = 7;
      else if (additive.hazard === 'caution') penalty = 3;
      else if (additive.hazard === 'mild') penalty = 1;
    } else {
      penalty = 3;
    }

    if (penalty >= 7) highRiskAdditiveCount++;
    if (penalty > 0) {
      score -= penalty;
      scoreReasons.push(`${code} (${additive?.hazard || 'unknown'}): -${penalty}`);
    }
  }

  if (highRiskAdditiveCount >= 3) {
    score -= 10;
    scoreReasons.push(`Multiple High-Risk Additives: -10`);
  }

  // Artificial Colors
  if (detectKeywords(ingredientsL, ['tartrazine', 'sunset yellow', 'allura red', 'ponceau'])) {
    score -= 10;
    scoreReasons.push(`High Concern Artificial Color: -10`);
    mainConcerns.push('Artificial Colors: May affect sensitive individuals.');
  }

  // Sweeteners
  const sweetenerIdx = getIngredientIndex(ingredientsL, ['aspartame', 'sucralose', 'acesulfame', 'saccharin', 'erythritol', 'stevia (highly processed)']);
  if (sweetenerIdx !== -1) {
    let p = 8;
    if (sweetenerIdx === 0) p = 16;
    else if (sweetenerIdx <= 2) p = 12;
    score -= p;
    scoreReasons.push(`Artificial Sweetener: -${p}`);
  }

  // ── POSITIVE SCORE ELIGIBILITY ────────────────────────────────────────────
  const hasHighProtein = (n.protein !== null && n.protein > 8);
  const hasHighFiber = (n.fiber !== null && n.fiber > 3);
  if (!(hasWholeFoods || hasHighProtein || hasHighFiber) && score > 85) {
    score = 85;
    scoreReasons.push(`Cap (No Meaningful Health Promoters): Max 85`);
  }

  // ── FINAL CLAMP ───────────────────────────────────────────────────────────
  score = Math.max(0, Math.min(100, Math.round(score)));

  // ── PART 16: CATEGORY VALIDATION ──────────────────────────────────────────
  if (combinedText.includes('cola') || combinedText.includes('soda')) {
    if (score > 60) {
      score -= 20; scoreReasons.push(`Category Penalty (Cola): -20`);
    }
  } else if (combinedText.includes('energy drink')) {
    if (score > 60) {
      score -= 20; scoreReasons.push(`Category Penalty (Energy Drink): -20`);
    }
  } else if (combinedText.includes('instant noodle') || combinedText.includes('maggi') || combinedText.includes('yippee')) {
    if (score > 65) {
      score -= 20; scoreReasons.push(`Category Penalty (Instant Noodle): -20`);
    }
  } else if (combinedText.includes('candy') || combinedText.includes('chocolate bar')) {
    if (score > 55) {
      score -= 15; scoreReasons.push(`Category Penalty (Candy): -15`);
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  // ── PART 17: VERDICT GENERATION ───────────────────────────────────────────
  let verdict: HazardLevel = 'safe';
  let dietAdvice = '';

  if (score >= 90) {
    verdict = 'safe';
    dietAdvice = 'Excellent nutritional profile. Suitable for regular consumption.';
  } else if (score >= 75) {
    verdict = 'safe';
    dietAdvice = 'Good choice. Generally healthy with minor concerns.';
  } else if (score >= 60) {
    verdict = 'mild';
    dietAdvice = 'Fair choice. Consume in moderation.';
  } else if (score >= 40) {
    verdict = 'caution';
    dietAdvice = 'Poor nutritional quality. Occasional consumption recommended.';
  } else {
    verdict = 'hazardous';
    dietAdvice = 'High concern. Frequent consumption not recommended.';
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