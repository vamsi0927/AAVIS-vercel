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

  // Authentication Verification
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }
  
  const token = authHeader.split(' ')[1];
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized: Invalid session' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (apiKey) {
    try {
      console.log(`[Vercel API] Processing OCR request via Gemini API, mode: ${mode}`);
      const model = 'gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      let prompt = "Read this nutrition label carefully. Extract BOTH the nutrient names on the left and their corresponding numeric values on the right. Format each line as 'Nutrient Name: Value'. Do not skip the nutrient names. Preserve all text exactly.";
      if (mode === 'ingredients') {
        prompt = "You are an expert OCR engine specializing in food packaging ingredient lists. Scan this image of the ingredients list and extract the raw ingredients text. Extract the complete list of ingredients, including brackets, percentages (e.g. 4.3%), and additive codes/names. DO NOT summarize, format as lists, or drop any text. Extract every single word in the ingredients section exactly as printed on the label. Preserve the natural layout of the text.";
      }

      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

      const requestBody = {
        contents: [{
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Data
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
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
