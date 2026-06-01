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

export const CATEGORY_RANGES: Record<string, { min: number; max: number }> = {
  'Whole Fruits': { min: 90, max: 100 },
  'Vegetables': { min: 85, max: 100 },
  'Nuts & Seeds': { min: 75, max: 95 },
  'Legumes': { min: 75, max: 95 },
  'Dairy': { min: 70, max: 95 },
  'Yogurt': { min: 75, max: 95 },
  'Cheese': { min: 50, max: 85 },
  'Beverages': { min: 30, max: 90 },
  'Soft Drinks / Cola': { min: 0, max: 35 },
  'Energy Drinks': { min: 0, max: 30 },
  'Fruit Juices': { min: 40, max: 75 },
  'Chips & Fried Snacks': { min: 15, max: 45 },
  'Instant Noodles': { min: 10, max: 50 },
  'Biscuits & Cookies': { min: 10, max: 45 },
  'Chocolates & Candy': { min: 0, max: 25 },
  'Breakfast Cereals': { min: 30, max: 75 },
  'Sauces & Condiments': { min: 10, max: 60 },
  'Processed Meats': { min: 5, max: 40 },
  'Frozen Meals': { min: 20, max: 65 },
  'Fast Food': { min: 5, max: 50 },
  'Bakery Products': { min: 20, max: 65 },
  'General Foods': { min: 5, max: 95 }
};

export function detectProductCategory(product: Product): string {
  if (product.productGenre) {
    // Exact match or fallback mapping
    const match = Object.keys(CATEGORY_RANGES).find(
      k => k.toLowerCase() === product.productGenre?.toLowerCase()
    );
    if (match) return match;
  }

  const nameL = product.name.toLowerCase();
  const ingrL = product.ingredients.join(' ').toLowerCase();

  if (nameL.includes('cola') || nameL.includes('pepsi') || nameL.includes('sprite') || nameL.includes('fanta') || nameL.includes('soda') || nameL.includes('coke') || nameL.includes('carbonated')) {
    return 'Soft Drinks / Cola';
  }
  if (nameL.includes('energy drink') || nameL.includes('red bull') || nameL.includes('monster energy') || nameL.includes('sting') || nameL.includes('gatorade')) {
    return 'Energy Drinks';
  }
  if (nameL.includes('juice') || nameL.includes('nectar') || nameL.includes('tropicana') || nameL.includes('real juice') || nameL.includes('pulpy')) {
    return 'Fruit Juices';
  }
  if (isBeverage(product)) {
    return 'Beverages';
  }
  if (nameL.includes('chips') || nameL.includes('crisps') || nameL.includes('kurkure') || nameL.includes('cheetos') || nameL.includes('lays') || nameL.includes('doritos') || nameL.includes('bhujia') || nameL.includes('namkeen') || nameL.includes('savory') || nameL.includes('popcorn') || nameL.includes('fry') || nameL.includes('puff') || nameL.includes('potato')) {
    return 'Chips & Fried Snacks';
  }
  if (nameL.includes('noodle') || nameL.includes('ramen') || nameL.includes('maggi') || nameL.includes('yippee') || nameL.includes('pasta') || nameL.includes('spaghetti')) {
    return 'Instant Noodles';
  }
  if (nameL.includes('cookie') || nameL.includes('biscuit') || nameL.includes('oreo') || nameL.includes('cookies')) {
    return 'Biscuits & Cookies';
  }
  if (nameL.includes('chocolate') || nameL.includes('candy') || nameL.includes('gummy') || nameL.includes('lollipop') || nameL.includes('caramel') || nameL.includes('fudge') || nameL.includes('sweet') || nameL.includes('confectionery') || nameL.includes('snickers') || nameL.includes('dairy milk') || nameL.includes('gems')) {
    return 'Chocolates & Candy';
  }
  if (nameL.includes('cereal') || nameL.includes('muesli') || nameL.includes('cornflakes') || nameL.includes('oats') || nameL.includes('granola') || nameL.includes('chocos')) {
    return 'Breakfast Cereals';
  }
  if (nameL.includes('sauce') || nameL.includes('ketchup') || nameL.includes('mayo') || nameL.includes('mustard') || nameL.includes('chutney') || nameL.includes('dressing') || nameL.includes('dip') || nameL.includes('spread') || nameL.includes('jam') || nameL.includes('honey')) {
    return 'Sauces & Condiments';
  }
  if (nameL.includes('sausage') || nameL.includes('bacon') || nameL.includes('salami') || nameL.includes('nugget') || nameL.includes('ham') || nameL.includes('meat') || nameL.includes('chicken') || nameL.includes('pepperoni') || nameL.includes('pork') || nameL.includes('beef') || nameL.includes('kabab')) {
    return 'Processed Meats';
  }
  if (nameL.includes('frozen') || nameL.includes('ready to eat') || nameL.includes('meal') || nameL.includes('tv dinner')) {
    return 'Frozen Meals';
  }
  if (nameL.includes('burger') || nameL.includes('pizza') || nameL.includes('fries') || nameL.includes('taco') || nameL.includes('hot dog') || nameL.includes('fast food')) {
    return 'Fast Food';
  }
  if (nameL.includes('bread') || nameL.includes('bun') || nameL.includes('pastry') || nameL.includes('cake') || nameL.includes('donut') || nameL.includes('bakery') || nameL.includes('croissant')) {
    return 'Bakery Products';
  }
  if (nameL.includes('yogurt') || nameL.includes('yoghurt') || nameL.includes('dahi') || nameL.includes('curd')) {
    return 'Yogurt';
  }
  if (nameL.includes('cheese') || nameL.includes('mozzarella') || nameL.includes('cheddar') || nameL.includes('paneer')) {
    return 'Cheese';
  }
  if (nameL.includes('milk') || nameL.includes('butter') || nameL.includes('ghee') || nameL.includes('cream')) {
    return 'Dairy';
  }
  if (nameL.includes('fruit') || nameL.includes('apple') || nameL.includes('banana') || nameL.includes('orange') || nameL.includes('mango') || nameL.includes('berry') || nameL.includes('grape')) {
    return 'Whole Fruits';
  }
  if (nameL.includes('vegetable') || nameL.includes('tomato') || nameL.includes('onion') || nameL.includes('spinach') || nameL.includes('carrot') || nameL.includes('salad')) {
    return 'Vegetables';
  }
  if (nameL.includes('nut') || nameL.includes('seed') || nameL.includes('almond') || nameL.includes('cashew') || nameL.includes('peanut') || nameL.includes('walnut') || nameL.includes('chia') || nameL.includes('sunflower')) {
    return 'Nuts & Seeds';
  }
  if (nameL.includes('legume') || nameL.includes('lentil') || nameL.includes('chickpea') || nameL.includes('pea') || nameL.includes('bean') || nameL.includes('dal')) {
    return 'Legumes';
  }

  return 'General Foods';
}

