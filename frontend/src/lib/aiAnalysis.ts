/**
 * Aavis AI Analysis Integration
 * All AI calls go through the secure Gemini backend (server/index.js)
 */

import { Product } from './types';
import { optimizedOCR } from './imagePreprocess';
import { extractNutrientsFromText } from './nutritionParser';
import { supabase } from './supabase';

import { getApiUrl } from './apiConfig';

const BACKEND_URL = 'https://aavis-backend.onrender.com';

const TEXT_ANALYSIS_PROMPT = `Analyze this food label text as a professional nutrition expert.
Return a concise JSON object with the following structure:
{
  "productName": "string - common name (Look for largest/topmost text. If unknown, infer e.g. 'Instant Noodles', 'Processed Snack')",
  "brand": "string - brand name (Look for brand logo text)",
  "productType": "Whole Food | Beverage | Snack | Dairy | Bakery | Breakfast Food | Protein Supplement | Confectionery | Sauce & Condiment | Cooking Oil & Fat | Ready Meal | Plant-Based Alternative | General Food",
  "servingSize": "string - e.g. '28g', '1 scoop (30g)', '200ml' (Extract any serving size, portion size, or reference amount. Null if missing.)",
  "nutritionUnit": "string - e.g. 'per 100g', 'per serving', 'per 20g' (Exactly as written above the nutrition column)",
  "ingredients": ["array of ingredients - PRIORITIZE risky/processed items first in the list"],
  "nutrients": {
    "calories": number or null,
    "sugar": number or null,
    "sodium": number or null,
    "fat": number or null,
    "satFat": number or null,
    "protein": number or null,
    "fiber": number or null,
    "carbs": number or null
  },
  "additives": ["array of E-codes found"],
  "additiveDetails": {
    "E_CODE": {
      "name": "Common Name",
      "function": "Purpose (e.g., Emulsifier)",
      "healthExplanation": "Consumer-friendly health impact (MUST explain every single additive found)",
      "hazard": "safe | caution | hazardous"
    }
  },
  "ingredientDetails": {
    "INGREDIENT_NAME": {
      "hazard": "safe | mild | caution | harmful | hazardous",
      "explanation": "short human-readable explanation (MUST explain every single ingredient found in the list)"
    }
  },
  "dimensions": {
    "ingredientSafety": { "score": 0, "justification": "string" },
    "nutritionalQuality": { "score": 0, "justification": "string" },
    "processingLevel": { "score": 0, "justification": "string" },
    "nutrientDensity": { "score": 0, "justification": "string" },
    "energyDensity": { "score": 0, "justification": "string" },
    "wholeFoodContent": { "score": 0, "justification": "string" },
    "functionalHealthImpact": { "score": 0, "justification": "string" }
  },
  "finalScore": 0,
  "overallAssessment": "string",
  "allergens": ["array of detected allergens"],
  "mainConcerns": ["array of 2-3 short human-readable health risks"],
  "majorBenefits": ["array of 2-3 short human-readable health benefits"],
  "dietAdvice": "A strict, brutally honest, conversational 2-line verdict acting as a human nutrition expert explaining exactly why it is safe or hazardous",
  "aiSummary": "short funny AI roast line (Indian context)"
}

CRITICAL INSTRUCTIONS:
1. Product Detection: Carefully identify the product name and brand. If OCR is messy, use context to infer a reasonable product type rather than 'Unknown'.
2. Ingredient Prioritization: List harmful additives, refined oils, and processed sugars AT THE BEGINNING of the 'ingredients' array.
3. NEVER skip difficult or long ingredient names.
4. Normalize INS: Convert any "INS XXX" codes found on the label directly into European "E XXX" codes (e.g. INS 471 -> E471) in both the ingredients list and additives list to maintain global consistency.
5. Identify hidden names for sugar (maltodextrin, dextrose, syrups) and flag them as "caution" or "harmful".
6. E-codes or INS codes must be parsed accurately into additiveDetails (EVERY additive must have details).
7. Treat "Vegetable Oil (Edible Vegetable Oil, Palm Oil, Palmolein)" as "harmful" due to saturated fats and processing.
8. Identify UPF (Ultra Processed Food) markers.
9. Match against profile: {PROFILE_CONTEXT}. Warn strongly if allergens or conditions are triggered!
   IMPORTANT MAPPING: Do not just check the condition name; MAP conditions to specific ingredients! For example:
   - Diabetes -> Check for added sugar, total sugar, glycemic impact, refined carbs.
   - Hypertension -> Check for sodium, sodium-based additives.
   - High Cholesterol -> Check for saturated fat, trans fat.
   - Kidney Disease (CKD) -> Check for sodium, potassium, phosphorus.
   - Celiac Disease -> Check for gluten-containing ingredients.
   - Gout -> Check for high-purine ingredients and sugary beverages.
   - Lactose Intolerance -> Check for milk, whey, casein, lactose.
   - Sesame Allergy -> Check for sesame, sesame oil, tahini.
   Apply this level of deep ingredient mapping to ALL conditions and allergens the user has!
10. AI SCORING (CRITICAL): Analyze the product across the 7 dimensions. Return a score (0-100) for each dimension and a justification.
11. COMPLETENESS (CRITICAL): You MUST provide an entry in \`ingredientDetails\` for EVERY SINGLE item in the \`ingredients\` array. You MUST provide an entry in \`additiveDetails\` for EVERY SINGLE additive found. For \`additiveDetails\`, the JSON key MUST be the exact E-code (e.g. "E440") that is present in the \`additives\` array. Do not leave any item unexplained.
12. RETURN ONLY VALID JSON.`;

