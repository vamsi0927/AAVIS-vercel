/**
 * OCR Label Analysis Engine
 * Parses raw text from food labels to extract structured product data.
 */

import { Product, Nutrients, HazardLevel } from './types';
import { ADDITIVES_DB } from '../data/additives';

// ─── Harmful Ingredient Database ───────────────────────────────────
export interface HarmfulIngredient {
  name: string;
  aliases: string[];
  reason: string;
  severity: HazardLevel;
  ageRestriction?: string;       // e.g. "Not recommended for children under 3"
  diseaseWarnings?: string[];    // e.g. ["Diabetes", "Hypertension"]
}

export const HARMFUL_INGREDIENTS_DB: HarmfulIngredient[] = [
  // ── Artificial Colors ──
  { name: 'Tartrazine (E102)', aliases: ['tartrazine', 'e102', 'fd&c yellow 5', 'yellow 5'], reason: 'Synthetic dye linked to hyperactivity in children and allergic reactions.', severity: 'hazardous', ageRestriction: 'Avoid for children under 12', diseaseWarnings: ['Asthma', 'ADHD'] },
  { name: 'Sunset Yellow (E110)', aliases: ['sunset yellow', 'e110', 'fd&c yellow 6', 'yellow 6'], reason: 'Synthetic dye associated with hyperactivity and allergic reactions.', severity: 'hazardous', ageRestriction: 'Avoid for children under 12' },
  { name: 'Carmoisine (E122)', aliases: ['carmoisine', 'e122', 'azorubine'], reason: 'Azo dye linked to allergic reactions. Banned in some countries.', severity: 'hazardous' },
  { name: 'Allura Red (E129)', aliases: ['allura red', 'e129', 'fd&c red 40', 'red 40'], reason: 'Linked to hyperactivity in children. Most used artificial color.', severity: 'hazardous', ageRestriction: 'Avoid for children under 12' },
  { name: 'Brilliant Blue (E133)', aliases: ['brilliant blue', 'e133', 'fd&c blue 1', 'blue 1'], reason: 'Synthetic dye. Generally safe but may cause reactions in sensitive individuals.', severity: 'caution' },
  { name: 'Carmine (E120)', aliases: ['carmine', 'e120', 'cochineal', 'natural red 4'], reason: 'Insect-derived red dye. Severe allergy risk; not vegan.', severity: 'caution', diseaseWarnings: ['Allergies'] },

  // ── Preservatives ──
  { name: 'Sodium Benzoate (E211)', aliases: ['sodium benzoate', 'e211'], reason: 'Can form benzene (a carcinogen) when combined with Vitamin C.', severity: 'hazardous', diseaseWarnings: ['Asthma'] },
  { name: 'Potassium Benzoate (E212)', aliases: ['potassium benzoate', 'e212'], reason: 'Same benzene risk as Sodium Benzoate.', severity: 'hazardous' },
  { name: 'Sodium Nitrite (E250)', aliases: ['sodium nitrite', 'e250', 'nitrite'], reason: 'Used in cured meats. Can form carcinogenic nitrosamines.', severity: 'hazardous', diseaseWarnings: ['Cancer risk'] },
  { name: 'Sodium Nitrate (E251)', aliases: ['sodium nitrate', 'e251', 'nitrate'], reason: 'Converts to nitrite in the body. Carcinogenic risk.', severity: 'hazardous' },
  { name: 'BHA (E320)', aliases: ['bha', 'e320', 'butylated hydroxyanisole'], reason: 'Possible human carcinogen (IARC Group 2B).', severity: 'hazardous' },
  { name: 'BHT (E321)', aliases: ['bht', 'e321', 'butylated hydroxytoluene'], reason: 'Controversial antioxidant. May affect liver and kidneys.', severity: 'caution' },
  { name: 'TBHQ (E319)', aliases: ['tbhq', 'e319', 'tert-butylhydroquinone'], reason: 'Synthetic antioxidant. May cause nausea at high doses.', severity: 'caution' },
  { name: 'Potassium Sorbate (E202)', aliases: ['potassium sorbate', 'e202'], reason: 'Generally safe preservative. Rare skin irritation.', severity: 'safe' },

  // ── Artificial Sweeteners ──
  { name: 'Aspartame (E951)', aliases: ['aspartame', 'e951'], reason: 'Artificial sweetener. People with PKU must avoid. IARC Group 2B possible carcinogen.', severity: 'hazardous', ageRestriction: 'Not recommended for children under 5', diseaseWarnings: ['PKU', 'Diabetes'] },
  { name: 'Sucralose (E955)', aliases: ['sucralose', 'e955', 'splenda'], reason: 'May alter gut microbiome with long-term use.', severity: 'caution', diseaseWarnings: ['Diabetes'] },
  { name: 'Acesulfame K (E950)', aliases: ['acesulfame potassium', 'acesulfame k', 'e950', 'ace-k'], reason: 'Artificial sweetener with limited long-term studies.', severity: 'caution' },
  { name: 'Saccharin (E954)', aliases: ['saccharin', 'e954'], reason: 'One of the oldest artificial sweeteners. Previously linked to cancer in lab animals.', severity: 'caution' },
  { name: 'High Fructose Corn Syrup', aliases: ['high fructose corn syrup', 'hfcs', 'corn syrup', 'glucose-fructose syrup', 'isoglucose'], reason: 'Linked to obesity, insulin resistance, and fatty liver disease.', severity: 'hazardous', diseaseWarnings: ['Diabetes', 'Obesity', 'Heart Disease'] },

  // ── Flavor Enhancers ──
  { name: 'MSG (E621)', aliases: ['msg', 'monosodium glutamate', 'e621', 'glutamate'], reason: 'May cause headaches, nausea ("Chinese restaurant syndrome") in sensitive people.', severity: 'caution' },
  { name: 'Disodium Guanylate (E627)', aliases: ['disodium guanylate', 'e627'], reason: 'Used with MSG. Avoid if you have gout or uric acid issues.', severity: 'caution', diseaseWarnings: ['Gout'] },
  { name: 'Disodium Inosinate (E631)', aliases: ['disodium inosinate', 'e631'], reason: 'Used with MSG. Avoid with gout.', severity: 'caution', diseaseWarnings: ['Gout'] },

  // ── Emulsifiers & Thickeners ──
  { name: 'Carrageenan (E407)', aliases: ['carrageenan', 'e407'], reason: 'Linked to gut inflammation and GI issues in some studies.', severity: 'caution', diseaseWarnings: ['IBS', 'Crohn\'s Disease'] },
  { name: 'Polysorbate 80 (E433)', aliases: ['polysorbate 80', 'e433'], reason: 'Emulsifier linked to gut inflammation and metabolic syndrome in studies.', severity: 'caution' },
  { name: 'Sodium Carboxymethyl Cellulose (E466)', aliases: ['carboxymethyl cellulose', 'e466', 'cmc'], reason: 'May disrupt gut microbiome and intestinal lining.', severity: 'caution' },

  // ── Trans Fats & Hydrogenated Oils ──
  { name: 'Partially Hydrogenated Oil', aliases: ['partially hydrogenated', 'hydrogenated oil', 'hydrogenated vegetable oil', 'trans fat'], reason: 'Contains trans fats — the most harmful type of dietary fat. Increases heart disease risk.', severity: 'hazardous', diseaseWarnings: ['Heart Disease', 'High Cholesterol', 'Obesity'] },
  { name: 'Palm Oil', aliases: ['palm oil', 'palm fat', 'palmitate'], reason: 'High in saturated fat. Environmental concerns. Linked to cardiovascular risk.', severity: 'caution', diseaseWarnings: ['Heart Disease', 'High Cholesterol'] },

  // ── Others ──
  { name: 'Potassium Bromate', aliases: ['potassium bromate', 'bromated flour'], reason: 'Banned in EU, India (FSSAI). Classified as possibly carcinogenic by IARC.', severity: 'hazardous' },
  { name: 'Sodium Cyclamate (E952)', aliases: ['sodium cyclamate', 'cyclamate', 'e952'], reason: 'Banned in the US. Possible bladder cancer risk.', severity: 'hazardous' },
  { name: 'Titanium Dioxide (E171)', aliases: ['titanium dioxide', 'e171'], reason: 'Banned in EU as food additive since 2022. Possible genotoxicity.', severity: 'hazardous' },
];