export function detectNovaGroup(ingredients: string[]): number {
  const ingrL = ingredients.map(i => i.toLowerCase());
  const combined = ingrL.join(' ');

  const upfKeywords = [
    'artificial flavour', 'artificial flavor',
    'artificial colour', 'artificial color',
    'maltodextrin', 'modified starch', 'modified wheat starch', 'modified corn starch',
    'flavor enhancer', 'flavour enhancer', 'e621', 'msg', 'monosodium glutamate', 'e627', 'e631',
    'tripolyphosphate', 'sodium tripolyphosphate',
    'sweetener', 'aspartame', 'sucralose', 'acesulfame', 'saccharin', 'neotame',
    'hydrogenated oil', 'partially hydrogenated',
    'emulsifier', 'soy lecithin', 'lecithin', 'polyglycerol polyricinoleate', 'pgpr',
    'stabilizer', 'carrageenan', 'xanthan gum', 'guar gum', 'cellulose gum',
    'preservative', 'sodium benzoate', 'potassium sorbate', 'calcium propionate'
  ];

  const hasUpfKeyword = upfKeywords.some(kw => combined.includes(kw) || ingrL.some(i => i.includes(kw)));
  
  if (hasUpfKeyword) return 4;
  
  const processedKeywords = ['salt', 'sugar', 'oil', 'yeast', 'vinegar'];
  const hasProcessed = processedKeywords.some(kw => combined.includes(kw));
  if (hasProcessed) return 3;

  return 1;
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
  
  // ── STEP 1: IDENTIFY FOOD CATEGORY ──
  const category = detectProductCategory(product);
  scoreReasons.push(`Food Category: ${category}`);

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

  const ingredientsL = product.ingredients.map(i => i.toLowerCase());
  const combinedText = ingredientsL.join(' ') + ' ' + product.name.toLowerCase();

  // ── STEP 3: DETECT ULTRA-PROCESSED FOODS (NOVA Group) ──
  const calculatedNova = detectNovaGroup(product.ingredients);
  const nova = product.novaGroup || calculatedNova;
  let processingPenalty = 0;
  if (nova === 4) {
    processingPenalty = 20;
    score -= processingPenalty;
    scoreReasons.push(`Ultra-Processed Food (NOVA 4): -${processingPenalty}`);
    mainConcerns.push('Ultra-Processed: Contains industrial additives linked to negative health outcomes.');
  }

  // ── STEP 4: ENERGY DENSITY PENALTY ──
  let energyDensityPenalty = 0;
  if (n.calories !== null) {
    const isHighEnergyAffected = ['Chips & Fried Snacks', 'Chocolates & Candy', 'Biscuits & Cookies'].includes(category);
    const multiplier = isHighEnergyAffected ? 1.5 : 1.0;
    
    if (n.calories > 500) {
      energyDensityPenalty = Math.round(25 * multiplier);
    } else if (n.calories > 400) {
      energyDensityPenalty = Math.round(15 * multiplier);
    } else if (n.calories > 300) {
      energyDensityPenalty = Math.round(8 * multiplier);
    }
    
    if (energyDensityPenalty > 0) {
      score -= energyDensityPenalty;
      scoreReasons.push(`Energy Density (${n.calories} kcal/100g): -${energyDensityPenalty}`);
    }
  }

  // ── STEP 5: NUTRIENT ANALYSIS ──
  let sugarPenalty = 0;
  let sodiumPenalty = 0;
  let satFatPenalty = 0;
  let transFatPenalty = 0;
  let proteinBonus = 0;
  let fiberBonus = 0;

  const isBeverageCategory = ['Beverages', 'Soft Drinks / Cola', 'Energy Drinks', 'Fruit Juices'].includes(category);

  // Sugar Penalty
  if (n.sugar !== null) {
    if (isBeverageCategory) {
      if (n.sugar >= 10) sugarPenalty = 40;
      else if (n.sugar >= 6) sugarPenalty = 25;
      else if (n.sugar >= 3) sugarPenalty = 10;
    } else {
      if (n.sugar >= 30) sugarPenalty = 35;
      else if (n.sugar >= 15) sugarPenalty = 20;
      else if (n.sugar >= 5) sugarPenalty = 8;
    }
    if (sugarPenalty > 0) {
      score -= sugarPenalty;
      scoreReasons.push(`High Sugar (${n.sugar}g): -${sugarPenalty}`);
      if (sugarPenalty >= 20) mainConcerns.push('Excessive Sugar: Risk of metabolic issues.');
    }
  }

  // Sodium Penalty
  if (n.sodium !== null) {
    // Cheese and Processed Meats have different baseline expectations, but we stick to standardized limits with slight adjustments
    let sodiumThreshMultiplier = category === 'Cheese' || category === 'Processed Meats' ? 1.2 : 1.0;
    const adjustedSodium = n.sodium / sodiumThreshMultiplier;

    if (adjustedSodium >= 1000) sodiumPenalty = 35;
    else if (adjustedSodium >= 600) sodiumPenalty = 25;
    else if (adjustedSodium >= 300) sodiumPenalty = 12;
    else if (adjustedSodium >= 120) sodiumPenalty = 5;

    if (sodiumPenalty > 0) {
      score -= sodiumPenalty;
      scoreReasons.push(`Sodium (${n.sodium}mg): -${sodiumPenalty}`);
      if (sodiumPenalty >= 25) mainConcerns.push('High Sodium: Risk of high blood pressure.');
    }
  }

  // Saturated Fat Penalty
  if (n.satFat !== null) {
    let satFatThreshMultiplier = category === 'Cheese' || category === 'Dairy' || category === 'Yogurt' ? 1.5 : 1.0;
    const adjustedSatFat = n.satFat / satFatThreshMultiplier;

    if (adjustedSatFat >= 10) satFatPenalty = 25;
    else if (adjustedSatFat >= 5) satFatPenalty = 15;
    else if (adjustedSatFat >= 2) satFatPenalty = 5;

    if (satFatPenalty > 0) {
      score -= satFatPenalty;
      scoreReasons.push(`Saturated Fat (${n.satFat}g): -${satFatPenalty}`);
    }
  }

  // Trans Fat Penalty
  const hasTransFat = detectKeywords(ingredientsL, ['partially hydrogenated', 'hydrogenated oil', 'trans fat']) || (n.transFat !== undefined && (n as any).transFat > 0);
  if (hasTransFat) {
    transFatPenalty = 25;
    score -= transFatPenalty;
    scoreReasons.push(`Trans Fat detected: -25`);
    mainConcerns.push('Trans Fats: Extremely harmful for cardiovascular health.');
  }

  // ── STEP 6: INGREDIENT QUALITY ──
  let flourPenalty = 0;
  let oilPenalty = 0;
  let sweetenerPenalty = 0;
  let nitritesPenalty = 0;
  let wholeFoodBonus = 0;

  // Palm Oil / Hydrogenated Oils
  if (detectKeywords(ingredientsL, ['palm oil', 'palmolein', 'hydrogenated oil', 'partially hydrogenated oil'])) {
    oilPenalty = 15;
    score -= oilPenalty;
    scoreReasons.push(`Palm / Hydrogenated Oil: -${oilPenalty}`);
  }

  // Artificial Sweeteners
  if (detectKeywords(ingredientsL, ['aspartame', 'sucralose', 'acesulfame', 'saccharin', 'neotame'])) {
    sweetenerPenalty = 15;
    score -= sweetenerPenalty;
    scoreReasons.push(`Artificial Sweeteners: -${sweetenerPenalty}`);
  }

  // Nitrites
  if (detectKeywords(ingredientsL, ['e250', 'sodium nitrite', 'e251', 'sodium nitrate'])) {
    nitritesPenalty = 30;
    score -= nitritesPenalty;
    scoreReasons.push(`Carcinogenic Nitrites (E250/E251): -${nitritesPenalty}`);
    mainConcerns.push('Carcinogenic Nitrites: Linked to colorectal cancer risk.');
  }

  // Refined Flour (Maida)
  const flourIdx = getIngredientIndex(ingredientsL, ['wheat flour', 'refined wheat', 'maida', 'bleached flour']);
  if (flourIdx === 0) {
    flourPenalty = 20;
    score -= flourPenalty;
    scoreReasons.push(`Refined Flour (Primary): -20`);
  } else if (flourIdx > 0) {
    flourPenalty = 10;
    score -= flourPenalty;
    scoreReasons.push(`Refined Flour: -10`);
  }

  // Rewards/Bonuses
  if (detectKeywords(ingredientsL, ['olive oil', 'avocado oil', 'mustard oil'])) {
    score += 5;
    scoreReasons.push(`Healthy Oil Bonus: +5`);
  }

  let wfCount = 0;
  if (detectKeywords(ingredientsL, ['whole grain', 'whole wheat', 'whole oats', 'oat'])) wfCount += 5;
  if (detectKeywords(ingredientsL, ['fruit', 'apple', 'banana', 'berry', 'mango'])) wfCount += 5;
  if (detectKeywords(ingredientsL, ['vegetable', 'spinach', 'carrot', 'tomato'])) wfCount += 5;
  if (detectKeywords(ingredientsL, ['legume', 'lentil', 'chickpea', 'pea'])) wfCount += 5;
  if (detectKeywords(ingredientsL, ['nut', 'almond', 'cashew', 'walnut'])) wfCount += 5;
  if (detectKeywords(ingredientsL, ['seed', 'chia', 'flax', 'pumpkin'])) wfCount += 5;
  if (detectKeywords(ingredientsL, ['probiotic', 'culture', 'kefir'])) wfCount += 5;

  wholeFoodBonus = Math.min(20, wfCount);
  if (wholeFoodBonus > 0) {
    score += wholeFoodBonus;
    scoreReasons.push(`Whole Foods & Probiotics: +${wholeFoodBonus}`);
  }

  // Fiber Bonus
  if (n.fiber !== null) {
    if (n.fiber >= 6) fiberBonus = 10;
    else if (n.fiber >= 3) fiberBonus = 5;
    if (fiberBonus > 0) {
      score += fiberBonus;
      scoreReasons.push(`Fiber (${n.fiber}g): +${fiberBonus}`);
    }
  }

  // Protein Bonus
  if (n.protein !== null) {
    if (n.protein >= 15) proteinBonus = 10;
    else if (n.protein >= 8) proteinBonus = 5;
    if (proteinBonus > 0) {
      score += proteinBonus;
      scoreReasons.push(`Protein (${n.protein}g): +${proteinBonus}`);
    }
  }

  // ── STEP 2: APPLY CATEGORY REALITY CHECK (Caps) ──
  const range = CATEGORY_RANGES[category] || CATEGORY_RANGES['General Foods'];
  
  // ── STEP 7: FINAL SANITY CHECK & USER PROFILE WARNINGS ──
  // Check if a nutritionist would consider this food healthy
  let nutritionistApproved = true;
  if (
    category === 'Chips & Fried Snacks' ||
    category === 'Soft Drinks / Cola' ||
    category === 'Energy Drinks' ||
    category === 'Chocolates & Candy' ||
    category === 'Processed Meats' ||
    nova === 4
  ) {
    nutritionistApproved = false;
  }

  // Enforce the specific rules:
  // - A fried potato chip product must never be labelled as 'Good Choice' (forced score < 70)
  if (category === 'Chips & Fried Snacks') {
    score = Math.min(69, score);
  }
  // - An ultra-processed instant noodle product must never be labelled as 'Excellent' (forced score < 90)
  if (category === 'Instant Noodles' && nova === 4) {
    score = Math.min(89, score);
  }
  // - A sugar-sweetened cola must never be labelled as 'Good' (forced score < 70)
  if (category === 'Soft Drinks / Cola' && n.sugar !== null && n.sugar > 5) {
    score = Math.min(69, score);
  }

  // Clamp the score strictly to the realistic range for its category
  const previousScore = score;
  score = Math.max(range.min, Math.min(range.max, Math.round(score)));
  if (score !== previousScore) {
    scoreReasons.push(`Category Reality Clamp (${category} range: ${range.min}-${range.max}): ${score}`);
  }

  // ── Allergen Check (Personalized - Deduct 30 points AFTER category clamp, or before? Let's do it after so it directly reflects user hazard) ──
  let allergenPenalty = 0;
  const matchedAllergens = product.allergens.filter(a =>
    (profile.allergens || []).map(x => x.toLowerCase()).includes(a.toLowerCase())
  );
  if (matchedAllergens.length > 0) {
    allergenPenalty = 30;
    score -= allergenPenalty;
    const allergenList = matchedAllergens.map(a => a.charAt(0).toUpperCase() + a.slice(1)).join(', ');
    scoreReasons.push(`Allergens Detected (${allergenList}): -30`);
    mainConcerns.push(`Allergen Alert: Contains ${allergenList}`);
    personalizedWarnings.push(`Avoid this product due to ${allergenList} allergy.`);
  }

  // Clamp absolute final score
  score = Math.max(5, Math.min(100, score));

  // ── STEP 7: FINAL VERDICT ──
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

  const drivingFactors = [];
  if (sugarPenalty >= 25) drivingFactors.push("excess sugar");
  if (sodiumPenalty >= 25) drivingFactors.push("high sodium levels");
  if (hasTransFat) drivingFactors.push("toxic trans fats");
  if (oilPenalty > 0) drivingFactors.push("palm/hydrogenated oils");
  if (nova === 4) drivingFactors.push("ultra-processing (NOVA 4)");

  if (score < 70 && drivingFactors.length > 0) {
    dietAdvice = `${prefix} This product's score is primarily driven by ${drivingFactors.join(', and ')}. Frequent consumption is discouraged.`;
  } else if (score >= 70) {
    if (drivingFactors.length > 0) {
      dietAdvice = `${prefix} Generally a reasonable choice, though it contains some ${drivingFactors[0]}. Suitable for moderate consumption.`;
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
    consumptionImpact,
    servingWarning,
    nutritionConfidence: confidence,
    scoreBreakdown: {
      sugarPenalty,
      sodiumPenalty,
      satFatPenalty,
      transFatPenalty,
      energyDensityPenalty,
      flourPenalty,
      oilPenalty,
      additivePenalty: totalAdditivePenalty,
      processingPenalty,
      ingredientHazardPenalty: Math.min(30, sweetenerPenalty + nitritesPenalty),
      allergenPenalty,
      proteinBonus,
      fiberBonus,
      wholeFoodBonus,
      finalScore: score
    }
  };
}