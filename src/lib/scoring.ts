/**
 * Aavis Health Scoring Engine — v3 (Realistic Multi-Factor)
 *
 * Scores are determined by 6 weighted pillars evaluated together:
 *
 *  1. Nutrition quality     (macros: sugar, sodium, sat fat, trans fat, fiber, protein)
 *  2. Ingredient quality    (ultra-processed markers, refined/hydrogenated oils)
 *  3. Additive risk         (per-additive penalty scaled by severity)
 *  4. Processing level      (NOVA-style classification)
 *  5. Oil quality           (cold-pressed vs refined vs hydrogenated)
 *  6. Personalized context  (user conditions, allergens)
 *
 * Verdict bands (realistic):
 *   80–100  → "Excellent"  (safe)
 *   60–79   → "Good"       (safe)
 *   45–59   → "Moderate"   (caution)
 *   25–44   → "Caution"    (caution)
 *   0–24    → "Poor"       (hazardous)
 *
 * Marketing claim bypass: fortification vitamins, "lite", "natural", "healthy"
 * labels do NOT grant score bonuses. They are heuristically detected and ignored.
 */

import { Product, UserProfile, HazardLevel, ScanResult } from './types';
import { ADDITIVES_DB } from '../data/additives';
import { classifyIngredient } from './ingredientRisk';

// ─── Additive penalty table (per E-code / name keyword) ──────────────────────
// Keyed by lowercase name fragment or E-code.  Penalty = points deducted.
const ADDITIVE_PENALTIES: Record<string, number> = {
  // ── High-risk preservatives & antioxidants ──
  'e319':             20,  // TBHQ
  'tbhq':             20,
  'tert-butylhydroquinone': 20,
  'e320':             18,  // BHA
  'bha':              18,
  'butylated hydroxyanisole': 18,
  'e321':             14,  // BHT
  'bht':              14,
  'butylated hydroxytoluene': 14,
  'e211':             18,  // Sodium benzoate
  'sodium benzoate':  18,
  'e210':             18,  // Benzoic acid
  'e212':             15,  // Potassium benzoate
  'e250':             22,  // Sodium nitrite
  'sodium nitrite':   22,
  'e251':             20,  // Sodium nitrate
  'sodium nitrate':   20,
  'e252':             18,  // Potassium nitrate
  'potassium bromate': 25, // Banned in many countries
  'e924':             25,

  // ── Artificial colorants ──
  'e102':             18,  // Tartrazine
  'tartrazine':       18,
  'e104':             14,  // Quinoline yellow
  'e110':             16,  // Sunset yellow
  'sunset yellow':    16,
  'e122':             16,  // Carmoisine
  'carmoisine':       16,
  'e124':             16,  // Ponceau 4R
  'e129':             16,  // Allura red
  'allura red':       16,
  'e133':              8,  // Brilliant blue (caution)
  'e132':              8,  // Indigo carmine
  'e151':             12,  // Brilliant black

  // ── Artificial sweeteners ──
  'e951':             20,  // Aspartame
  'aspartame':        20,
  'e950':             12,  // Acesulfame K
  'acesulfame':       12,
  'e954':             14,  // Saccharin
  'saccharin':        14,
  'e955':              8,  // Sucralose (caution)
  'sucralose':         8,
  'e968':              6,  // Erythritol (mild)
  'cyclamate':        20,  // Banned in US

  // ── Controversial emulsifiers / thickeners ──
  'e433':             14,  // Polysorbate 80
  'polysorbate 80':   14,
  'e432':             12,  // Polysorbate 20
  'e407':             12,  // Carrageenan
  'carrageenan':      12,
  'e466':             10,  // CMC / carboxymethyl cellulose
  'e471':              6,  // Mono- and diglycerides (depends on source)
  'e472e':            10,  // DATEM (common in bread)

  // ── Problematic fats ──
  'partially hydrogenated': 25,
  'hydrogenated vegetable': 20,
  'hydrogenated oil': 20,
  'interesterified': 14,

  // ── Titanium dioxide ──
  'e171':             16,  // Banned in EU as food additive
  'titanium dioxide': 16,

  // ── Less severe but still notable ──
  'e150d':             8,  // Sulphite ammonia caramel (4-MEI risk)
  'e621':              8,  // MSG
  'monosodium glutamate': 8,
  'e627':              6,  // Disodium guanylate
  'e631':              6,  // Disodium inosinate
};

