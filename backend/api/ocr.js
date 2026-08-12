import { checkRateLimit } from './_lib/rateLimiter.js';
import { supabaseAdmin } from './_lib/supabaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Rate Limiting Check
  const rateLimit = await checkRateLimit(req, 'ai');
  if (!rateLimit.success) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  const { image, mode = 'ingredients' } = req.body;
  if (!image) return res.status(400).json({ error: 'No image provided' });

  // Optional Authentication Verification
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token && token !== 'undefined' && token !== 'null') {
      try {
        await supabaseAdmin.auth.getUser(token);
      } catch (err) {
        console.warn('[Vercel API] Token validation warning:', err.message);
      }
    }
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (apiKey) {
    try {
      console.log(`[Vercel API] Processing OCR request via Gemini API, mode: ${mode}`);
      const model = 'gemini-3.1-flash-lite';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      let prompt;
      if (mode === 'nutrition') {
        prompt = `You are a precise nutrition label reader with expert vision. Your task is to read EVERY piece of text from this nutrition facts panel.

EXTRACT IN THIS EXACT ORDER:
1. Serving size and servings per container (e.g. "Serving Size: 28g / 1 oz (about 23 pieces)")  
2. Calories per serving and per 100g if shown
3. ALL nutrients — read BOTH the nutrient name AND its numeric value with unit:
   Format each as "Nutrient Name: Value Unit" (e.g. "Total Fat: 8g", "Sodium: 140mg", "Total Carbohydrate: 37g")
4. Include sub-nutrients with indentation (Saturated Fat, Trans Fat, Dietary Fiber, Total Sugars, Added Sugars, Vitamin D, etc.)
5. Daily Value percentages (e.g. "Total Fat 8g 10%")

RULES:
- DO NOT skip any row. Even if values are zero, include them.
- Preserve exact spelling and capitalization from the label.
- Include footnotes or asterisk text if visible.
- Output as plain text, one item per line.`;
      } else if (mode === 'ingredients') {
        prompt = `You are a food label expert with perfect vision. Extract the COMPLETE ingredients list from this food packaging image.

EXTRACTION RULES:
- Extract EVERY ingredient, including sub-ingredients inside brackets/parentheses
- Preserve all E-numbers and additive codes exactly (e.g. E471, E322(i), INS 415)
- Preserve all percentages exactly (e.g. "Wheat Flour (43%)", "Sugar 12%")
- Include CONTAINS / ALLERGEN statements if visible
- Include any "May contain traces of..." warnings
- Include "Manufactured in a facility..." text if present
- Preserve commas, brackets, and natural punctuation exactly
- DO NOT rephrase, summarize, or reorder any ingredients
- If you see multiple languages, extract the English version only

Output the raw ingredients text exactly as it appears on the label.`;
      } else {
        prompt = `You are a high-accuracy food label OCR engine with expert vision. Read ALL text from this food packaging image.

EXTRACT EVERYTHING:
1. Product name and brand
2. Variant/flavour name
3. Complete ingredients list (with all E-codes, percentages, sub-ingredients in brackets)
4. Complete nutrition facts table (every nutrient name + value + unit + %DV)
5. Allergen warnings (CONTAINS, MAY CONTAIN)
6. Net weight / volume
7. Any health claims visible

RULES:
- Extract text verbatim — do not paraphrase or summarize
- Preserve all numbers, percentages, units, and codes exactly
- If text is partially obscured, mark it with [unclear] rather than guessing
- Output as structured plain text, preserving the label's natural sections`;
      }

      const isDataUrl = image.startsWith('data:image/');
      const mimeType = image.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
      const base64Data = isDataUrl ? image.replace(/^data:image\/\w+;base64,/, '') : image;

      const requestBody = {
        contents: [{
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: base64Data
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.05,
          maxOutputTokens: 4096,
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Gemini API error during OCR');
      }

      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return res.json({ text: textResponse.trim() });

    } catch (error) {
      console.error('[Vercel API] Gemini OCR failed:', error.message);
      return res.status(500).json({ error: error.message });
    }
  }

  // Fallback to Ollama Vision
  const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
  try {
    console.log(`[Vercel API] Falling back to Ollama Vision for OCR, mode: ${mode}`);
    let prompt = "Read this nutrition label carefully. Extract BOTH the nutrient names on the left and their corresponding numeric values on the right. Format each line as 'Nutrient Name: Value'. Do not skip the nutrient names. Preserve all text exactly.";
    if (mode === 'ingredients') {
      prompt = "You are an expert OCR engine specializing in food packaging ingredient lists. Scan this image of the ingredients list and extract the raw ingredients text. Extract the complete list of ingredients, including brackets, percentages (e.g. 4.3%), and additive codes/names. DO NOT summarize, format as lists, or drop any text. Extract every single word in the ingredients section exactly as printed on the label. Preserve the natural layout of the text.";
    }
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2',
        messages: [{
          role: 'user',
          content: prompt,
          images: [base64Data]
        }],
        stream: false,
        options: { temperature: 0.1 }
      })
    });

    if (!response.ok) throw new Error('Ollama OCR server error');
    const data = await response.json();
    return res.json({ text: (data.message?.content || '').trim() });
  } catch (error) {
    console.error('[Vercel API] Ollama OCR fallback failed:', error.message);
    return res.status(500).json({ error: 'All OCR backends failed. Please make sure Gemini API key is configured or local Ollama is running.' });
  }
}
