import { Product } from './types';
import { extractNutrientsFromText } from './nutritionParser';
import { supabase } from './supabase';
import { getAiProvider, getApiUrl } from './apiConfig';

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
4. Normalize INS: Convert any "INS XXX" codes found on the label directly into European "E XXX" codes (e.g. INS 471 -> E471) in both the ingredients list and additives list.
5. Identify hidden names for sugar (maltodextrin, dextrose, syrups) and flag them as "caution" or "harmful".
6. E-codes or INS codes must be parsed accurately into additiveDetails (EVERY additive must have details).
7. Treat "Vegetable Oil (Edible Vegetable Oil, Palm Oil, Palmolein)" as "harmful" due to saturated fats and processing.
8. Identify UPF (Ultra Processed Food) markers.
9. AI SCORING (CRITICAL): Analyze the product across the 7 dimensions. Return a score (0-100) for each dimension and a justification.
10. COMPLETENESS (CRITICAL): You MUST provide an entry in \`ingredientDetails\` for EVERY SINGLE item in the \`ingredients\` array. You MUST provide an entry in \`additiveDetails\` for EVERY SINGLE additive found.
11. RETURN ONLY VALID JSON. No markdown, no backticks, no explanation.`;


// ─── Client-side OCR Normalization (mirrors server-side) ──────────
// Applied before submission so the backend receives cleaner text.
function normalizeOcrText(rawText: string): string {
  if (!rawText) return rawText;
  let t = rawText;
  t = t.replace(/(\d)O(\d)/g, '$10$2');
  t = t.replace(/(\d)O(g|ml|mg|kcal|kJ)/gi, '$10$2');
  t = t.replace(/\bl(\d)/g, '1$1');
  t = t.replace(/\bl\.(\d)/g, '1.$1');
  t = t.replace(/\bS(\d)(g|ml|mg|kcal|kJ)\b/gi, '5$1$2');
  t = t.replace(/(\d)I(\d)/g, '$11$2');
  t = t.replace(/(\d)A(\d)/g, '$14$2');
  t = t.replace(/\bINS\s*-?\s*(\d{3,4}[a-zA-Z]?)\b/gi, 'E$1');
  return t;
}

// Helper to route to the Aavis Express server (which handles Ollama internally)
async function callBackend(endpoint: string, body: object): Promise<any> {
  const text = (body as any).text || (body as any).message;
  const isChat = endpoint === '/api/chat';
  const history = (body as any).history || [];

  console.log('[Aavis Mobile] Routing request to Express server...');
  try {
    const messages: { role: string; content: string }[] = [];

    if (isChat) {
      messages.push({ role: 'system', content: 'You are Aavis, a helpful and slightly humorous AI nutrition assistant for an Indian health app.' });
      for (const msg of history) {
        messages.push({ role: msg.role === 'assistant' ? 'assistant' : 'user', content: msg.content });
      }
      messages.push({ role: 'user', content: text });
    } else {
      messages.push({ role: 'user', content: text });
    }

    const ollamaBody = JSON.stringify({
      model: 'llama3.2:1b',
      messages,
      stream: false,
      format: isChat ? undefined : 'json',
      options: { temperature: isChat ? 0.7 : 0.1, num_ctx: 8192 }
    });

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) authHeaders['Authorization'] = `Bearer ${token}`;

    let response: any = await fetch(getApiUrl(endpoint), {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(body),
    }).catch(err => {
      console.warn('[Mobile AI] Primary fetch failed:', err);
      return null;
    });

    if (response && response.ok) {
      const data = await response.json();
      const textResponse = data.message?.content || data.reply || (typeof data === 'object' ? JSON.stringify(data) : '');

      if (isChat) return { reply: textResponse };

      let cleaned = textResponse.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
      try {
        return JSON.parse(cleaned);
      } catch (e) {
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) return JSON.parse(match[0]);
      }
    }
  } catch (e: any) {
    console.warn('[Ollama Mobile] Error caught in callBackend:', e);
    throw new Error(e.message || 'Connection Error: Failed to reach the Aavis AI Analysis Server.');
  }

  throw new Error('Aavis AI Server did not return a valid response. Please check your connection.');
}

