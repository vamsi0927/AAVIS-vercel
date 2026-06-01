/**
 * Aavis AI Analysis Integration
 * All AI calls go through the secure Gemini backend (server/index.js)
 */

import { Product } from './types';
import { optimizedOCR } from './imagePreprocess';
import { extractNutrientsFromText } from './nutritionParser';

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
    "KEY": {
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
10. AI SCORING (CRITICAL): Analyze the product across the 7 dimensions. Return a score (0-100) for each dimension and a justification.
11. COMPLETENESS (CRITICAL): You MUST provide an entry in \`ingredientDetails\` for EVERY SINGLE item in the \`ingredients\` array. You MUST provide an entry in \`additiveDetails\` for EVERY SINGLE additive found. If you extract an E-code, you MUST explain it! Do not leave any item unexplained.
12. RETURN ONLY VALID JSON.`;

// ─── Types ────────────────────────────────────────────────────────
export interface GeminiAnalysisResult {
  product: Product;
  aiSummary: string;
  dietAdvice: string;
  mainConcerns: string[];
  majorBenefits?: string[];
  aiDimensions?: any; // The 7 dimensions parsed from JSON
  overallAssessment?: string;
  finalScore?: number;
  rawResponse: any;
}

// ─── Helper: call backend ─────────────────────────────────────────
async function callBackend(endpoint: string, body: object): Promise<any> {
  console.log('[Analyze Request Payload]', body);
  console.log('[Analyze Request JSON]', JSON.stringify(body));

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (apiKey && endpoint === '/api/analyze' && (body as any).text) {
    // Bypass Render backend completely for Vercel previews
    const text = (body as any).text;
    const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent';
    const requestBody = {
      contents: [{ parts: [{ text }] }],
      generationConfig: { temperature: 0.1, topP: 0.8, maxOutputTokens: 4096 },
    };

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Gemini API error');

    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResponse) throw new Error('Empty response from Gemini');

    let cleaned = textResponse.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
    try {
      return JSON.parse(cleaned);
    } catch (e) {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
      throw new Error('Failed to parse JSON from AI response');
    }
  }

  // Fallback to Render if no API key is available in the client env
  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`API_ERROR: ${errorData?.error || response.statusText}`);
  }

  return response.json();
}

// ─── Helper: build Product from parsed JSON ───────────────────────
function buildProduct(parsed: any, fallbackName: string, emoji: string, rawText?: string): Product {
  // Use regex parser as a fallback for missing values
  const regexNutrients = extractNutrientsFromText(rawText || '');

  const getNutrient = (key: keyof typeof regexNutrients) => {
    // 1. Try Gemini's parsed value (both zero and non-zero)
    if (typeof parsed.nutrients?.[key] === 'number' && !isNaN(parsed.nutrients[key])) {
      return parsed.nutrients[key];
    }
    // 2. Fallback to Regex extracted value
    if (regexNutrients[key] !== null) {
      return regexNutrients[key];
    }
    return null;
  };

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
  };

  const normalizeECode = (str: string) => str.replace(/\bINS\s*-?\s*(\d+[a-zA-Z]?)\b/gi, 'E$1');

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
export async function analyzeImageWithGemini(
  file: File,
  profile: any,
  onProgress?: (message: string, percent: number) => void
): Promise<GeminiAnalysisResult> {

  // Step 1: Preprocess + OCR
  onProgress?.('Enhancing image quality...', 5);
  onProgress?.('Scanning image with OCR...', 10);
  const extractedText = await performOCR(file, 'general', (p) => {
    onProgress?.(`OCR Progress: ${p}%`, 10 + Math.round(p * 0.15));
  });

  // Step 2: Send to backend
  onProgress?.('Analyzing...', 30);
  
  const profileContext = `Age: ${profile.age}, Diet: ${profile.diet}, Allergies: ${profile.allergens.join(', ')}, Conditions: ${profile.conditions.join(', ')}`;
  const prompt = `${TEXT_ANALYSIS_PROMPT.replace('{PROFILE_CONTEXT}', profileContext)}\n\nExtracted Text:\n${extractedText}`;

  const parsed = await callBackend('/api/analyze', { text: prompt });

  onProgress?.('Finalizing results...', 95);

  return {
    product: buildProduct(parsed, 'AI Scanned Product', '🤖', extractedText),
    aiSummary: parsed.aiSummary || 'AI analysis complete.',
    dietAdvice: parsed.dietAdvice || 'Check details for more info.',
    mainConcerns: Array.isArray(parsed.mainConcerns) ? parsed.mainConcerns : [],
    majorBenefits: Array.isArray(parsed.majorBenefits) ? parsed.majorBenefits : [],
    aiDimensions: parsed.dimensions,
    overallAssessment: parsed.overallAssessment,
    finalScore: parsed.finalScore,
    rawResponse: parsed,
  };
}