// ─── Allergen Detection ────────────────────────────────────────────
const ALLERGEN_KEYWORDS: Record<string, string[]> = {
  'gluten': ['wheat', 'barley', 'rye', 'oats', 'spelt', 'semolina', 'flour', 'maida', 'atta', 'gluten', 'triticale'],
  'dairy': ['milk', 'cream', 'butter', 'cheese', 'whey', 'casein', 'lactose', 'curd', 'yogurt', 'ghee', 'paneer', 'dairy'],
  'peanuts': ['peanut', 'groundnut', 'arachis'],
  'tree nuts': ['almond', 'cashew', 'walnut', 'pistachio', 'hazelnut', 'macadamia', 'pecan', 'brazil nut', 'tree nut'],
  'soy': ['soy', 'soya', 'soybean', 'edamame', 'tofu', 'tempeh', 'soy lecithin'],
  'eggs': ['egg', 'albumin', 'lysozyme', 'meringue', 'ovalbumin'],
  'shellfish': ['shrimp', 'crab', 'lobster', 'prawn', 'crayfish', 'shellfish', 'crustacean'],
  'fish': ['fish', 'anchovy', 'sardine', 'cod', 'salmon', 'tuna', 'mackerel'],
  'sesame': ['sesame', 'til', 'tahini'],
  'mustard': ['mustard', 'sarson'],
  'celery': ['celery'],
  'sulphites': ['sulphite', 'sulfite', 'sulphur dioxide', 'so2', 'e220', 'e221', 'e222', 'e223', 'e224', 'e226', 'e227', 'e228'],
};