// ─── Oil quality classifier ───────────────────────────────────────────────────

interface OilRating { penalty: number; reason: string }

function rateOil(ingredientLower: string): OilRating | null {
  // Hydrogenated → worst
  if (ingredientLower.includes('partially hydrogenated') ||
      ingredientLower.includes('hydrogenated vegetable') ||
      ingredientLower.includes('vanaspati')) {
    return { penalty: 22, reason: 'Hydrogenated/trans-fat oil — highest cardiovascular risk.' };
  }
  // Interesterified
  if (ingredientLower.includes('interesterified')) {
    return { penalty: 14, reason: 'Interesterified fat — heavily processed industrial oil.' };
  }
  // Refined industrial seed oils
  if (ingredientLower.match(/refined (sunflower|soybean|canola|corn|cottonseed|safflower|rice bran) oil/)) {
    return { penalty: 10, reason: 'Refined industrial seed oil — high omega-6, stripped of nutrients.' };
  }
  if (ingredientLower.includes('palmolein') ||
      (ingredientLower.includes('palm oil') && !ingredientLower.includes('palm kernel'))) {
    return { penalty: 10, reason: 'Refined palm oil — high saturated fat, environmental concerns.' };
  }
  if (ingredientLower.includes('vegetable oil') && !ingredientLower.includes('cold')) {
    return { penalty: 8, reason: 'Generic refined vegetable oil — quality and source unknown.' };
  }
  if (ingredientLower.includes('canola oil') || ingredientLower.includes('soybean oil') ||
      ingredientLower.includes('corn oil') || ingredientLower.includes('cottonseed oil') ||
      ingredientLower.includes('sunflower oil')) {
    return { penalty: 8, reason: 'Refined seed oil — inflammatory omega-6 profile.' };
  }
  // Cold-pressed or traditional oils → no penalty, slight bonus
  if (ingredientLower.includes('cold-pressed') || ingredientLower.includes('extra virgin') ||
      ingredientLower.includes('cold pressed')) {
    return { penalty: -5, reason: '' }; // Small bonus (handled separately)
  }
  if (ingredientLower.includes('coconut oil') || ingredientLower.includes('mustard oil') ||
      ingredientLower.includes('groundnut oil') || ingredientLower.includes('sesame oil') ||
      ingredientLower.includes('olive oil')) {
    return null; // Traditional oils — no penalty
  }
  return null;
}

// ─── Processing level estimator ──────────────────────────────────────────────

type ProcessingLevel = 'minimal' | 'moderate' | 'ultra';

function estimateProcessingLevel(ingredients: string[]): ProcessingLevel {
  const allText = ingredients.join(' ').toLowerCase();

  // Ultra-processing markers
  const ultraMarkers = [
    'modified starch', 'maltodextrin', 'hydrolyzed', 'emulsifier', 'stabilizer',
    'artificial flavor', 'artificial colour', 'artificial color', 'sodium benzoate',
    'tbhq', 'bha', 'bht', 'polysorbate', 'carrageenan', 'acesulfame', 'aspartame',
    'sucralose', 'saccharin', 'titanium dioxide', 'silicon dioxide', 'dextrose',
    'corn syrup', 'high fructose', 'maida', 'bleached flour', 'vanillin',
    'sodium tripolyphosphate', 'sodium caseinate', 'yeast extract', 'natural flavour',
    'natural flavor', 'caramel color', 'caramel colour', 'anticaking', 'anti-caking',
  ];

  let ultraScore = 0;
  for (const marker of ultraMarkers) {
    if (allText.includes(marker)) ultraScore++;
  }

  // Simple/minimal markers
  const minimalMarkers = ['water', 'salt', 'sugar', 'spice', 'turmeric', 'cumin', 'coriander'];
  const minimalCount = minimalMarkers.filter(m => allText.includes(m)).length;

  if (ultraScore >= 4) return 'ultra';
  if (ultraScore >= 2 || ingredients.length > 12) return 'moderate';
  if (minimalCount >= 2 && ingredients.length <= 8) return 'minimal';
  return 'moderate';
}

