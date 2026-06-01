const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// ─── MIDDLEWARE ────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({
  verify: (req, res, buf, encoding) => {
    try {
      req.rawBody = buf.toString(encoding || 'utf8');
      console.log(`[Raw Request] Method: ${req.method} Path: ${req.path} Size: ${buf.length} bytes Content-Type: ${req.headers['content-type']}`);
      if (req.path === '/api/analyze' || req.path === '/api/chat') {
        console.log(`[Raw Body Preview] ${req.rawBody.substring(0, 500)}`);
      }
    } catch (e) {
      console.error('[Raw Request] Could not read raw body', e);
    }
  }
}));

// ─── HEALTH CHECK ─────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Aavis Backend API',
    version: '1.0.0',
    endpoints: ['/api/analyze', '/api/chat', '/api/signup', '/api/login'],
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// ─── USER STORAGE HELPERS ─────────────────────────────────────────
const USERS_FILE = path.join(__dirname, 'users.json');

function readUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    return [];
  }
  const data = fs.readFileSync(USERS_FILE, 'utf8');
  return JSON.parse(data || '[]');
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

// ─── AUTH ROUTES ──────────────────────────────────────────────────

app.post('/api/signup', async (req, res) => {
  const { username, password, name } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const users = readUsers();
  if (users.find((u) => u.username === username)) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ username, password: hashedPassword, name });
  writeUsers(users);

  console.log(`[Server] User registered: ${username}`);
  res.json({ success: true, message: 'User registered successfully' });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const users = readUsers();
  const user = users.find((u) => u.username === username);

  if (!user) {
    return res.status(400).json({ error: 'Invalid username or password' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(400).json({ error: 'Invalid username or password' });
  }

  console.log(`[Server] User logged in: ${username}`);
  res.json({
    success: true,
    message: 'Logged in successfully',
    user: { username: user.username, name: user.name },
  });
});

// ─── ANALYSIS PROMPT ──────────────────────────────────────────────

const ANALYSIS_PROMPT = `Analyze this food label text. Return a concise JSON object with the following structure:
{
  "productName": "string - common name (Look for largest/topmost text. If unknown, infer e.g. 'Instant Noodles', 'Processed Snack')",
  "brand": "string - brand name (Look for brand logo text)",
  "productType": "food | beverage",
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
      "healthExplanation": "Consumer-friendly health impact",
      "hazard": "safe | caution | hazardous"
    }
  },
  "ingredientDetails": {
    "INGREDIENT_NAME": {
      "hazard": "safe | mild | caution | harmful | hazardous",
      "explanation": "short human-readable explanation of why this ingredient is at this hazard level"
    }
  },
  "allergens": ["array of detected allergens"],
  "mainConcerns": ["array of 2-3 short human-readable health risks"],
  "dietAdvice": "A strict, brutally honest, conversational 2-line verdict acting as a human nutrition expert explaining exactly why it is safe or hazardous",
  "aiSummary": "short funny AI roast line (Indian context)"
}

Return ONLY a valid JSON object. No markdown. No backticks. No explanation. Just raw JSON.`;

// ─── ANALYZE ROUTE (Gemini) ───────────────────────────────────────

app.post('/api/analyze', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'No text provided for analysis' });
  }

  console.log('[Server] Received analysis request, text length:', text.length);

  const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  if (!geminiKey) {
    return res.status(500).json({ error: 'Gemini API key missing on server' });
  }

  try {
    const parsed = await analyzeWithGemini(text, geminiKey);
    console.log('[Server] Analysis complete!');
    return res.json(parsed);
  } catch (error) {
    console.error('[Server] Analysis error:', error.message);
    return res.status(500).json({ error: error.message || 'Analysis failed' });
  }
});

// ─── GEMINI ANALYSIS ──────────────────────────────────────────────

async function analyzeWithGemini(text, apiKey) {
  const GEMINI_API_URL =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent';

  // If text already contains the analysis instructions, use it directly.
  // Otherwise, fallback to prepending the server-side ANALYSIS_PROMPT.
  const prompt = text.includes('Return a concise JSON object') || text.includes('ingredientDetails')
    ? text
    : `${ANALYSIS_PROMPT}\n\nExtracted Text from Label:\n${text}`;

  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.1,
      topP: 0.8,
      maxOutputTokens: 2048,
    },
  };

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Gemini API error');
  }

  const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textResponse) {
    throw new Error('Empty response from Gemini');
  }

  return parseAIResponse(textResponse);
}

// ─── JSON PARSER HELPER ──────────────────────────────────────────

function parseAIResponse(textResponse) {
  let cleaned = textResponse
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error('Failed to parse JSON from AI response');
  }
}

// ─── CHAT ROUTE ───────────────────────────────────────────────────

app.post('/api/chat', async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'No message provided' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API key missing' });
  }

  try {
    // Convert OpenAI history format to Gemini format
    const geminiContents = history.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));
    geminiContents.push({ role: 'user', parts: [{ text: message }] });

    const requestBody = {
      systemInstruction: {
        parts: [{ text: 'You are Aavis, a helpful and slightly humorous AI nutrition assistant for an Indian health app.' }]
      },
      contents: geminiContents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      }
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Gemini API error');
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.json({ reply });
  } catch (error) {
    console.error('[Server] Chat error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// ─── ERROR HANDLING MIDDLEWARE ────────────────────────────────────
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('[INVALID JSON]', err.message);
    if (req.rawBody) {
      console.error('[Malformed Body Dump]', req.rawBody);
    }
    return res.status(400).json({
      success: false,
      error: 'Invalid request format'
    });
  }
  next(err);
});

// ─── START SERVER ─────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n  🟢 Aavis Backend API running on port ${PORT}`);
  console.log(`  📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`  🔑 Gemini API:  ${process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY ? '✅ configured' : '❌ missing'}\n`);
});