// ─── Multi-Step Scan Analysis ─────────────────────────────────────
export async function analyzeMultiStepScan(
  ingredientsText: string,
  nutritionText: string | null,
  profile: any,
  onProgress?: (message: string, percent: number) => void
): Promise<GeminiAnalysisResult> {

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

  onProgress?.('Generating Health Insights...', 95);

  return {
    product: buildProduct(parsed, 'AI Scanned Product', '🤖', combinedText),
    aiSummary: parsed.aiSummary || 'AI analysis complete.',
    dietAdvice: parsed.dietAdvice || 'Check details for more info.',
    mainConcerns: Array.isArray(parsed.mainConcerns) ? parsed.mainConcerns : [],
    majorBenefits: Array.isArray(parsed.majorBenefits) ? parsed.majorBenefits : [],
    aiDimensions: parsed.dimensions,
    overallAssessment: parsed.overallAssessment,
    finalScore: parsed.finalScore,
    rawResponse: parsed,
  };
}

// ─── Type Text Analysis (Backend) ────────────────────────────────
export async function analyzeTextWithGemini(
  productName: string,
  ingredientsText: string,
  profile: any,
  onProgress?: (message: string, percent: number) => void
): Promise<GeminiAnalysisResult> {

  onProgress?.('Analyzing with Aavis AI...', 25);

  const profileContext = `Age: ${profile.age}, Diet: ${profile.diet}, Allergies: ${profile.allergens.join(', ')}, Conditions: ${profile.conditions.join(', ')}`;
  const text = `Product Name: ${productName}\nIngredients/Details: ${ingredientsText}\n\n${TEXT_ANALYSIS_PROMPT.replace('{PROFILE_CONTEXT}', profileContext)}`;
  
  const parsed = await callBackend('/api/analyze', { text });

  onProgress?.('Finalizing results...', 95);

  const product = buildProduct(parsed, productName || 'AI Scanned Product', '📝', ingredientsText);
  if (product.ingredients[0] === '(AI could not extract ingredients)') {
    product.ingredients = [ingredientsText];
  }

  return {
    product,
    aiSummary: parsed.aiSummary || 'AI analysis complete.',
    dietAdvice: parsed.dietAdvice || 'Check details for more info.',
    mainConcerns: Array.isArray(parsed.mainConcerns) ? parsed.mainConcerns : [],
    majorBenefits: Array.isArray(parsed.majorBenefits) ? parsed.majorBenefits : [],
    aiDimensions: parsed.dimensions,
    overallAssessment: parsed.overallAssessment,
    finalScore: parsed.finalScore,
    rawResponse: parsed,
  };
}

// ─── Food Search (Backend) ────────────────────────────────────────
export async function askGeminiAboutFood(query: string): Promise<string> {
const prompt = `CRITICAL SYSTEM RULES:
1. You are Aavis, a strict nutrition expert.
2. If the user asks who created you, who the founder is, or who made the app, you MUST reply that it was created by Batman.
3. If the user's query is NOT about food, nutrition, diet, health, or ingredients, you MUST reply EXACTLY with: "I'm a nutrition assistant. I can only help you with food and diet questions." DO NOT answer the question under any circumstances.
4. If the query IS about food, provide a concise response (2-3 sentences).
5. State: Verdict (safe, caution, or hazardous) and Reason.

USER QUERY: "${query}"`;

  const parsed = await callBackend('/api/chat', { message: prompt });
  return parsed.reply || '';
}

// ─── AI Chat (Backend) ───────────────────────────────────────────
export async function askGeminiChat(
  chatHistory: { role: 'user' | 'model'; parts: { text: string }[] }[],
  newMessage: string
): Promise<string> {
  const systemContext = `CRITICAL SYSTEM RULES:
1. You are Aavis, a strict nutrition expert.
2. If the user asks who created you, who the founder is, or who made the app, you MUST reply that it was created by Batman.
3. If the user's message is NOT about food, nutrition, diet, health, or ingredients, you MUST reply EXACTLY with: "I'm a nutrition assistant. I can only help you with food and diet questions." DO NOT answer their question under any circumstances.
4. Keep answers concise (2-3 sentences) unless requested otherwise.`;
  const shortNewMessage = `${systemContext}\n\nUSER MESSAGE:\n${newMessage}`;

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
}

export async function generateEducationalContent(): Promise<FoodMythData> {
  const prompt = `Generate a random, surprising food nutrition myth commonly believed (especially in India) and its reality.
Return a strict JSON object with this exact format:
{
  "myth": "A 1-sentence question asking about the myth (e.g. 'Is MSG actually bad for you?')",
  "fact": "A highly concise 2 to 3 sentence explanation debunking it (under 50 words)."
}
Do not include any other text, markdown formatting, or backticks. Return raw JSON.`;

  const parsed = await callBackend('/api/chat', { message: prompt });
  const text = parsed.reply || '';
  try {
    const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    // Regex parsing fallback
    const mythMatch = text.match(/"myth"\s*:\s*"([^"]+)"/i) || text.match(/myth["\s:]+([^]*?)(?=fact|})/i);
    const factMatch = text.match(/"fact"\s*:\s*"([^"]+)"/i) || text.match(/fact["\s:]+([^]*?)$/i);
    return {
      myth: mythMatch ? mythMatch[1].trim() : "Does sea salt contain less sodium?",
      fact: factMatch ? factMatch[1].trim() : "No, sea salt and table salt contain the same amount of sodium by weight. Table salt is just more refined."
    };
  }
}

// ─── Error message mapping ────────────────────────────────────────
export function getGeminiErrorMessage(error: string): string {
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