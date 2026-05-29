import { aiOcrCorrection } from './geminiAnalysis';

// A dictionary of common food-industry OCR misspellings and distortions
const FUZZY_DICTIONARY: Record<string, string> = {
  // General distorted words
  'flavosin': 'flavoring',
  'flavourlng': 'flavouring',
  'sodlum': 'sodium',
  'hydrogented': 'hydrogenated',
  'preservatlve': 'preservative',
  'emulslfier': 'emulsifier',
  'artifical': 'artificial',
  'artifcial': 'artificial',
  'sweetner': 'sweetener',
  'sweetnar': 'sweetener',
  'stablizer': 'stabilizer',
  'antioxident': 'antioxidant',
  'chlorlde': 'chloride',
  'calcum': 'calcium',
  'potasslum': 'potassium',
  'suger': 'sugar',
  'carbohydrtae': 'carbohydrate',
  'protlen': 'protein',
  'chloesterol': 'cholesterol',
  'Ingredlents': 'Ingredients',
  'ingredlents': 'ingredients',
  'vitamlne': 'vitamin',
  'e tract': 'extract',
  'exract': 'extract',
  
  // Common phrases
  'flavosin agent': 'flavoring agent',
};

// 1. Regex & String cleanup
function cleanOcrNoise(text: string): string {
  let cleaned = text;
  
  // Remove non-printable and garbage symbols (keep newlines and spaces, and standard punctuation)
  cleaned = cleaned.replace(/[^\x20-\x7E\n\r\t]/g, ' ');
  
  // Collapse multiple spaces
  cleaned = cleaned.replace(/[ ]{2,}/g, ' ');
  
  // Fix common spacing issues around punctuation
  cleaned = cleaned.replace(/\s*,\s*/g, ', ');
  cleaned = cleaned.replace(/\s*:\s*/g, ': ');
  cleaned = cleaned.replace(/\s*;\s*/g, '; ');
  
  // Normalize units spacing (e.g. "10 g" -> "10g", "100 mg" -> "100mg", "50 kcal" -> "50kcal")
  cleaned = cleaned.replace(/(\d+)\s*(g|mg|kcal|cal)\b/gi, '$1$2');
  
  return cleaned.trim();
}

// 2. Fuzzy Dictionary Replacement
function applyFuzzyDictionary(text: string): string {
  let corrected = text;
  
  // Sort dictionary by length descending so longer phrases match first
  const entries = Object.entries(FUZZY_DICTIONARY).sort((a, b) => b[0].length - a[0].length);
  
  for (const [bad, good] of entries) {
    // Case-insensitive matching for robust replacement
    const regex = new RegExp(bad, 'gi'); 
    corrected = corrected.replace(regex, (match) => {
      // Maintain original casing of the first letter if possible
      if (match[0] === match[0].toUpperCase()) {
        return good.charAt(0).toUpperCase() + good.slice(1);
      }
      return good;
    });
  }
  
  return corrected;
}

// 3. Main Intelligent Pipeline
export async function intelligentOcrCorrection(
  rawText: string,
  mode: 'ingredients' | 'nutrition' = 'ingredients',
  onProgress?: (msg: string) => void
): Promise<string> {
  if (!rawText || rawText.trim().length < 3) return rawText;
  
  // Step 1: Fast Regex Cleanup
  onProgress?.('Cleaning OCR noise...');
  let processedText = cleanOcrNoise(rawText);
  
  // Step 2: Dictionary Matching
  onProgress?.('Applying food-label dictionary...');
  processedText = applyFuzzyDictionary(processedText);
  
  // Step 3: AI Contextual Normalization (Deep pass)
  onProgress?.('Running AI contextual correction...');
  processedText = await aiOcrCorrection(processedText, mode);
  
  return processedText;
}