// ─── Types ────────────────────────────────────────────────────────
export interface AiAnalysisResult {
  product: Product;
  aiSummary: string;
  dietAdvice: string;
  mainConcerns: string[];
  majorBenefits?: string[];
  aiDimensions?: any; 
  overallAssessment?: string;
  finalScore?: number;
  rawResponse: any;
}

// ─── Helper: call backend API ─────────────────────────────────────
async function callBackend(endpoint: string, body: object): Promise<any> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
  
  if (token) {
    authHeaders['Authorization'] = `Bearer ${token}`;
  }

  const url = getApiUrl(endpoint);
  console.log(`[AI Analysis Web] Routing request to: ${url}`);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error || response.statusText);
  }

  return response.json();
}

// ─── Helper: build Product from parsed JSON ───────────────────────
function buildProduct(parsed: any, fallbackName: string, emoji: string, rawText?: string): Product {
  // Use regex parser as a fallback for missing values
  const regexNutrients = extractNutrientsFromText(rawText || '');

  const getNutrient = (key: keyof typeof regexNutrients) => {
    // 1. Try AI parsed value (both zero and non-zero)
    if (typeof parsed.nutrients?.[key] === 'number' && !isNaN(parsed.nutrients[key])) {
      return parsed.nutrients[key];
    }
    // 2. Fallback to Regex extracted value
    if (regexNutrients[key] !== null) {
      return regexNutrients[key];
    }
    return null;
  };

  const nutritionSkipped = rawText ? (rawText.includes('Nutrition scan was skipped') || rawText.includes('Nutrition scan not performed') || rawText.includes('(Nutrition scan not performed)')) : false;

  const rawNutrients = {
    unit: parsed.nutritionUnit || null,
    calories: getNutrient('calories'),
    sugar: getNutrient('sugar'),
    sodium: getNutrient('sodium'),
    fat: getNutrient('fat'),
    satFat: getNutrient('satFat'),
    protein: getNutrient('protein'),
    fiber: getNutrient('fiber'),
    carbs: getNutrient('carbs'),
    _skipped: nutritionSkipped || undefined
  };

  const normalizeECode = (str: any) => {
    if (typeof str !== 'string') {
      if (str && typeof str === 'object' && str.name) return String(str.name);
      return String(str || '');
    }
    return str.replace(/\bINS\s*-?\s*(\d+[a-zA-Z]?)\b/gi, 'E$1');
  };

  const rawIngredients = Array.isArray(parsed.ingredients) && parsed.ingredients.length > 0
      ? parsed.ingredients
      : (typeof parsed.ingredients === 'string' && parsed.ingredients.trim()
          ? parsed.ingredients.split(',').map((i: string) => i.trim()).filter(Boolean)
          : ['(AI could not extract ingredients)']);
          
  const cleanIngredients = rawIngredients.map((i: string) => normalizeECode(i));
  const cleanAdditives = (Array.isArray(parsed.additives) ? parsed.additives : []).map((a: string) => normalizeECode(a));

  const cleanDynamicAdditives = Object.entries(parsed.additiveDetails || {}).reduce((acc, [k, v]) => {
    acc[normalizeECode(k)] = v as any;
    return acc;
  }, {} as any);

  const cleanDynamicIngredients = Object.entries(parsed.ingredientDetails || {}).reduce((acc, [k, v]) => {
    acc[normalizeECode(k)] = v as any;
    return acc;
  }, {} as any);

  return {
    id: `ai_${Date.now()}`,
    name: parsed.productName || fallbackName,
    brand: parsed.brand || 'Unknown Brand',
    imageEmoji: emoji,
    productType: parsed.productType || 'food',
    servingSize: parsed.servingSize || undefined,
    ingredients: cleanIngredients,
    nutrients: { ...rawNutrients }, // Will be overwritten by normalizeProduct
    rawNutrients: { ...rawNutrients }, // Persisted for UI / Impact calculation
    additives: cleanAdditives,
    dynamicAdditives: cleanDynamicAdditives,
    dynamicIngredients: cleanDynamicIngredients,
    allergens: Array.isArray(parsed.allergens) ? parsed.allergens : [],
  };
}