// ─── Nutrition Value Extraction ────────────────────────────────────
interface ExtractedNutrition {
  calories: number;
  sugar: number;
  sodium: number;
  fat: number;
  satFat: number;
  protein: number;
  fiber: number;
  carbs: number;
}

function extractNutritionValues(text: string): ExtractedNutrition {
  const lower = text.toLowerCase();

  const extractVal = (patterns: RegExp[]): number | null => {
    for (const pattern of patterns) {
      const match = lower.match(pattern);
      if (match) {
        const val = parseFloat(match[1]);
        if (!isNaN(val)) return val;
      }
    }
    return null;
  };

  return {
    calories: extractVal([
      /(?:energy|calories|cal|kcal)[:\s]*(\d+(?:\.\d+)?)\s*(?:kcal|cal)?/,
      /(\d+(?:\.\d+)?)\s*(?:kcal|calories)/
    ]) ?? 0,
    sugar: extractVal([
      /(?:total\s+)?sugar[s]?[:\s]*(\d+(?:\.\d+)?)\s*g/,
      /sugar[s]?\s*[:\-]?\s*(\d+(?:\.\d+)?)/
    ]) ?? 0,
    sodium: extractVal([
      /sodium[:\s]*(\d+(?:\.\d+)?)\s*(?:mg|g)/,
      /salt[:\s]*(\d+(?:\.\d+)?)\s*(?:mg|g)/
    ]) ?? 0,
    fat: extractVal([
      /(?:total\s+)?fat[:\s]*(\d+(?:\.\d+)?)\s*g/,
      /fat\s*[:\-]?\s*(\d+(?:\.\d+)?)/
    ]) ?? 0,
    satFat: extractVal([
      /(?:saturated\s+fat|sat[\.\s]*fat)[:\s]*(\d+(?:\.\d+)?)\s*g/,
      /saturated[:\s]*(\d+(?:\.\d+)?)/
    ]) ?? 0,
    protein: extractVal([
      /protein[:\s]*(\d+(?:\.\d+)?)\s*g/,
      /protein\s*[:\-]?\s*(\d+(?:\.\d+)?)/
    ]) ?? 0,
    fiber: extractVal([
      /(?:dietary\s+)?fib(?:re|er)[:\s]*(\d+(?:\.\d+)?)\s*g/,
      /fib(?:re|er)\s*[:\-]?\s*(\d+(?:\.\d+)?)/
    ]) ?? 0,
    carbs: extractVal([
      /(?:total\s+)?carbohydrate[s]?[:\s]*(\d+(?:\.\d+)?)\s*g/,
      /carb[s]?\s*[:\-]?\s*(\d+(?:\.\d+)?)/
    ]) ?? 0,
  };
}

// ─── Main Analysis ─────────────────────────────────────────────────
export interface OCRAnalysisResult {
  product: Product;
  rawText: string;
  detectedHarmful: HarmfulIngredient[];
  detectedAllergens: string[];
  ageWarnings: string[];
  diseaseWarnings: string[];
  generalWarnings: string[];
}

