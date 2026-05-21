const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// ─── MIDDLEWARE ────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

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
  "productName": "string - product name from the label",
  "brand": "string - brand name, or 'Unknown Brand' if not visible",
  "ingredients": ["array of individual ingredient strings"],
  "nutrients": {
    "calories": number (kcal per 100g, 0 if not found),
    "sugar": number (g per 100g, 0 if not found),
    "sodium": number (mg per 100g, 0 if not found),
    "fat": number (g per 100g, 0 if not found),
    "satFat": number (g per 100g, 0 if not found),
    "protein": number (g per 100g, 0 if not found),
    "fiber": number (g per 100g, 0 if not found),
    "carbs": number (g per 100g, 0 if not found)
  },
  "additives": ["array of E-number codes found, e.g. 'E102', 'E211'"],
  "allergens": ["array of allergen categories"],
  "warnings": ["array of health warning strings"],
  "aiSummary": "A short funny line about the product (AI roast)"
}

Return ONLY a valid JSON object. No markdown. No backticks. No explanation. Just raw JSON.`;

// ─── ANALYZE ROUTE (Groq + Gemini fallback) ───────────────────────

app.post('/api/analyze', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'No text provided for analysis' });
  }

  console.log('[Server] Received analysis request, text length:', text.length);

  // Try Groq first, then fallback to Gemini
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.VITE_GEMINI_API_KEY;

  if (!groqKey && !geminiKey) {
    return res.status(500).json({ error: 'No API keys configured on server' });
  }

  try {
    let parsed;

    if (groqKey) {
      parsed = await analyzeWithGroq(text, groqKey);
    } else {
      parsed = await analyzeWithGemini(text, geminiKey);
    }

    console.log('[Server] Analysis complete!');
    return res.json(parsed);
  } catch (error) {
    console.error('[Server] Analysis error:', error.message);

    // If Groq fails and Gemini key exists, try fallback
    if (groqKey && geminiKey) {
      try {
        console.log('[Server] Groq failed, trying Gemini fallback...');
        const parsed = await analyzeWithGemini(text, geminiKey);
        console.log('[Server] Gemini fallback succeeded!');
        return res.json(parsed);
      } catch (fallbackError) {
        console.error('[Server] Gemini fallback also failed:', fallbackError.message);
      }
    }

    return res.status(500).json({ error: error.message || 'Analysis failed' });
  }
});

// ─── GROQ ANALYSIS ───────────────────────────────────────────────

async function analyzeWithGroq(text, apiKey) {
  const groq = new Groq({ apiKey });

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content:
          'You are Aavis, a professional nutrition and food safety expert. Always return strict valid JSON only. No extra text.',
      },
      {
        role: 'user',
        content: `${ANALYSIS_PROMPT}\n\nExtracted Text from Label:\n${text}`,
      },
    ],
    temperature: 0.1,
    max_tokens: 2048,
  });

  const textResponse = completion.choices[0].message.content;
  return parseAIResponse(textResponse);
}

// ─── GEMINI ANALYSIS ──────────────────────────────────────────────

async function analyzeWithGemini(text, apiKey) {
  const GEMINI_API_URL =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent';

  const prompt = `${ANALYSIS_PROMPT}\n\nExtracted Text from Label:\n${text}`;

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

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Groq API key missing' });
  }

  try {
    const groq = new Groq({ apiKey });

    const messages = [
      {
        role: 'system',
        content:
          'You are Aavis, a helpful and slightly humorous AI nutrition assistant for an Indian health app.',
      },
      ...history,
      { role: 'user', content: message },
    ];

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.7,
      max_tokens: 1024,
    });

    return res.json({ reply: completion.choices[0].message.content });
  } catch (error) {
    console.error('[Server] Chat error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// ─── START SERVER ─────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n  🟢 Aavis Backend API running on port ${PORT}`);
  console.log(`  📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`  🔑 Groq API:    ${process.env.GROQ_API_KEY ? '✅ configured' : '❌ missing'}`);
  console.log(`  🔑 Gemini API:  ${process.env.VITE_GEMINI_API_KEY ? '✅ configured' : '❌ missing'}\n`);
});