// ─── Helper: Perform OCR ──────────────────────────────────────────
export async function performOCR(
  file: File,
  mode: 'ingredients' | 'nutrition' | 'general',
  onProgress?: (percent: number) => void
): Promise<string> {
  console.log(`[OCR] Starting extraction with optimized pipeline for ${mode}...`);
  const text = await optimizedOCR(file, mode, onProgress);
  console.log('[OCR] Extraction complete.');
  return text;
}

// ─── Image Scan (OCR → Backend) ───────────────────────────────────
export async function analyzeImageWithAi(
  file: File,
  profile: any,
  onProgress?: (message: string, percent: number) => void
): Promise<AiAnalysisResult> {

  // Step 1: Preprocess + OCR
  onProgress?.('Enhancing image quality...', 5);
  onProgress?.('Scanning image with OCR...', 10);
  const extractedText = await performOCR(file, 'general', (p) => {
    onProgress?.(`OCR Progress: ${p}%`, 10 + Math.round(p * 0.15));
  });

  const validation = isValidFoodLabelText(extractedText, 'general');
  if (!validation.valid) {
    throw new Error(validation.reason);
  }

  // Step 2: Send to backend
  onProgress?.('Analyzing...', 30);
  
  const profileContext = `Age: ${profile.age}, Diet: ${profile.diet}, Allergies: ${profile.allergens.join(', ')}, Conditions: ${profile.conditions.join(', ')}`;
  const prompt = `${TEXT_ANALYSIS_PROMPT.replace('{PROFILE_CONTEXT}', profileContext)}\n\nExtracted Text:\n${extractedText}`;

  const parsed = await callBackend('/api/analyze', { text: prompt });

  onProgress?.('Finalizing results...', 95);

  const getArray = (val: any) => Array.isArray(val) ? val : (typeof val === 'string' ? [val] : []);
  
  return {
    product: buildProduct(parsed, 'AI Scanned Product', '🤖', extractedText),
    aiSummary: parsed.aiSummary || 'AI analysis complete.',
    dietAdvice: parsed.dietAdvice || 'Check details for more info.',
    mainConcerns: getArray(parsed.mainConcerns),
    majorBenefits: getArray(parsed.majorBenefits),
    aiDimensions: typeof parsed.dimensions === 'object' && parsed.dimensions ? parsed.dimensions : {},
    overallAssessment: parsed.overallAssessment,
    finalScore: typeof parsed.finalScore === 'number' ? parsed.finalScore : 50,
    rawResponse: parsed,
  };
}

