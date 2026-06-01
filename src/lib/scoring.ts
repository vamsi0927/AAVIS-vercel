import { Product, UserProfile, HazardLevel, ScanResult } from './types';
import { ADDITIVES_DB } from '../data/additives';
import { classifyIngredient } from './ingredientRisk';

export function isBeverage(product: Product): boolean {
  if (product.productType === 'beverage') return true;
  if (product.productType === 'food') return false;

  const nameL = product.name.toLowerCase();
  const ingrL = product.ingredients.join(' ').toLowerCase();
  const beverageKeywords = ['drink', 'soda', 'juice', 'water', 'cola', 'beverage', 'tea', 'coffee', 'liquid', 'syrup', 'squash', 'nectar'];
  
  if (beverageKeywords.some(kw => nameL.includes(kw))) return true;
  if ((ingrL.startsWith('carbonated water') || ingrL.startsWith('water')) && (ingrL.includes('sugar') || ingrL.includes('syrup'))) return true;
  return false;
}

export function validateNutritionData(n: any): { valid: boolean; confidenceDrop: number } {
  let drop = 0;
  if (n.sugar !== null && n.carbs !== null && n.sugar > n.carbs) drop += 30;
  if (n.fat !== null && n.fat > 100) drop += 30;
  if (n.protein !== null && n.protein > 100) drop += 30;
  if (n.calories !== null && n.calories > 1000) drop += 30; // Suspiciously high per 100g
  
  const hasNegative = Object.values(n).some((v) => typeof v === 'number' && v < 0);
  if (hasNegative) drop += 30;

  return { valid: drop === 0, confidenceDrop: drop };
}

