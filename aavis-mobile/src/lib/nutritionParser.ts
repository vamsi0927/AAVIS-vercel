/**
 * Robust Intelligent Nutrition Parser
 * 
 * Uses fuzzy regex pattern matching to extract nutrition values from noisy OCR text.
 * This acts as a fallback to catch values that the LLM might miss, hallucinate as 0, or miscategorize.
 */

export interface ParsedNutrients {
  calories: number | null;
  fat: number | null;
  satFat: number | null;
  carbs: number | null;
  sugar: number | null;
  sodium: number | null;
  protein: number | null;
  fiber: number | null;
}

/**
 * Extracts a numeric value for a given regex pattern.
 */
function extractValue(text: string, pattern: RegExp): number | null {
  const match = text.match(pattern);
  if (match && match[1]) {
    const val = parseFloat(match[1].replace(/,/g, ''));
    if (!isNaN(val)) return val;
  }
  return null;
}

export function extractNutrientsFromText(rawText: string): ParsedNutrients {
  if (!rawText) return { calories: null, fat: null, satFat: null, carbs: null, sugar: null, sodium: null, protein: null, fiber: null };

  const text = rawText.toLowerCase().replace(/\n/g, ' ');

  // Regex patterns:
  // We look for the keyword, allow some noise/spaces, then capture the number.
  // We ignore non-digits in between (like " : ", " - ", " g ") unless it breaks the number.
  
  // Calories / Energy / kcal / cal
  const calories = extractValue(text, /(?:calories|energy|kcal|cal)[^\d]*([\d\.,]+)/i);
  
  // Total Fat / Fat
  const fat = extractValue(text, /(?:total\s*)?fat[^\d]*([\d\.,]+)/i);
  
  // Saturated Fat
  const satFat = extractValue(text, /(?:sat\.|saturated|sat)[^\d]*fat[^\d]*([\d\.,]+)/i);
  
  // Carbohydrates / Carbs
  const carbs = extractValue(text, /(?:total\s*)?(?:carb|carbohydrate|carbohydrates)[^\d]*([\d\.,]+)/i);
  
  // Sugars / Sugar
  const sugar = extractValue(text, /(?:sugars?|added sugars?)[^\d]*([\d\.,]+)/i);
  
  // Sodium / Salt
  const sodium = extractValue(text, /(?:sodium|salt)[^\d]*([\d\.,]+)/i);
  
  // Protein
  const protein = extractValue(text, /(?:proteins?|protiens?)[^\d]*([\d\.,]+)/i);
  
  // Dietary Fiber / Fiber
  const fiber = extractValue(text, /(?:dietary\s*)?fib(?:er|re)[^\d]*([\d\.,]+)/i);

  return {
    calories,
    fat,
    satFat,
    carbs,
    sugar,
    sodium,
    protein,
    fiber
  };
}