// ─── Multi-Step Scan Analysis ─────────────────────────────────────
export async function analyzeMultiStepScan(
  ingredientsText: string,
  nutritionText: string | null,
  profile: any,
  onProgress?: (message: string, percent: number) => void
): Promise<AiAnalysisResult> {

  const ingValidation = isValidFoodLabelText(ingredientsText, 'ingredients');
  if (!ingValidation.valid) {
    throw new Error(ingValidation.reason);
  }
  if (nutritionText) {
    const nutValidation = isValidFoodLabelText(nutritionText, 'nutrition');
    if (!nutValidation.valid) {
      throw new Error(nutValidation.reason);
    }
  }

  onProgress?.('Enhancing image quality...', 5);
  onProgress?.('Processing...', 30);
  
  const profileContext = `Age: ${profile.age}, Diet: ${profile.diet}, Allergies: ${profile.allergens.join(', ')}, Conditions: ${profile.conditions.join(', ')}`;
  
  let combinedText = `INGREDIENTS SCAN TEXT:\n${ingredientsText}\n\n`;
  if (nutritionText) {
    combinedText += `NUTRITION FACTS SCAN TEXT:\n${nutritionText}\n\n`;
  } else {
    combinedText += `(Note: Nutrition scan was skipped. Use ingredients for analysis.)\n\n`;
  }

  const prompt = `${TEXT_ANALYSIS_PROMPT.replace('{PROFILE_CONTEXT}', profileContext)}\n\n${combinedText}`;

  const parsed = await callBackend('/api/analyze', { text: prompt });

  const getArray = (val: any) => Array.isArray(val) ? val : (typeof val === 'string' ? [val] : []);
  
  return {
    product: buildProduct(parsed, 'AI Scanned Product', '🤖', combinedText),
    aiSummary: parsed.aiSummary || 'AI analysis complete.',
    dietAdvice: parsed.dietAdvice || 'Check details for more info.',
    mainConcerns: getArray(parsed.mainConcerns),
    majorBenefits: getArray(parsed.majorBenefits),
    aiDimensions: typeof parsed.dimensions === 'object' && parsed.dimensions ? parsed.dimensions : {},
    overallAssessment: parsed.overallAssessment,
    finalScore: typeof parsed.finalScore === 'number' ? parsed.finalScore : 50,
    rawResponse: parsed,
  };
}

// ─── Type Text Analysis (Backend) ────────────────────────────────
export async function analyzeTextWithAi(
  productName: string,
  ingredientsText: string,
  profile: any,
  onProgress?: (message: string, percent: number) => void
): Promise<AiAnalysisResult> {

  onProgress?.('Analyzing with Aavis AI...', 25);

  const profileContext = `Age: ${profile.age}, Diet: ${profile.diet}, Allergies: ${profile.allergens.join(', ')}, Conditions: ${profile.conditions.join(', ')}`;
  const text = `Product Name: ${productName}\nIngredients/Details: ${ingredientsText}\n\n${TEXT_ANALYSIS_PROMPT.replace('{PROFILE_CONTEXT}', profileContext)}`;
  
  const parsed = await callBackend('/api/analyze', { text });

  onProgress?.('Finalizing results...', 95);

  const product = buildProduct(parsed, productName || 'AI Scanned Product', '📝', ingredientsText);
  if (product.ingredients[0] === '(AI could not extract ingredients)') {
    product.ingredients = [ingredientsText];
  }

  const getArray = (val: any) => Array.isArray(val) ? val : (typeof val === 'string' ? [val] : []);

  return {
    product,
    aiSummary: parsed.aiSummary || 'AI analysis complete.',
    dietAdvice: parsed.dietAdvice || 'Check details for more info.',
    mainConcerns: getArray(parsed.mainConcerns),
    majorBenefits: getArray(parsed.majorBenefits),
    aiDimensions: typeof parsed.dimensions === 'object' && parsed.dimensions ? parsed.dimensions : {},
    overallAssessment: parsed.overallAssessment,
    finalScore: typeof parsed.finalScore === 'number' ? parsed.finalScore : 50,
    rawResponse: parsed,
  };
}

// ─── Food Search (Backend) ────────────────────────────────────────
export async function askAiAboutFood(query: string): Promise<string> {
const prompt = `You are Aavis, a strict nutrition expert created by Batman.
You only answer questions about food, nutrition, and diet. If the user asks about anything else, say "I can only help you with food questions."
Keep answers concise (2-3 sentences) and state if the food is safe, caution, or hazardous.

The user asks: "${query}"

Aavis replies:`;

  const parsed = await callBackend('/api/chat', { message: prompt });
  return parsed.reply || '';
}

// ─── AI Chat (Backend) ───────────────────────────────────────────
export async function askAiChat(
  chatHistory: { role: 'user' | 'model'; parts: { text: string }[] }[],
  newMessage: string
): Promise<string> {
  const systemContext = `You are Aavis, a strict nutrition expert created by Batman.
You only answer questions about food, nutrition, and diet. If the user asks about anything else, say "I can only help you with food questions."
Keep answers concise (2-3 sentences).`;
  const shortNewMessage = `${systemContext}\n\nThe user says: "${newMessage}"\n\nAavis replies:`;

  const history = chatHistory.map(m => ({
    role: m.role === 'model' ? 'assistant' : 'user',
    content: m.parts.map(p => p.text).join(' '),
  }));

  const parsed = await callBackend('/api/chat', { message: shortNewMessage, history });
  return parsed.reply || '';
}