function normalizeProduct(product: Product, warnings: string[]): { normalized: Product, confidence: number } {
  const n = product.rawNutrients ? { ...product.rawNutrients } : { ...product.nutrients };
  let confidence = 100;

  const validation = validateNutritionData(n);
  if (!validation.valid) {
    confidence -= validation.confidenceDrop;
    warnings.push("Nutrition data may contain OCR extraction errors (impossible values detected).");
  }

  const isDrink = isBeverage(product);
  const targetUnit = isDrink ? '100ml' : '100g';
  let factor = 1;

  const unitStr = (n.unit || '').toLowerCase();
  let match = unitStr.match(/(\d+(?:\.\d+)?)\s*(g|ml|oz)/);
  
  // If unit wasn't in OCR but we have a servingSize string
  if (!match && product.servingSize) {
    match = product.servingSize.toLowerCase().match(/(\d+(?:\.\d+)?)\s*(g|ml|oz)/);
  }

  if (match) {
    let amount = parseFloat(match[1]);
    const unit = match[2];
    
    // Convert ounces to grams (1 oz = 28.3495g)
    if (unit === 'oz') {
      amount = amount * 28.3495;
    }

    if (amount > 0 && amount !== 100) {
      factor = 100 / amount;
    }
  } else {
    // Unknown Unit Fallback
    confidence -= 20;
    warnings.push("Unable to detect serving size or unit. Scoring raw values as a fallback.");
  }

  const scale = (val: number | null) => val !== null ? Number((val * factor).toFixed(2)) : null;

  const normalizedNutrients = {
    unit: targetUnit,
    calories: scale(n.calories),
    sugar: scale(n.sugar),
    sodium: scale(n.sodium),
    fat: scale(n.fat),
    satFat: scale(n.satFat),
    protein: scale(n.protein),
    fiber: scale(n.fiber),
    carbs: scale(n.carbs)
  };

  console.log(`\n[NORMALIZATION]\nRaw Values: ${JSON.stringify(n)}\nServing Size: ${product.servingSize || 'Unknown'}\nNormalized Values: ${JSON.stringify(normalizedNutrients)}\n`);

  return {
    normalized: {
      ...product,
      normalizedNutrients,
      // For legacy reasons in this file, we map it over the main nutrients object as well
      nutrients: normalizedNutrients
    },
    confidence: Math.max(0, confidence)
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
  const warnings: string[] = [];
  const scoreReasons: string[] = [];
  const mainConcerns: string[] = [];
  const personalizedWarnings: string[] = [];

  const { normalized: product, confidence } = normalizeProduct(rawProduct, warnings);
  const n = product.normalizedNutrients || product.nutrients;
  const rawN = product.rawNutrients || product.nutrients;
  const isDrink = isBeverage(product);
  
  let score = 100;
  
  let consumptionImpact: 'Low' | 'Moderate' | 'High' = 'Moderate';
  if (rawN) {
    if (
      (rawN.calories && rawN.calories > 300) ||
      (rawN.sugar && rawN.sugar > 15) ||
      (rawN.sodium && rawN.sodium > 400) ||
      (rawN.satFat && rawN.satFat > 5)
    ) {
      consumptionImpact = 'High';
    } else if (
      (rawN.calories && rawN.calories < 100) &&
      (rawN.sugar && rawN.sugar < 5) &&
      (rawN.sodium && rawN.sodium < 100)
    ) {
      consumptionImpact = 'Low';
    }
  }

  let servingWarning = '';
  if (product.servingSize) {
    const match = product.servingSize.match(/(\d+(?:\.\d+)?)\s*(g|ml|oz)/);
    if (match) {
      const amt = parseFloat(match[1]);
      if (amt <= 25) {
        servingWarning = "Manufacturer serving size is very small and may underestimate real-world consumption.";
      } else if (amt > 300) {
        servingWarning = "Large serving size may exaggerate nutritional impact if you don't consume the entire portion.";
      }
    }
  }

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
  let satFatPenalty = 0;
  let processingPenalty = 0;
  let proteinBonus = 0;
  let fiberBonus = 0;

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
    if (n.satFat >= 10) satFatPenalty = 25;
    else if (n.satFat >= 5) satFatPenalty = 15;
    else if (n.satFat >= 3) satFatPenalty = 8;
    else if (n.satFat >= 1) satFatPenalty = 3;
    if (satFatPenalty > 0) {
      score -= satFatPenalty;
      scoreReasons.push(`Saturated Fat (${n.satFat}g): -${satFatPenalty}`);
    }
  }

  // ── STEP 5: TRANS FAT ─────────────────────────────────────────────────────
  if (detectKeywords(ingredientsL, ['partially hydrogenated', 'hydrogenated oil', 'trans fat'])) {
    score -= 25;
    scoreReasons.push(`Trans Fat detected: -25`);
    mainConcerns.push('Trans Fats: Extremely harmful for cardiovascular health.');
  }

  // ── STEP 6: REFINED FLOUR PENALTY ─────────────────────────────────────────
  const flourIdx = getIngredientIndex(ingredientsL, ['wheat flour', 'refined wheat', 'maida', 'bleached flour']);
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
    processingPenalty = 15;
    score -= processingPenalty; // v3.1 adjustment
    scoreReasons.push(`Ultra-Processed (NOVA 4): -${processingPenalty}`);
    mainConcerns.push('Ultra-Processed: Associated with poorer long-term health outcomes.');
  }

  // ── STEP 11.5: GENERAL INGREDIENT HAZARD PENALTY ──────────────────────────
  let ingredientHazardPenalty = 0;
  product.ingredients.forEach(ing => {
    const risk = classifyIngredient(ing);
    let pen = 0;
    if (risk.level === 'hazardous') pen = 12;
    else if (risk.level === 'harmful') pen = 6;
    else if (risk.level === 'moderate' || risk.level === 'caution') pen = 2;
    
    if (pen > 0) {
      ingredientHazardPenalty += pen;
      scoreReasons.push(`Ingredient Risk (${ing}): -${pen}`);
    }
  });

  if (ingredientHazardPenalty > 30) ingredientHazardPenalty = 30; // Cap
  if (ingredientHazardPenalty > 0) {
    score -= ingredientHazardPenalty;
    if (ingredientHazardPenalty > 10) mainConcerns.push('Contains harmful or risky ingredients.');
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
    if (n.fiber >= 8) fiberBonus = 15;
    else if (n.fiber >= 5) fiberBonus = 10;
    else if (n.fiber >= 2) fiberBonus = 5;

    fiberBonus = Math.round(fiberBonus * bonusMultiplier);
    if (fiberBonus > 0) {
      score += fiberBonus;
      scoreReasons.push(`Fiber (${n.fiber}g): +${fiberBonus}`);
    }
  }

  // ── STEP 9: PROTEIN BONUS ─────────────────────────────────────────────────
  if (n.protein !== null) {
    if (n.protein >= 20) proteinBonus = 15;
    else if (n.protein >= 10) proteinBonus = 10;
    else if (n.protein >= 5) proteinBonus = 5;

    proteinBonus = Math.round(proteinBonus * bonusMultiplier);
    if (proteinBonus > 0) {
      score += proteinBonus;
      scoreReasons.push(`Protein (${n.protein}g): +${proteinBonus}`);
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
  let verdictText = '';
  if (score >= 70) verdict = 'safe';
  else if (score >= 40) verdict = 'caution';
  else verdict = 'hazardous';

  // Synthesize dynamic reasoning for the verdict
  const drivingFactors = [];
  if (sugarPenalty >= 30) drivingFactors.push("an excessively high amount of sugar");
  else if (sugarPenalty >= 15) drivingFactors.push("a high amount of sugar");
  
  if (sodiumPenalty >= 20) drivingFactors.push("dangerous sodium levels");
  
  if (detectKeywords(ingredientsL, ['partially hydrogenated', 'hydrogenated oil', 'trans fat'])) {
    drivingFactors.push("harmful trans fats");
  }
  
  if (totalAdditivePenalty >= 10) {
    drivingFactors.push("multiple chemical additives and preservatives");
  }
  
  if (upfHeuristic || detectKeywords(ingredientsL, upfMarkers)) {
    drivingFactors.push("highly processed ingredients");
  }

  if (flourIdx === 0) {
    drivingFactors.push("mostly refined flours instead of whole grains");
  }

  let factorsText = "";
  if (drivingFactors.length === 1) {
    factorsText = drivingFactors[0];
  } else if (drivingFactors.length === 2) {
    factorsText = `${drivingFactors[0]} and ${drivingFactors[1]}`;
  } else if (drivingFactors.length > 2) {
    const last = drivingFactors.pop();
    factorsText = `${drivingFactors.join(', ')}, and ${last}`;
  }

  if (score < 40) {
    if (factorsText) {
      dietAdvice = `This product scored poorly (${score}/100) mostly because it contains ${factorsText}. Because of these factors, we highly recommend avoiding it or consuming it only on rare occasions.`;
    } else {
      dietAdvice = `This product scored poorly (${score}/100). It lacks nutritional value and is highly processed. We recommend looking for healthier alternatives.`;
    }
  } else if (score < 70) {
    if (factorsText) {
      dietAdvice = `This product has a moderate score (${score}/100). While it's not the worst choice, you should be careful because it contains ${factorsText}. It's fine for occasional consumption, but try not to make it a daily habit.`;
    } else {
      dietAdvice = `This product has a moderate score (${score}/100). It's an okay choice for occasional consumption, but there are cleaner alternatives available.`;
    }
  } else {
    if (factorsText) {
      dietAdvice = `This product scored very well (${score}/100)! It's a great choice, though keep in mind it does contain some ${drivingFactors[0] || factorsText}. Overall, it is nutritious and safe for regular consumption.`;
    } else {
      dietAdvice = `This product scored excellently (${score}/100)! It has a very clean nutritional profile with minimal processing and no harmful additives. It is a fantastic choice to include in your daily diet.`;
    }
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
    consumptionImpact,
    servingWarning,
    nutritionConfidence: confidence,
    scoreBreakdown: {
      sugarPenalty,
      sodiumPenalty,
      satFatPenalty,
      additivePenalty: totalAdditivePenalty,
      processingPenalty,
      proteinBonus,
      fiberBonus,
      wholeFoodBonus: wfBonus,
      finalScore: score
    }
  };
}