// ─── Marketing claim detector (bypass these) ─────────────────────────────────

function detectMarketingClaims(ingredients: string[], productName: string): string[] {
  const allText = (ingredients.join(' ') + ' ' + productName).toLowerCase();
  const claims: string[] = [];
  const claimKeywords = [
    ['fortified', '"Fortified with vitamins" — vitamins added to a heavily processed base do not make it healthy.'],
    ['cholesterol free', '"Cholesterol free" — plant-based products are naturally cholesterol-free; this is misleading.'],
    [' lite ', '"Lite" — may mean reduced fat but can have added sugar or artificial sweeteners.'],
    ['low fat', '"Low fat" — often compensated with added sugar or thickeners.'],
    ['zero sugar', '"Zero sugar" — often uses artificial sweeteners (aspartame, sucralose) instead.'],
    ['natural flavor', '"Natural flavor" — legally vague; can include highly processed extracts.'],
    ['no preservative', '"No preservatives" — may still contain high sugar/salt as natural preservatives.'],
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
  let score = 100;
  const warnings: string[] = [];
  const scoreReasons: string[] = [];
  const mainConcerns: string[] = [];
  const personalizedWarnings: string[] = [];
  const conditionsLower = (profile.conditions || []).map(c => c.toLowerCase());

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

  // ── PILLAR 1: Nutrition quality ───────────────────────────────────────────
  const n = product.nutrients;

  // Sugar
  if (n.sugar !== null) {
    if (n.sugar > 25)       { score -= 20; scoreReasons.push(`Very high sugar (${n.sugar}g/100g).`); mainConcerns.push('High Sugar: Strongly linked to obesity and insulin resistance.'); }
    else if (n.sugar > 12)  { score -= 12; scoreReasons.push(`High sugar (${n.sugar}g/100g).`); }
    else if (n.sugar > 6)   { score -= 5;  scoreReasons.push(`Moderate sugar (${n.sugar}g/100g).`); }
    else if (n.sugar <= 2)  { score += 4;  scoreReasons.push(`Low sugar (${n.sugar}g/100g) — positive.`); }
    if (conditionsLower.includes('diabetes') && n.sugar > 5) {
      score -= 18;
      personalizedWarnings.push(`High sugar (${n.sugar}g) is dangerous for Diabetes. Avoid.`);
    }
  }

  // Sodium
  if (n.sodium !== null) {
    if (n.sodium > 1000)       { score -= 18; scoreReasons.push(`Very high sodium (${n.sodium}mg/100g).`); mainConcerns.push('Dangerous Sodium Levels: Far above daily safe limits.'); }
    else if (n.sodium > 600)   { score -= 12; scoreReasons.push(`High sodium (${n.sodium}mg/100g).`); mainConcerns.push('High Sodium: Linked to hypertension and kidney strain.'); }
    else if (n.sodium > 300)   { score -= 6;  scoreReasons.push(`Moderate sodium (${n.sodium}mg/100g).`); }
    if ((conditionsLower.includes('hypertension') || conditionsLower.includes('heart disease')) && n.sodium > 150) {
      score -= 15;
      personalizedWarnings.push(`High sodium (${n.sodium}mg) is dangerous for hypertension/heart disease.`);
    }
  }

  // Saturated fat
  if (n.satFat !== null) {
    if (n.satFat > 10)     { score -= 14; scoreReasons.push(`Very high saturated fat (${n.satFat}g/100g).`); mainConcerns.push('High Saturated Fat: Raises LDL cholesterol.'); }
    else if (n.satFat > 5) { score -= 8;  scoreReasons.push(`High saturated fat (${n.satFat}g/100g).`); }
    else if (n.satFat > 2) { score -= 3;  scoreReasons.push(`Moderate saturated fat (${n.satFat}g/100g).`); }
  }

  // Calories density
  if (n.calories !== null) {
    if (n.calories > 500)      { score -= 10; scoreReasons.push(`High calorie density (${n.calories} kcal/100g).`); }
    else if (n.calories > 300) { score -= 4; }
  }

  // Fiber bonus (only meaningful in cleaner products — capped)
  if (n.fiber !== null && n.fiber > 5) {
    score += 5;
    scoreReasons.push(`Good dietary fiber (${n.fiber}g/100g) — positive.`);
  }

  // Protein bonus (only meaningful in cleaner products)
  if (n.protein !== null && n.protein > 12) {
    score += 4;
    scoreReasons.push(`Good protein content (${n.protein}g/100g) — positive.`);
  }

  // ── PILLAR 2: Ingredient quality & processing level ───────────────────────
  let ultraMarkerCount = 0;
  let refinedOilPenalties = 0;
  let processedSugarCount = 0;
  const oilWarnings: string[] = [];

  for (const ingr of product.ingredients) {
    const lower = ingr.toLowerCase();
    const risk = classifyIngredient(ingr);

    // Count ultra-processing markers weighted by severity
    if (risk.level === 'hazardous') ultraMarkerCount += 2.5;
    else if (risk.level === 'harmful')  ultraMarkerCount += 1.5;
    else if (risk.level === 'moderate') ultraMarkerCount += 0.75;
    else if (risk.level === 'mild')     ultraMarkerCount += 0.25;

    // Oil quality
    const oilRating = rateOil(lower);
    if (oilRating && oilRating.penalty > 0) {
      refinedOilPenalties += oilRating.penalty;
      if (oilRating.reason && !oilWarnings.includes(oilRating.reason)) {
        oilWarnings.push(oilRating.reason);
      }
    } else if (oilRating && oilRating.penalty < 0) {
      score += 4; // Cold-pressed bonus
      scoreReasons.push('Contains cold-pressed / extra virgin oil — positive.');
    }

    // Processed sugar markers
    if (lower.includes('dextrose') || lower.includes('maltodextrin') ||
        lower.includes('corn syrup') || lower.includes('glucose syrup') ||
        lower.includes('high fructose') || lower.includes('invert sugar')) {
      processedSugarCount++;
    }
  }

  // Processing level
  const processingLevel = estimateProcessingLevel(product.ingredients);
  if (processingLevel === 'ultra') {
    const penalty = Math.min(22, 8 + ultraMarkerCount * 1.2);
    score -= penalty;
    scoreReasons.push('Ultra-processed: Contains high density of synthetic/industrial ingredients.');
    mainConcerns.push('Ultra-Processed Food: Strongly associated with metabolic disease risk.');
  } else if (processingLevel === 'moderate') {
    const penalty = Math.min(10, 3 + ultraMarkerCount * 0.8);
    score -= penalty;
    if (ultraMarkerCount > 1) scoreReasons.push('Moderately processed: Contains several industrial additives.');
  }

  // Oil penalties (capped to avoid double-counting with ingredient risk)
  const cappedOilPenalty = Math.min(20, refinedOilPenalties);
  if (cappedOilPenalty > 0) {
    score -= cappedOilPenalty;
    for (const w of oilWarnings) {
      scoreReasons.push(w);
      mainConcerns.push(`Oil Quality: ${w}`);
    }
  }

  // Processed sugar stacking penalty
  if (processedSugarCount >= 3) {
    score -= 10;
    scoreReasons.push('Multiple processed sugar sources detected (stacking effect).');
  } else if (processedSugarCount >= 1) {
    score -= 4;
    scoreReasons.push('Contains processed sugar derivatives (dextrose / maltodextrin / corn syrup).');
  }

  // ── PILLAR 3: Additive risk penalties ────────────────────────────────────
  let totalAdditivePenalty = 0;
  let highRiskAdditiveCount = 0;
  const allAdditives = [...new Set([...product.additives, ...Object.keys(product.dynamicAdditives || {})])];

  for (const code of allAdditives) {
    const additive = product.dynamicAdditives?.[code] || ADDITIVES_DB[code];
    const codeL = code.toLowerCase();

    // First check our detailed penalty table by E-code
    let penalty = ADDITIVE_PENALTIES[codeL] ?? 0;

    // Also check by common name if found in DB
    if (!penalty && additive?.name) {
      const nameL = additive.name.toLowerCase();
      for (const [key, val] of Object.entries(ADDITIVE_PENALTIES)) {
        if (nameL.includes(key) || key.includes(nameL)) { penalty = val; break; }
      }
    }

    // Fallback to hazard field
    if (!penalty && additive) {
      if (additive.hazard === 'hazardous') penalty = 16;
      else if (additive.hazard === 'caution') penalty = 7;
    }

    if (penalty >= 16) highRiskAdditiveCount++;
    totalAdditivePenalty += penalty;
  }

  // Cap total additive penalty
  const cappedAdditivePenalty = Math.min(40, totalAdditivePenalty);
  if (cappedAdditivePenalty > 0) {
    score -= cappedAdditivePenalty;
    if (highRiskAdditiveCount > 0) {
      scoreReasons.push(`Contains ${highRiskAdditiveCount} high-risk additive(s) (e.g. TBHQ, artificial colours, synthetic preservatives).`);
      mainConcerns.push('Harmful Additives: Contains synthetic compounds with significant health concerns.');
    } else {
      scoreReasons.push('Contains moderate-risk additives that may affect sensitive individuals.');
    }
  }

  // ── PILLAR 4: Marketing claim bypass ─────────────────────────────────────
  const claims = detectMarketingClaims(product.ingredients, product.name);
  for (const claim of claims) {
    warnings.push(claim);
  }

  // ── PILLAR 5: Conditions-based personalized scoring ───────────────────────
  if (conditionsLower.includes('obesity') || conditionsLower.includes('overweight')) {
    if ((n.calories ?? 0) > 350) {
      score -= 10;
      personalizedWarnings.push(`High calorie density (${n.calories} kcal/100g) is a concern for weight management.`);
    }
  }
  if (conditionsLower.includes('kidney disease')) {
    if ((n.sodium ?? 0) > 200 || (n.protein ?? 0) > 20) {
      score -= 12;
      personalizedWarnings.push('High sodium or protein is dangerous for kidney disease. Consult your doctor before consuming.');
    }
  }
  if (conditionsLower.includes('heart disease') || conditionsLower.includes('cholesterol')) {
    if ((n.satFat ?? 0) > 3 || cappedOilPenalty > 5) {
      score -= 10;
      personalizedWarnings.push('Saturated/refined fat content is a risk factor for heart disease and high cholesterol.');
    }
  }
  if (conditionsLower.includes('ibs') || conditionsLower.includes('crohn')) {
    const ingrText = product.ingredients.join(' ').toLowerCase();
    if (ingrText.includes('carrageenan') || ingrText.includes('polysorbate') || ingrText.includes('cmc')) {
      score -= 10;
      personalizedWarnings.push('Emulsifiers (carrageenan, polysorbate) can worsen IBS/Crohn\'s disease symptoms.');
    }
  }

  // ── Final clamp ───────────────────────────────────────────────────────────
  score = Math.max(5, Math.min(100, Math.round(score)));

  // ── Verdict determination ─────────────────────────────────────────────────
  let verdict: HazardLevel = 'safe';
  let dietAdvice: string;

  if (score >= 80) {
    verdict = 'safe';
    dietAdvice = 'Excellent choice! Clean ingredients, good nutrition profile. Suitable for regular consumption.';
    scoreReasons.unshift('✅ Excellent: Clean label with good nutritional balance.');
  } else if (score >= 60) {
    verdict = 'safe';
    dietAdvice = 'Good product overall. Suitable for regular consumption with a balanced diet.';
    scoreReasons.unshift('✅ Good: Reasonable quality with minor concerns.');
  } else if (score >= 45) {
    verdict = 'caution';
    dietAdvice = 'Moderate quality. Occasional consumption is acceptable but avoid making it a daily staple.';
    scoreReasons.unshift('⚡ Moderate: Contains some processed ingredients. Consume with awareness.');
  } else if (score >= 25) {
    verdict = 'caution';
    dietAdvice = 'Caution advised. This product has notable quality concerns. Limit consumption.';
    scoreReasons.unshift('⚠️ Caution: Significant processing or additive load detected.');
    if (!mainConcerns.length) mainConcerns.push('Heavily processed product with multiple concerning additives or poor nutrition profile.');
  } else {
    verdict = 'hazardous';
    dietAdvice = 'Poor choice. Avoid or strongly limit consumption. Multiple significant health concerns detected.';
    scoreReasons.unshift('🚫 Poor: High-risk additives, ultra-processing, or dangerous nutrient levels.');
    if (!mainConcerns.length) mainConcerns.push('This product contains multiple high-risk additives and/or heavily processed ingredients.');
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