// ─── Intelligent OCR Correction (Backend) ────────────────────────
export async function aiOcrCorrection(rawText: string, mode: 'ingredients' | 'nutrition' = 'ingredients'): Promise<string> {
  if (!rawText || rawText.trim().length < 5) return rawText;
  
  let prompt = '';
  
  if (mode === 'nutrition') {
    prompt = `You are organizing nutrition label information from noisy OCR text.

Your task is simple:
1. Take whatever information is in the OCR text below.
2. Fix obvious spelling or OCR mistakes (e.g., "S0dium" -> "Sodium").
3. Organize all the extracted information neatly line by line.
4. KEEP ALL valid label information including Serving Size, Portions, headers, and all nutrients. DO NOT delete or filter them out.
5. If there are lists of nutrients and values separated into columns, pair them correctly.

CRITICAL INSTRUCTION: Return a clean, human-readable text list. DO NOT output JSON. DO NOT include any conversational text, introductions, or markdown blocks. Output exactly and only the formatted text.

OCR INPUT:
${rawText}`;
  } else {
    prompt = `You are a highly intelligent OCR correction engine for food labels.
Your task is to fix spelling errors, distorted words, and bad formatting in the following raw OCR text.
CRITICAL RULES:
1. ONLY fix obvious spelling mistakes, spacing issues, and formatting.
2. DO NOT hallucinate, invent, or add any ingredients that are not present.
3. Preserve the exact meaning and as much original structure as possible.
4. Normalize common food additive terms (e.g., 'flavosin' -> 'flavoring', 'hydrogented' -> 'hydrogenated').
5. Output ONLY the perfectly corrected text. No conversational intro or outro.

RAW OCR TEXT TO CORRECT:
---
${rawText}
---`;
  }

  try {
    const parsed = await callBackend('/api/chat', { message: prompt });
    let reply = parsed.reply?.trim() || rawText;
    
    if (mode === 'nutrition') {
      if (reply.startsWith('```json')) {
        reply = reply.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (reply.startsWith('```')) {
        reply = reply.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }
    }
    
    return reply.trim();
  } catch (error) {
    console.warn('[AI OCR Correction Failed] Falling back to raw text', error);
    return rawText; // Fallback to raw text if AI fails
  }
}

// ─── Educational Content (Backend) ───────────────────────────────
export interface FoodMythData {
  myth: string;
  fact: string;
  explanation: string;
  sources: { name: string; url: string; }[];
  category: string;
}

export async function generateEducationalContent(): Promise<FoodMythData> {
  const prompt = `Generate a random, surprising food nutrition myth commonly believed (especially in India) and its reality.
IMPORTANT: Generate a myth that has NOT appeared before.

Return a strict JSON object with this exact format:
{
  "myth": "A 1-sentence question asking about the myth (e.g. 'Is MSG actually bad for you?')",
  "fact": "A highly concise 2 to 3 sentence explanation debunking it (under 50 words).",
  "explanation": "A detailed but accessible 3-4 sentence scientific explanation of why the myth is false.",
  "sources": [
    { "name": "e.g. WHO, Mayo Clinic", "url": "https://..." }
  ],
  "category": "Must be exactly one of: Nutrition, Food Safety, Additives, Sugar, Processing, Organic Claims, Artificial Sweeteners, Cholesterol, Protein, Vitamins"
}
Do not include any other text, markdown formatting, or backticks. Return raw JSON.`;

  try {
    const parsed = await callBackend('/api/chat', { message: prompt });
    
    // Level 1: parsed cleanly by callBackend
    if (parsed && parsed.myth && parsed.fact && parsed.explanation && parsed.category && Array.isArray(parsed.sources)) {
      return parsed;
    }

    const text = parsed?.reply || '';
    
    // Level 2: Try JSON extraction
    const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
    if (cleaned) {
      try {
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const extracted = JSON.parse(jsonMatch[0]);
          if (extracted.myth && extracted.fact && extracted.explanation) {
            return extracted;
          }
        }
      } catch (e) {
        console.warn('[AI] JSON parse failed, trying regex', e);
      }
    }

    // Level 3: Regex extraction
    const mythMatch = text.match(/"myth"\s*:\s*"([^"]+)"/i) || text.match(/myth["\s:]+([^]*?)(?=fact|})/i);
    const factMatch = text.match(/"fact"\s*:\s*"([^"]+)"/i) || text.match(/fact["\s:]+([^]*?)(?=explanation|})/i);
    const explMatch = text.match(/"explanation"\s*:\s*"([^"]+)"/i);
    
    if (mythMatch && factMatch) {
      return {
        myth: mythMatch[1].trim(),
        fact: factMatch[1].trim(),
        explanation: explMatch ? explMatch[1].trim() : factMatch[1].trim(),
        sources: [],
        category: "Nutrition"
      };
    }
  } catch (err) {
    console.error('[AI] generation failed completely, using fallback:', err);
  }

  // Level 4: Fallback to default database
  const { DEFAULT_MYTHS } = await import('../data/defaultMyths');
  const randomMyth = DEFAULT_MYTHS[Math.floor(Math.random() * DEFAULT_MYTHS.length)];
  return randomMyth;
}

