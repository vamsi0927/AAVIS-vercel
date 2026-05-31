/**
 * Aavis AI Analysis Integration
 * All AI calls go through the secure Groq Llama 3 backend (server/index.cjs)
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
      "healthExplanation": "Consumer-friendly health impact",
      "hazard": "safe | caution | hazardous"
    }
  },
  "allergens": ["array of detected allergens"],
  "mainConcerns": ["array of 2-3 short human-readable health risks"],
  "dietAdvice": "short consumer-friendly verdict (1 sentence)",
  "aiSummary": "short funny AI roast line (Indian context)"
}

CRITICAL INSTRUCTIONS:
1. Product Detection: Carefully identify the product name and brand. If OCR is messy, use context to infer a reasonable product type rather than 'Unknown'.
2. Ingredient Prioritization: List harmful additives, refined oils, and processed sugars AT THE BEGINNING of the 'ingredients' array.
3. NEVER skip difficult or long ingredient names.
4. Hazard Level: 'hazardous' for controversial chemicals, 'caution' for industrial/processed items (including most emulsifiers/stabilizers), 'safe' only for truly natural extracts.
5. Personalize for: {PROFILE_CONTEXT}
6. NUTRITION VALUES: ONLY use values explicitly found in the OCR text. If a nutrient value is NOT clearly present in the scanned text, set it to null. Do NOT estimate, guess, or hallucinate any nutrition numbers. Look for keywords like 'Energy', 'Calories', 'Sugar', 'Sodium', 'Fat', 'Saturated', 'Protein', 'Fibre/Fiber', 'Carbohydrate' and extract the numeric value next to them.
7. RETURN ONLY VALID JSON.`;

// ─── Types ────────────────────────────────────────────────────────
export interface GeminiAnalysisResult {
  product: Product;
  aiSummary: string;
  dietAdvice: string;
  mainConcerns: string[];
  rawResponse: any;
}

// ─── Helper: call backend ─────────────────────────────────────────
async function callBackend(endpoint: string, body: object): Promise<any> {
  console.log(`[API CALL] Starting ${endpoint}`, { method: 'POST', body });
  
  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errMsg = `API_ERROR: ${errorData?.error || response.statusText}`;
    console.error(`[API ERROR] ${endpoint}`, response.status, errorData);
    throw new Error(errMsg);
  }

  const data = await response.json();
  console.log(`[API SUCCESS] ${endpoint} Status: ${response.status}`, data);
  return data;
}

// ─── Helper: build Product from parsed JSON ───────────────────────
function buildProduct(parsed: any, fallbackName: string, emoji: string, rawText?: string): Product {
  // Use regex parser as a fallback for missing values
  const regexNutrients = extractNutrientsFromText(rawText || '');

  const getNutrient = (key: keyof typeof regexNutrients) => {
    // 1. Try Gemini's parsed value
    if (typeof parsed.nutrients?.[key] === 'number' && parsed.nutrients[key] !== 0) {
      return parsed.nutrients[key];
    }
    // 2. Fallback to Regex extracted value
    if (regexNutrients[key] !== null) {
      return regexNutrients[key];
    }
    // 3. Fallback to 0 if Gemini explicitly said 0 (though Regex would have caught it if it existed)
    if (parsed.nutrients?.[key] === 0) {
      return 0;
    }
    return null;
  };

  return {
    id: `ai_${Date.now()}`,
    name: parsed.productName || fallbackName,
    brand: parsed.brand || 'Unknown Brand',
    imageEmoji: emoji,
    ingredients: Array.isArray(parsed.ingredients) && parsed.ingredients.length > 0
      ? parsed.ingredients
      : (typeof parsed.ingredients === 'string' && parsed.ingredients.trim()
          ? parsed.ingredients.split(',').map((i: string) => i.trim()).filter(Boolean)
          : ['(AI could not extract ingredients)']),
    nutrients: {
      calories: getNutrient('calories'),
      sugar: getNutrient('sugar'),
      sodium: getNutrient('sodium'),
      fat: getNutrient('fat'),
      satFat: getNutrient('satFat'),
      protein: getNutrient('protein'),
      fiber: getNutrient('fiber'),
      carbs: getNutrient('carbs'),
    },
    additives: Array.isArray(parsed.additives) ? parsed.additives : [],
    dynamicAdditives: parsed.additiveDetails || {},
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
    prompt = `You are extracting nutrition label information from noisy OCR text.

Your task has TWO PHASES:

PHASE 1 — OCR RECONSTRUCTION
* Fix OCR mistakes and broken words using nutrition-label context.
* Reconstruct incomplete or split nutrient names when confidence is high.
* Remove duplicate headers, random symbols, and OCR garbage text.
* Ignore unrelated noise words.
* Preserve all numeric values exactly as extracted.
* Do not hallucinate missing numbers or values.

PHASE 2 — STRUCTURED EXTRACTION
* Reconstruct the nutrition table correctly.
* ONLY extract standard recognized nutrition facts (e.g., Calories/Energy, Fat, Carbohydrates, Sugar, Sodium, Protein, Fiber, Potassium, Cholesterol, etc.).
* COMPLETELY IGNORE all unrecognized words, acronyms, gibberish (e.g., "SHR", "Laas"), and OCR errors. Do not include them in your output.
* COLUMN ALIGNMENT: If the OCR text presents a list of nutrient names followed by a separate list of numeric values (like two columns read top-to-bottom), carefully pair the names with the numbers sequentially in order.

CRITICAL INSTRUCTION: Return a clean, human-readable text list with each recognized nutrient on a new line (e.g. "Energy: 28.8 kcal"). DO NOT output JSON. DO NOT include any conversational text, introductions, or markdown blocks. Output exactly and only the formatted text list of valid nutrients.

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
  switch (error) {
    case 'RATE_LIMITED':
      return 'AI is busy — too many requests. Please wait 30 seconds and try again.';
    case 'EMPTY_RESPONSE':
      return 'AI could not analyze this image. Try a clearer photo with better lighting.';
    case 'PARSE_ERROR':
      return 'AI returned unexpected data. Please try scanning again.';
    case 'NETWORK_ERROR':
      return 'Network error. Check your internet connection and try again.';
    default:
      return error.startsWith('API_ERROR:')
        ? `API Error: ${error.replace('API_ERROR: ', '')}`
        : 'An unexpected error occurred. Please try again.';
  }
}