export function analyzeOCRText(rawText: string): OCRAnalysisResult {
  const lower = rawText.toLowerCase();

  // 1. Detect harmful ingredients
  const detectedHarmful: HarmfulIngredient[] = [];
  const detectedAdditivesCodes: string[] = [];
  const seenHarmful = new Set<string>();

  for (const item of HARMFUL_INGREDIENTS_DB) {
    for (const alias of item.aliases) {
      if (lower.includes(alias) && !seenHarmful.has(item.name)) {
        detectedHarmful.push(item);
        seenHarmful.add(item.name);
        break;
      }
    }
  }

  // 2. Check ADDITIVES_DB for E-code matches
  for (const [code, additive] of Object.entries(ADDITIVES_DB)) {
    if (lower.includes(code.toLowerCase()) || lower.includes(additive.name.toLowerCase())) {
      if (!detectedAdditivesCodes.includes(code)) {
        detectedAdditivesCodes.push(code);
      }
    }
  }

  // 3. Detect allergens
  const detectedAllergens: string[] = [];
  for (const [allergen, keywords] of Object.entries(ALLERGEN_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        if (!detectedAllergens.includes(allergen)) {
          detectedAllergens.push(allergen);
        }
        break;
      }
    }
  }

  // 4. Extract ingredients list (look for "ingredients:" block)
  let ingredientsList: string[] = [];
  const ingMatch = rawText.match(/ingredients?\s*[:]\s*([\s\S]*?)(?:\n\s*\n|nutrition|allergen|contains|storage|best before|manufactured|$)/i);
  if (ingMatch) {
    ingredientsList = ingMatch[1]
      .split(/[,;•·]/)
      .map(s => s.replace(/[()[\]]/g, '').trim())
      .filter(s => s.length > 1 && s.length < 80);
  }
  if (ingredientsList.length === 0) {
    // Fallback: try to split the entire text by commas
    const commaTokens = rawText.split(/[,;]/).map(s => s.trim()).filter(s => s.length > 1 && s.length < 60);
    if (commaTokens.length >= 3) {
      ingredientsList = commaTokens.slice(0, 30);
    }
  }

  // 5. Extract nutrition values
  const nutrition = extractNutritionValues(rawText);

  // 6. Build warnings
  const ageWarnings: string[] = [];
  const diseaseWarnings: string[] = [];
  const generalWarnings: string[] = [];
  const seenDiseaseWarnings = new Set<string>();

  for (const item of detectedHarmful) {
    generalWarnings.push(`⚠️ ${item.name}: ${item.reason}`);
    if (item.ageRestriction) {
      ageWarnings.push(`🚫 ${item.name} — ${item.ageRestriction}`);
    }
    if (item.diseaseWarnings) {
      for (const dw of item.diseaseWarnings) {
        if (!seenDiseaseWarnings.has(dw)) {
          seenDiseaseWarnings.add(dw);
          diseaseWarnings.push(`🏥 ${dw}: Avoid ${item.name}`);
        }
      }
    }
  }

  // High sugar / sodium warnings from extracted nutrition
  if (nutrition.sugar > 10) {
    generalWarnings.push(`⚠️ High sugar content detected (${nutrition.sugar}g per 100g). FSSAI limit: 10g.`);
    if (!seenDiseaseWarnings.has('Diabetes')) {
      diseaseWarnings.push(`🏥 Diabetes: High sugar content (${nutrition.sugar}g).`);
    }
  }
  if (nutrition.sodium > 400) {
    generalWarnings.push(`⚠️ High sodium detected (${nutrition.sodium}mg per 100g). FSSAI limit: 400mg.`);
    if (!seenDiseaseWarnings.has('Hypertension')) {
      diseaseWarnings.push(`🏥 Hypertension: High sodium (${nutrition.sodium}mg).`);
    }
  }
  if (nutrition.satFat > 5) {
    generalWarnings.push(`⚠️ High saturated fat (${nutrition.satFat}g per 100g).`);
  }

  // 7. Build a Product object for the scoring engine
  const product: Product = {
    id: `ocr_${Date.now()}`,
    name: 'Scanned Product',
    brand: 'Label Scan',
    imageEmoji: '📸',
    ingredients: ingredientsList.length > 0 ? ingredientsList : ['(Raw text scanned — see details)'],
    nutrients: nutrition,
    additives: detectedAdditivesCodes,
    allergens: detectedAllergens,
  };

  return {
    product,
    rawText,
    detectedHarmful,
    detectedAllergens,
    ageWarnings,
    diseaseWarnings,
    generalWarnings,
  };
}