function buildProduct(parsed: any, fallbackName: string, emoji: string, rawText?: string): Product {
  const regexNutrients = extractNutrientsFromText(rawText || '');

  const getNutrient = (key: keyof typeof regexNutrients) => {
    if (typeof parsed.nutrients?.[key] === 'number' && !isNaN(parsed.nutrients[key])) {
      return parsed.nutrients[key];
    }
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
    addedSugar: typeof parsed.nutrients?.addedSugar === 'number' ? parsed.nutrients.addedSugar : null,
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
    nutrients: { ...rawNutrients },
    rawNutrients: { ...rawNutrients },
    additives: cleanAdditives,
    dynamicAdditives: cleanDynamicAdditives,
    dynamicIngredients: cleanDynamicIngredients,
    allergens: Array.isArray(parsed.allergens) ? parsed.allergens : [],
  };
}

export async function analyzeMultiStepScan(
  ingredientsText: string,
  nutritionText: string | null,
  profile: any,
  onProgress?: (message: string, percent: number) => void
): Promise<AiAnalysisResult> {
  onProgress?.('Processing ingredients...', 30);
  
  const profileContext = `Age: ${profile.age}, Diet: ${profile.diet}, Allergies: ${profile.allergens.join(', ')}, Conditions: ${profile.conditions.join(', ')}`;
  
  // Apply client-side OCR normalization before sending to backend
  const normalizedIngredients = normalizeOcrText(ingredientsText);
  const normalizedNutrition = nutritionText ? normalizeOcrText(nutritionText) : null;

  let combinedText = `INGREDIENTS SCAN TEXT:\n${normalizedIngredients}\n\n`;
  if (normalizedNutrition) {
    combinedText += `NUTRITION FACTS SCAN TEXT:\n${normalizedNutrition}\n\n`;
  }

  const prompt = `${TEXT_ANALYSIS_PROMPT.replace('{PROFILE_CONTEXT}', profileContext)}\n\n${combinedText}`;

  // Send to Express backend (which runs the full hybrid pipeline)
  const parsed = await callBackend('/api/analyze', { text: prompt });

  onProgress?.('Generating Health Insights...', 95);
  const getArray = (val: any) => Array.isArray(val) ? val : (typeof val === 'string' ? [val] : []);

  return {
    product: buildProduct(parsed, 'Scanned Product', '🤖', combinedText),
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

export async function analyzeTextWithAi(
  productName: string,
  ingredientsText: string,
  profile: any,
  onProgress?: (message: string, percent: number) => void
): Promise<AiAnalysisResult> {
  onProgress?.('Analyzing with Aavis AI...', 25);

  const profileContext = `Age: ${profile.age}, Diet: ${profile.diet}, Allergies: ${profile.allergens.join(', ')}, Conditions: ${profile.conditions.join(', ')}`;
  const rawText = `Product Name: ${productName}\nIngredients/Details: ${normalizedText}`;
  const prompt = `${TEXT_ANALYSIS_PROMPT.replace('{PROFILE_CONTEXT}', profileContext)}\n\n${rawText}`;
  
  const parsed = await callBackend('/api/analyze', { text: prompt });
  onProgress?.('Finalizing results...', 95);

  const product = buildProduct(parsed, productName || 'Scanned Product', '📝', ingredientsText);
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

export async function askAiAboutFood(query: string): Promise<string> {
  const prompt = `You are Aavis, a strict nutrition expert created by Batman.
You only answer questions about food, nutrition, and diet. If the user asks about anything else, say "I can only help you with food questions."
Keep answers concise (2-3 sentences) and state if the food is safe, caution, or hazardous.

The user asks: "${query}"

Aavis replies:`;

  const parsed = await callBackend('/api/chat', { message: prompt });
  return parsed.reply || '';
}

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