// ─── Error message mapping ────────────────────────────────────────
export function getAiErrorMessage(error: string): string {
  const lowerError = error.toLowerCase();
  
  if (lowerError.includes('invalid request format')) {
    return 'Invalid JSON request. Please check the data format.';
  }
  if (lowerError.includes('429') || lowerError.includes('rate limit') || lowerError.includes('too many requests') || error === 'RATE_LIMITED') {
    return 'AI API rate limit reached. Please wait 30 seconds and try again.';
  }
  if (lowerError.includes('save') && lowerError.includes('supabase')) {
    return 'Supabase save failed. Could not store your scan data.';
  }
  if (lowerError.includes('failed to fetch') || lowerError.includes('network') || error === 'NETWORK_ERROR') {
    return 'Network error. Check your internet connection and try again.';
  }
  if (error === 'PARSE_ERROR' || lowerError.includes('unexpected data')) {
    return 'Missing analysis data. AI returned unexpected format. Please try scanning again.';
  }
  if (error === 'EMPTY_RESPONSE') {
    return 'AI could not analyze this image. Try a clearer photo with better lighting.';
  }

  // Final fallback to show the exact error instead of a generic message
  const exactError = error.startsWith('API_ERROR:') ? error.replace('API_ERROR: ', '') : error;
  return `Scan analysis failed: ${exactError || 'Unknown Error'}`;
}

export function isValidFoodLabelText(text: string, type: 'ingredients' | 'nutrition' | 'general'): { valid: boolean; reason?: string } {
  const cleaned = text.trim().toLowerCase();
  
  if (cleaned.length < 10) {
    return { 
      valid: false, 
      reason: "No clear text detected. Please get closer and make sure the label is well-lit and not blurry." 
    };
  }

  const ingredientsKeywords = [
    'ingredients', 'contains', 'composition', 'sugar', 'oil', 'water', 'salt', 'starch', 'extract', 
    'flour', 'milk', 'cocoa', 'flavor', 'acid', 'gum', 'lecithin', 'preservative', 'syrup', 'sodium', 'fat'
  ];
  
  const nutritionKeywords = [
    'nutrition', 'calories', 'kcal', 'fat', 'sodium', 'protein', 'carbs', 'carbohydrate', 'sugar', 
    'cholesterol', 'serving', 'energy', 'saturated', 'dietary', 'trans', 'potassium', 'calcium'
  ];

  if (type === 'general') {
    const ingMatches = ingredientsKeywords.filter(kw => cleaned.includes(kw)).length;
    const nutMatches = nutritionKeywords.filter(kw => cleaned.includes(kw)).length;
    if (ingMatches < 1 && nutMatches < 1) {
      return {
        valid: false,
        reason: "The scanned image does not appear to be a food label. Aavis could not detect ingredients or nutrition facts."
      };
    }
    return { valid: true };
  }

  const keywords = type === 'ingredients' ? ingredientsKeywords : nutritionKeywords;
  const matchCount = keywords.filter(kw => cleaned.includes(kw)).length;

  if (matchCount < 1) {
    return {
      valid: false,
      reason: `The scanned image does not appear to contain a valid ${type} label. Please try again with a clear, well-focused food label.`
    };
  }

  return { valid: true };
}