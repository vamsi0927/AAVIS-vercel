const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

// ─── SUPABASE ADMIN CLIENT ─────────────────────────────────────────
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
let supabaseAdmin = null;
function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing Supabase env vars');
    supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  }
  return supabaseAdmin;
}

// ─── NODEMAILER (GMAIL) ────────────────────────────────────────────
const GMAIL_USER = process.env.GMAIL_USER || 'aavis.support@gmail.com';
const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD || '';
const mailTransport = nodemailer.createTransport({ service: 'gmail', auth: { user: GMAIL_USER, pass: GMAIL_PASS } });
async function sendEmail({ to, subject, html }) {
  return mailTransport.sendMail({ from: `AAVIS <${GMAIL_USER}>`, to, subject, html });
}
function escapeHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ─── IN-MEMORY RATE LIMITER (simple, per IP) ──────────────────────
const rateLimitMap = new Map();
function rateLimitCheck(ip, key, max, windowMs) {
  const now = Date.now();
  const k = `${ip}:${key}`;
  const entry = rateLimitMap.get(k) || { count: 0, reset: now + windowMs };
  if (now > entry.reset) { entry.count = 0; entry.reset = now + windowMs; }
  entry.count++;
  rateLimitMap.set(k, entry);
  return entry.count <= max;
}

const app = express();
const PORT = process.env.PORT || 3002;

// ─── SECURITY HARDENING ────────────────────────────────────────────
app.disable('x-powered-by');

// ─── MIDDLEWARE ────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({
  verify: (req, res, buf, encoding) => {
    try {
      req.rawBody = buf.toString(encoding || 'utf8');
      console.log(`[Raw Request] Method: ${req.method} Path: ${req.path} Size: ${buf.length} bytes`);
      if (req.path === '/api/analyze' || req.path === '/api/chat') {
        console.log(`[Raw Body Preview] ${req.rawBody.substring(0, 300)}`);
      }
    } catch (e) {
      console.error('[Raw Request] Could not read raw body', e);
    }
  }
}));

// ─── HEALTH CHECK ─────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'Aavis Backend API', version: '2.0.0-hybrid' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString(), pipeline: 'hybrid-deterministic' });
});

// ─── USER STORAGE HELPERS ─────────────────────────────────────────
const USERS_FILE = path.join(__dirname, 'users.json');

function readUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  const data = fs.readFileSync(USERS_FILE, 'utf8');
  return JSON.parse(data || '[]');
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

// ─── AUTH ROUTES ──────────────────────────────────────────────────

// POST /api/auth/send-otp  — Register + send email OTP
app.post('/api/auth/send-otp', async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.ip || '127.0.0.1';
  if (!rateLimitCheck(ip, 'auth', 5, 60000)) return res.status(429).json({ error: 'Too many requests. Please try again.' });

  const { email, password, name } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: 'Missing required fields' });

  try {
    const db = getSupabaseAdmin();
    const cleanEmail = email.trim();
    let userId, isNewUser = true;

    const { data: userData, error: createError } = await db.auth.admin.createUser({
      email: cleanEmail, password, email_confirm: false,
      user_metadata: { name, signupSource: 'app' }
    });

    if (createError) {
      if (!createError.message.toLowerCase().includes('already')) {
        return res.status(400).json({ error: createError.message });
      }
      isNewUser = false;
      const { data: { users } } = await db.auth.admin.listUsers();
      const existing = users.find(u => u.email === cleanEmail);
      if (!existing) return res.status(500).json({ error: 'Failed to locate account' });
      userId = existing.id;
      if (existing.email_confirmed_at) {
        await sendEmail({ to: cleanEmail, subject: 'AAVIS Registration Attempt', html: '<p>You already have an AAVIS account. Please log in.</p>' }).catch(() => {});
        return res.status(200).json({ message: 'Registration processed. Check your email.' });
      }
    } else {
      userId = userData.user.id;
    }

    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const hashedOtp = crypto.createHash('sha256').update(rawOtp).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await db.from('verification_tokens').delete().eq('user_id', userId);
    const { error: dbError } = await db.from('verification_tokens').insert({ user_id: userId, hashed_token: hashedOtp, expires_at: expiresAt });
    if (dbError) {
      if (isNewUser && userId) await db.auth.admin.deleteUser(userId).catch(() => {});
      return res.status(500).json({ error: 'Failed to generate verification code' });
    }

    await sendEmail({
      to: cleanEmail,
      subject: 'Verify your AAVIS Account',
      html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px"><h2>Welcome to AAVIS, ${escapeHtml(name)}!</h2><p>Your verification code:</p><div style="background:#f3f4f6;padding:16px;font-size:32px;font-weight:bold;letter-spacing:6px;text-align:center;border-radius:8px;margin:20px 0">${rawOtp}</div><p style="color:#dc2626;font-weight:bold">Expires in 10 minutes.</p></div>`
    });

    return res.status(200).json({ message: 'Verification code sent.' });
  } catch (err) {
    console.error('[Auth] send-otp error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/verify-otp  — Verify email OTP
app.post('/api/auth/verify-otp', async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.ip || '127.0.0.1';
  if (!rateLimitCheck(ip, 'verify', 10, 60000)) return res.status(429).json({ error: 'Too many attempts. Please try again.' });

  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Missing email or OTP' });

  try {
    const db = getSupabaseAdmin();
    const { data: { users } } = await db.auth.admin.listUsers();
    const user = users.find(u => u.email === email.trim());
    if (!user) return res.status(400).json({ error: 'Invalid verification attempt' });

    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    const { data: deleted, error: deleteError } = await db.from('verification_tokens')
      .delete().eq('user_id', user.id).eq('hashed_token', hashedOtp)
      .gte('expires_at', new Date().toISOString()).select();

    if (deleteError || !deleted || deleted.length === 0)
      return res.status(400).json({ error: 'Invalid or expired verification code' });

    await db.auth.admin.updateUserById(user.id, { email_confirm: true });
    return res.status(200).json({ message: 'Email verified successfully.' });
  } catch (err) {
    console.error('[Auth] verify-otp error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/forgot-password  — Send password reset OTP
app.post('/api/auth/forgot-password', async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.ip || '127.0.0.1';
  if (!rateLimitCheck(ip, 'auth', 5, 60000)) return res.status(429).json({ error: 'Too many requests. Please try again.' });

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });

  try {
    const db = getSupabaseAdmin();
    const { data: { users } } = await db.auth.admin.listUsers();
    const user = users.find(u => u.email === email.trim());
    if (!user) return res.status(200).json({ message: 'If an account exists, a reset link has been sent.' });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedToken = crypto.createHash('sha256').update(otpCode).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await db.from('password_reset_tokens').delete().eq('user_id', user.id);
    const { error: dbError } = await db.from('password_reset_tokens').insert({ user_id: user.id, hashed_token: hashedToken, expires_at: expiresAt });
    if (dbError) return res.status(500).json({ error: 'Failed to generate reset token' });

    await sendEmail({
      to: email,
      subject: 'Your AAVIS Password Reset Code',
      html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px"><h2>Password Reset</h2><p>Your reset code:</p><div style="background:#f3f4f6;padding:16px;font-size:32px;font-weight:bold;letter-spacing:6px;text-align:center;border-radius:8px;margin:20px 0">${otpCode}</div><p style="color:#dc2626;font-weight:bold">Expires in 10 minutes.</p></div>`
    });

    return res.status(200).json({ message: 'If an account exists, a reset link has been sent.' });
  } catch (err) {
    console.error('[Auth] forgot-password error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/verify-reset-otp  — Verify reset OTP and issue secure token
app.post('/api/auth/verify-reset-otp', async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.ip || '127.0.0.1';
  if (!rateLimitCheck(ip, 'verify', 10, 60000)) return res.status(429).json({ error: 'Too many attempts. Please try again.' });

  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Missing email or OTP code' });

  try {
    const db = getSupabaseAdmin();
    const { data: { users } } = await db.auth.admin.listUsers();
    const user = users.find(u => u.email === email.trim());
    if (!user) return res.status(400).json({ error: 'Invalid or expired OTP.' });

    const hashedOtp = crypto.createHash('sha256').update(otp.trim()).digest('hex');
    const { data: tokens, error: fetchError } = await db.from('password_reset_tokens')
      .select('*').eq('user_id', user.id).eq('hashed_token', hashedOtp).single();

    if (fetchError || !tokens) return res.status(400).json({ error: 'Invalid or expired OTP code.' });
    if (new Date(tokens.expires_at) < new Date()) {
      await db.from('password_reset_tokens').delete().eq('id', tokens.id);
      return res.status(400).json({ error: 'This OTP has expired. Please request a new one.' });
    }

    await db.from('password_reset_tokens').delete().eq('id', tokens.id);

    const secureToken = crypto.randomBytes(32).toString('hex');
    const hashedSecureToken = crypto.createHash('sha256').update(secureToken).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    await db.from('password_reset_tokens').insert({ user_id: user.id, hashed_token: hashedSecureToken, expires_at: expiresAt });

    return res.status(200).json({ success: true, token: secureToken, uid: user.id });
  } catch (err) {
    console.error('[Auth] verify-reset-otp error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/reset-password  — Set new password using secure token
app.post('/api/auth/reset-password', async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.ip || '127.0.0.1';
  if (!rateLimitCheck(ip, 'auth', 5, 60000)) return res.status(429).json({ error: 'Too many requests. Please try again.' });

  const { token, uid, newPassword } = req.body;
  if (!token || !uid || !newPassword) return res.status(400).json({ error: 'Missing required fields' });

  try {
    const db = getSupabaseAdmin();
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const { data: tokenRow, error: fetchError } = await db.from('password_reset_tokens')
      .select('*').eq('user_id', uid).eq('hashed_token', hashedToken).single();

    if (fetchError || !tokenRow) return res.status(400).json({ error: 'Invalid or expired reset link.' });
    if (new Date(tokenRow.expires_at) < new Date()) {
      await db.from('password_reset_tokens').delete().eq('id', tokenRow.id);
      return res.status(400).json({ error: 'This reset link has expired.' });
    }

    const { error: updateError } = await db.auth.admin.updateUserById(uid, { password: newPassword });
    if (updateError) return res.status(500).json({ error: 'Failed to reset password.' });

    await db.from('password_reset_tokens').delete().eq('id', tokenRow.id);
    return res.status(200).json({ message: 'Password has been successfully reset.' });
  } catch (err) {
    console.error('[Auth] reset-password error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/auth/delete-account  — Delete user account
app.delete('/api/auth/delete-account', async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.ip || '127.0.0.1';
  if (!rateLimitCheck(ip, 'auth', 5, 60000)) return res.status(429).json({ error: 'Too many requests. Please try again.' });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing or invalid authorization header' });

  const token = authHeader.split(' ')[1];
  try {
    const db = getSupabaseAdmin();
    const { data: { user }, error: userError } = await db.auth.getUser(token);
    if (userError || !user) return res.status(401).json({ error: 'Invalid or expired session' });

    const { error: deleteError } = await db.auth.admin.deleteUser(user.id);
    if (deleteError) return res.status(500).json({ error: 'Failed to delete account.' });

    return res.status(200).json({ success: true, message: 'Account successfully deleted.' });
  } catch (err) {
    console.error('[Auth] delete-account error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════
// STAGE 1: CONTEXT-AWARE OCR NORMALIZATION
// Fixes common Tesseract OCR character substitutions in NUMERIC
// contexts ONLY. Does NOT blindly alter ingredient name characters.
// ═══════════════════════════════════════════════════════════════════

function normalizeOcrText(rawText) {
  if (!rawText || typeof rawText !== 'string') return rawText;
  let text = rawText;
  // Fix "O" misread as "0" between digits: "1O0" -> "100", "2Og" -> "20g"
  text = text.replace(/(\d)O(\d)/g, '$10$2');
  text = text.replace(/(\d)O(g|ml|mg|kcal|kJ)/gi, '$10$2');
  // Fix "l" (lowercase L) misread as "1" before units: "l.5g" -> "1.5g"
  text = text.replace(/\bl(\d)/g, '1$1');
  text = text.replace(/\bl\.([\d])/g, '1.$1');
  // Fix "S" as "5" before digits+unit: "S0g" -> "50g" (preserves "Salt")
  text = text.replace(/\bS(\d)(g|ml|mg|kcal|kJ)\b/gi, '5$1$2');
  // Fix "I" between digits: "3I0" -> "310"
  text = text.replace(/(\d)I(\d)/g, '$11$2');
  // Fix "A" between digits: "1A5" -> "145"
  text = text.replace(/(\d)A(\d)/g, '$14$2');
  // Normalize INS codes to E-codes: "INS 621" -> "E621"
  text = text.replace(/\bINS\s*-?\s*(\d{3,4}[a-zA-Z]?)\b/gi, 'E$1');
  console.log('[OCR Normalizer] Processed text length:', text.length);
  return text;
}

// ═══════════════════════════════════════════════════════════════════
// STAGE 2: OLLAMA EXTRACTION PROMPT
// Ollama extracts ONLY what is on the label.
// null = not present on label. 0 = explicitly zero. Never infer.
// ═══════════════════════════════════════════════════════════════════

const EXTRACTION_PROMPT = `You are a strict food label data extractor. Your ONLY task is to extract information EXACTLY as written in the label text.

CRITICAL RULES — follow these precisely:
1. If a nutrition value is NOT explicitly written on the label return null. null means absent, NOT zero.
2. If serving size is not stated return null for servingSize.
3. If added sugar is not listed separately return null for addedSugar.
4. If fiber is not listed return null for fiber.
5. NEVER calculate, estimate, or infer any value. Only extract what is written.
6. For parenthetical sub-ingredients like "Vegetable Oil (Sunflower, Corn Oil)" include the parent AND sub-ingredients as separate array entries.
7. All "INS XXX" codes must become "EXXX" in the output (e.g. INS 471 -> E471).
8. Provide ingredientDetails for EVERY item in the ingredients array.
9. Provide additiveDetails for EVERY item in the additives array.

Return ONLY this exact JSON. No markdown. No backticks. No explanation. No text outside the JSON:
{
  "productName": "string or null",
  "brand": "string or null",
  "productType": "Whole Food | Beverage | Snack | Dairy | Bakery | Breakfast Food | Protein Supplement | Confectionery | Sauce & Condiment | Cooking Oil & Fat | Ready Meal | Plant-Based Alternative | General Food",
  "servingSize": "e.g. 30g or 200ml or null",
  "nutritionUnit": "e.g. per 100g or null",
  "ingredients": ["flat list including sub-ingredients"],
  "nutrients": {
    "calories": number_or_null,
    "sugar": number_or_null,
    "addedSugar": number_or_null,
    "sodium": number_or_null,
    "fat": number_or_null,
    "satFat": number_or_null,
    "protein": number_or_null,
    "fiber": number_or_null,
    "carbs": number_or_null
  },
  "additives": ["E-codes found e.g. E621"],
  "additiveDetails": {
    "E621": { "name": "MSG", "function": "Flavour Enhancer", "healthExplanation": "...", "hazard": "caution" }
  },
  "ingredientDetails": {
    "Salt": { "hazard": "mild", "explanation": "..." }
  },
  "allergens": ["any allergens explicitly declared on the label"],
  "uncertainFields": ["field names you were unsure about"]
}`;

// ═══════════════════════════════════════════════════════════════════
// STAGE 3: NUTRITION VALIDATION ENGINE
// Detects physically impossible values and quarantines them.
// Prevents Ollama hallucinations from corrupting the health score.
// ═══════════════════════════════════════════════════════════════════

function validateAndSanitizeNutrients(nutrients) {
  if (!nutrients || typeof nutrients !== 'object') {
    return { sanitized: {}, uncertainFields: ['all_nutrients'], warnings: ['No nutrition data extracted'] };
  }
  const n = { ...nutrients };
  const uncertain = [];
  const warnings = [];

  // Rule 1: Sugar cannot exceed total carbs
  if (n.sugar !== null && n.carbs !== null && typeof n.sugar === 'number' && typeof n.carbs === 'number' && n.sugar > n.carbs) {
    warnings.push(`Sugar (${n.sugar}g) > Carbs (${n.carbs}g) — impossible. Quarantining sugar.`);
    uncertain.push('sugar'); n.sugar = null;
  }
  // Rule 2: Saturated fat cannot exceed total fat
  if (n.satFat !== null && n.fat !== null && typeof n.satFat === 'number' && typeof n.fat === 'number' && n.satFat > n.fat) {
    warnings.push(`SatFat (${n.satFat}g) > Fat (${n.fat}g) — impossible. Quarantining satFat.`);
    uncertain.push('satFat'); n.satFat = null;
  }
  // Rule 3: Physical maxima per 100g
  const MAX = { calories: 900, fat: 100, protein: 100, carbs: 100, sugar: 100, sodium: 10000, fiber: 80, satFat: 100 };
  for (const [key, max] of Object.entries(MAX)) {
    if (n[key] !== null && typeof n[key] === 'number' && n[key] > max) {
      warnings.push(`${key} (${n[key]}) exceeds maximum (${max}). Quarantining.`);
      uncertain.push(key); n[key] = null;
    }
  }
  // Rule 4: No negative values
  for (const key of Object.keys(n)) {
    if (typeof n[key] === 'number' && n[key] < 0) {
      warnings.push(`${key} is negative. Quarantining.`);
      uncertain.push(key); n[key] = null;
    }
  }
  // Rule 5: Calorie cross-check (allow 30% drift for rounding/fiber)
  if (typeof n.protein === 'number' && typeof n.fat === 'number' && typeof n.carbs === 'number' && typeof n.calories === 'number' && n.calories > 0) {
    const est = (n.protein * 4) + (n.fat * 9) + (n.carbs * 4);
    if (Math.abs(est - n.calories) / n.calories > 0.30) {
      warnings.push(`Calorie cross-check: declared ${n.calories} kcal, macros suggest ${Math.round(est)} kcal (>30% drift).`);
      uncertain.push('calories');
    }
  }
  // Rule 6: Sugar exactly equals carbs — statistically impossible for real food.
  // This almost always means Ollama copied the carbs value into sugar because no
  // explicit sugar value was on the label. Quarantine it.
  if (n.sugar !== null && n.carbs !== null && typeof n.sugar === 'number' && typeof n.carbs === 'number' && n.sugar === n.carbs && n.carbs > 0) {
    warnings.push(`Sugar (${n.sugar}g) === Carbs (${n.carbs}g) exactly — likely hallucinated. Quarantining sugar.`);
    uncertain.push('sugar'); n.sugar = null;
  }
  // Rule 7: addedSugar=0 when carbs > 0 and no sugar declared — likely Ollama defaulting to 0.
  // Cannot be proven zero without explicit label text. Quarantine to null.
  if (n.addedSugar === 0 && n.carbs !== null && typeof n.carbs === 'number' && n.carbs > 5 && n.sugar === null) {
    n.addedSugar = null;
  }
  if (warnings.length) console.log('[Validation]', warnings);
  return { sanitized: n, uncertainFields: uncertain, warnings };
}

// ═══════════════════════════════════════════════════════════════════
// STAGE 4: DETERMINISTIC ALLERGEN ENGINE
// Maps ingredient keywords to allergen categories without Ollama.
// A missed allergen must NEVER occur because Ollama forgot to mention it.
// ═══════════════════════════════════════════════════════════════════

const ALLERGEN_MAP = {
  dairy:       ['milk', 'cream', 'butter', 'cheese', 'whey', 'casein', 'caseinate', 'lactose', 'lactalbumin', 'lactoglobulin', 'ghee', 'paneer', 'curd', 'yogurt', 'yoghurt', 'milk solids', 'milk powder', 'skimmed milk', 'condensed milk'],
  egg:         ['egg', 'eggs', 'egg yolk', 'egg white', 'albumen', 'ovomucin'],
  wheat:       ['wheat', 'wheat flour', 'whole wheat', 'refined flour', 'maida', 'gluten', 'semolina', 'durum', 'spelt', 'triticale'],
  soy:         ['soy', 'soya', 'soybean', 'soy lecithin', 'soya lecithin', 'tofu', 'tempeh', 'edamame', 'miso'],
  peanut:      ['peanut', 'peanuts', 'groundnut', 'groundnuts', 'arachis oil'],
  'tree nuts': ['almond', 'cashew', 'walnut', 'pistachio', 'hazelnut', 'macadamia', 'pecan', 'brazil nut', 'pine nut', 'coconut'],
  fish:        ['fish', 'salmon', 'tuna', 'cod', 'haddock', 'sardine', 'anchovy', 'anchovies', 'fish sauce', 'fish oil'],
  shellfish:   ['shrimp', 'prawn', 'crab', 'lobster', 'oyster', 'clam', 'scallop', 'mussel', 'shellfish'],
  sesame:      ['sesame', 'sesame oil', 'tahini', 'til', 'gingelly'],
  mustard:     ['mustard', 'mustard oil', 'mustard seeds'],
  sulphites:   ['sulphite', 'sulfite', 'sulphur dioxide', 'sulfur dioxide', 'e220', 'e221', 'e222', 'e223', 'e224'],
  celery:      ['celery', 'celeriac'],
  lupin:       ['lupin', 'lupine'],
};

const EXCLUSION_TERMS = [
  'cream of tartar',
  'coconut cream',
  'non-dairy cream',
  'nondairy cream',
  'eggplant',
  'butternut',
  'butternut squash'
];

function detectAllergensDeterministically(ingredients) {
  if (!Array.isArray(ingredients)) return [];
  const detected = new Set();
  const norm = ingredients.map(i => (typeof i === 'string' ? i.toLowerCase() : ''));

  for (const [allergen, keywords] of Object.entries(ALLERGEN_MAP)) {
    for (const kw of keywords) {
      // Escape regex special chars and enforce word boundaries (\b) with optional plural 's'
      const escapedKw = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const endsWithS = kw.toLowerCase().endsWith('s');
      const regex = new RegExp(`\\b${escapedKw}${endsWithS ? '' : 's?'}\\b`, 'i');

      for (const ing of norm) {
        // Exclusions for known non-allergen compound terms
        if (kw === 'cream' && (ing.includes('cream of tartar') || ing.includes('coconut cream') || ing.includes('non-dairy cream') || ing.includes('nondairy cream'))) continue;
        if (kw === 'egg' && ing.includes('eggplant')) continue;
        if (kw === 'butter' && (ing.includes('butternut') || ing.includes('cocoa butter') || ing.includes('shea butter'))) continue;
        if (kw === 'til' && (ing.includes('lentil') || ing.includes('distilled') || ing.includes('until'))) continue;

        if (regex.test(ing)) {
          detected.add(allergen);
          break;
        }
      }
    }
  }

  return Array.from(detected);
}

// ═══════════════════════════════════════════════════════════════════
// STAGE 5: DETERMINISTIC HEALTH SCORE
// JS code calculates the score. Ollama does NOT calculate scores.
// Based on validated nutrition data + ingredient risk signals only.
// ═══════════════════════════════════════════════════════════════════

function computeHealthScore(nutrients, ingredients, productType) {
  const n = nutrients || {};
  let score = 70;

  if (n.calories !== null && typeof n.calories === 'number') {
    if      (n.calories > 600) score -= 15;
    else if (n.calories > 400) score -= 8;
    else if (n.calories < 100) score += 5;
  }
  if (n.sugar !== null && typeof n.sugar === 'number') {
    if      (n.sugar > 30) score -= 18;
    else if (n.sugar > 15) score -= 10;
    else if (n.sugar > 5)  score -= 5;
    else if (n.sugar <= 2) score += 5;
  }
  if (n.sodium !== null && typeof n.sodium === 'number') {
    if      (n.sodium > 1000) score -= 15;
    else if (n.sodium > 500)  score -= 8;
    else if (n.sodium > 200)  score -= 4;
    else if (n.sodium < 50)   score += 3;
  }
  if (n.satFat !== null && typeof n.satFat === 'number') {
    if      (n.satFat > 15) score -= 12;
    else if (n.satFat > 8)  score -= 6;
    else if (n.satFat > 3)  score -= 2;
  }
  if (n.protein !== null && typeof n.protein === 'number') {
    if      (n.protein > 20) score += 10;
    else if (n.protein > 10) score += 5;
    else if (n.protein < 2)  score -= 3;
  }
  if (n.fiber !== null && typeof n.fiber === 'number') {
    if      (n.fiber > 6) score += 8;
    else if (n.fiber > 3) score += 4;
  }
  if (Array.isArray(ingredients)) {
    const str = ingredients.join(' ').toLowerCase();
    const hazardous = ['e102','e110','e122','e123','e124','e129','e211','e212','e213','e951','e950','hydrogenated','trans fat','brominated'];
    score -= hazardous.filter(p => str.includes(p)).length * 6;
    const upf = ['maltodextrin','high fructose','corn syrup','artificial flavor','artificial colour','artificial color','modified starch'];
    score -= upf.filter(p => str.includes(p)).length * 4;
    if (ingredients.length <= 3) score += 13;
    else if (ingredients.length <= 5) score += 8;
    if (ingredients.length > 15) score -= 5;
  }
  if (productType === 'Whole Food')     score += 10;
  if (productType === 'Confectionery')  score -= 8;
  if (productType === 'Snack')          score -= 3;

  return Math.max(5, Math.min(100, Math.round(score)));
}

function scoreToVerdict(score) {
  if (score >= 70) return 'safe';
  if (score >= 40) return 'caution';
  return 'hazardous';
}

// ─── GEMINI CLIENT HELPER ─────────────────────────────────────────

async function callGemini(prompt, isJsonMode = false) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini API key is not configured');

  const model = 'gemini-3.1-flash-lite';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: isJsonMode ? 0.05 : 0.4,
      topP: 0.8,
      maxOutputTokens: 4096,
    },
  };

  if (isJsonMode) {
    requestBody.generationConfig.responseMimeType = 'application/json';
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Gemini API error');
  }

  const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textResponse) throw new Error('Empty response from Gemini');

  return parseAIResponse(textResponse);
}

// ═══════════════════════════════════════════════════════════════════
// STAGE 6: OLLAMA / GEMINI EXPLAINER
// AI explains the pre-calculated score in natural language.
// It receives facts — it cannot override any numerical value.
// ═══════════════════════════════════════════════════════════════════

async function generateOllamaExplanation(OLLAMA_URL, OLLAMA_MODEL, ctx) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  const { productName, score, verdict, nutrients, ingredients, allergens, productType } = ctx;
  const nutrientSummary = Object.entries(nutrients || {})
    .filter(([, v]) => v !== null && typeof v === 'number')
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');

  const prompt = `You are Aavis, a brutally honest Indian nutrition expert AI.
A food product called "${productName || 'this product'}" (${productType || 'food'}) has been analysed.

The deterministic engine calculated these FACTS. DO NOT change them:
Health Score: ${score}/100  |  Verdict: ${verdict}
Nutrients (per 100g): ${nutrientSummary || 'not available'}
Ingredients: ${(ingredients || []).slice(0, 10).join(', ') || 'not available'}
Allergens detected: ${(allergens || []).join(', ') || 'none'}

Your job: explain these results in human language. Return ONLY this JSON:
{
  "dietAdvice": "2-line brutally honest verdict explaining WHY the score is ${score}/100",
  "aiSummary": "One funny roast line with Indian cultural context",
  "mainConcerns": ["2-3 specific health concerns based ONLY on the facts above"],
  "majorBenefits": ["1-3 genuine benefits if any, or return ['None identified']"],
  "overallAssessment": "One plain-English sentence summarising this product"
}
Return ONLY valid JSON. No markdown. No backticks. No extra text.`;

  if (apiKey) {
    console.log('[Pipeline] Explaining with Google Gemini API...');
    return callGemini(prompt, true);
  }

  console.log('[Pipeline] Explaining with local Ollama...');
  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      format: 'json',
      options: { temperature: 0.4, num_ctx: 4096 }
    }),
  });
  if (!response.ok) throw new Error('Ollama explainer error: ' + response.statusText);
  const data = await response.json();
  const txt = data.message?.content;
  if (!txt) throw new Error('Empty explainer response from Ollama');
  return parseAIResponse(txt);
}

// ─── OLLAMA / GEMINI EXTRACTION ───────────────────────────────────

async function extractWithOllama(OLLAMA_URL, OLLAMA_MODEL, normalizedText) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  const prompt = `${EXTRACTION_PROMPT}\n\nFOOD LABEL TEXT:\n---\n${normalizedText}\n---`;

  if (apiKey) {
    console.log('[Pipeline] Extracting with Google Gemini API...');
    return callGemini(prompt, true);
  }

  console.log('[Pipeline] Extracting with local Ollama...');
  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      format: 'json',
      options: { temperature: 0.05, num_ctx: 8192 }
    }),
  });
  if (!response.ok) throw new Error('Ollama extraction error: ' + response.statusText);
  const data = await response.json();
  const txt = data.message?.content;
  if (!txt) throw new Error('Empty extraction response from Ollama');
  return parseAIResponse(txt);
}

// ─── JSON PARSER HELPER ────────────────────────────────────────────

function parseAIResponse(textResponse) {
  let cleaned = textResponse.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  try { return JSON.parse(cleaned); } catch (e) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Failed to parse JSON from AI response');
  }
}

// ─── OCR ROUTE (multimodal) ───────────────────────────────────────

app.post('/api/ocr', async (req, res) => {
  const { image, mode = 'ingredients' } = req.body;
  if (!image) return res.status(400).json({ error: 'No image provided' });

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (apiKey) {
    try {
      console.log(`[Server] Processing OCR request via Gemini API, mode: ${mode}`);
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
- Preserve commas, brackets, and natural punctuation exactly
- DO NOT rephrase, summarize, or reorder any ingredients
- If you see multiple languages, extract the English version only

Output the raw ingredients text exactly as it appears on the label.`;
      } else {
        prompt = `You are a high-accuracy food label OCR engine with expert vision. Read ALL text from this food packaging image.

EXTRACT EVERYTHING:
1. Product name and brand
2. Complete ingredients list (with all E-codes, percentages, sub-ingredients in brackets)
3. Complete nutrition facts table (every nutrient name + value + unit + %DV)
4. Allergen warnings (CONTAINS, MAY CONTAIN)
5. Net weight / volume
6. Any health claims visible

RULES:
- Extract text verbatim — do not paraphrase or summarize
- Preserve all numbers, percentages, units, and codes exactly
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
      console.error('[Server] Gemini OCR failed:', error.message);
      return res.status(500).json({ error: error.message });
    }
  }

  // Fallback to Ollama Vision
  const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
  try {
    console.log(`[Server] Falling back to Ollama Vision for OCR, mode: ${mode}`);
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
    console.error('[Server] Ollama OCR fallback failed:', error.message);
    return res.status(500).json({ error: 'All OCR backends failed. Please make sure Gemini API key is configured or local Ollama is running.' });
  }
});

// ═══════════════════════════════════════════════════════════════════
// MAIN HYBRID ANALYZE ROUTE
// IMAGE → normalizeOCR → Ollama extract → validate → allergens
//       → computeScore → Ollama explain → final result
// ═══════════════════════════════════════════════════════════════════

app.post('/api/analyze', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'No text provided for analysis' });

  const OLLAMA_URL   = process.env.OLLAMA_URL   || 'http://localhost:11434';
  const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:1b';

  // ── Per-stage timestamps ─────────────────────────────────────────
  const ts = {};
  ts.start = Date.now();

  console.log(`\n[Pipeline] ──────────────────────────────────────────`);
  console.log(`[Pipeline] Model: ${OLLAMA_MODEL} | Input: ${text.length} chars`);

  try {
    // ── Stage 1: OCR Normalization ──────────────────────────────────
    ts.normalizeStart = Date.now();
    const normalizedText = normalizeOcrText(text);
    ts.normalizeEnd = Date.now();
    console.log(`[Pipeline] Stage1 normalize:   ${ts.normalizeEnd - ts.normalizeStart}ms`);

    // ── Stage 2: Ollama Extraction ──────────────────────────────────
    ts.extractStart = Date.now();
    const extracted = await extractWithOllama(OLLAMA_URL, OLLAMA_MODEL, normalizedText);
    ts.extractEnd = Date.now();
    console.log(`[Pipeline] Stage2 extraction:  ${ts.extractEnd - ts.extractStart}ms`);

    // ── Stage 2b: JSON Parsing (already inside extractWithOllama, measure separately) ──
    // parseAIResponse is called inside extractWithOllama; we record its cost as
    // (extractEnd - extractStart) minus the actual Ollama inference time.
    // Since we can't easily separate them here, we measure total extraction.
    ts.jsonParseMs = 0; // Embedded in extraction; no separate timing possible without refactor.

    // ── Stage 3: Nutrition Validation ──────────────────────────────
    ts.validationStart = Date.now();
    const { sanitized: nutrients, uncertainFields, warnings: valWarnings } = validateAndSanitizeNutrients(extracted.nutrients);
    ts.validationEnd = Date.now();
    console.log(`[Pipeline] Stage3 validation:  ${ts.validationEnd - ts.validationStart}ms`);

    // ── Stage 4: Allergen Detection ──────────────────────────────────
    ts.allergenStart = Date.now();
    const allergenSources = [
      ...(Array.isArray(extracted.ingredients) ? extracted.ingredients : []),
      normalizedText
    ];
    const detAllergens = detectAllergensDeterministically(allergenSources);
    const aiAllergens  = Array.isArray(extracted.allergens) ? extracted.allergens.map(a => String(a).toLowerCase()) : [];
    const allergens    = Array.from(new Set([...detAllergens, ...aiAllergens]));
    ts.allergenEnd = Date.now();
    console.log(`[Pipeline] Stage4 allergens:   ${ts.allergenEnd - ts.allergenStart}ms -> [${allergens.join(', ')}]`);

    // ── Stage 5: Health Score ──────────────────────────────────────
    ts.scoreStart = Date.now();
    const score   = computeHealthScore(nutrients, extracted.ingredients, extracted.productType);
    const verdict = scoreToVerdict(score);
    ts.scoreEnd = Date.now();
    console.log(`[Pipeline] Stage5 score:       ${ts.scoreEnd - ts.scoreStart}ms  → ${score}/100 (${verdict})`);

    // ── Stage 6: Ollama Explanation ────────────────────────────────
    ts.explainStart = Date.now();
    let explanation = {};
    let explainFailed = false;
    try {
      explanation = await generateOllamaExplanation(OLLAMA_URL, OLLAMA_MODEL, {
        productName: extracted.productName, score, verdict,
        nutrients, ingredients: extracted.ingredients, allergens,
        productType: extracted.productType,
      });
    } catch (expErr) {
      explainFailed = true;
      console.warn(`[Pipeline] Stage6 explainer FAILED: ${expErr.message}`);
      explanation = {
        dietAdvice: `Health score: ${score}/100. Check the nutrition details below.`,
        aiSummary: '',
        mainConcerns: [],
        majorBenefits: [],
        overallAssessment: `This product scored ${score}/100.`,
      };
    }
    ts.explainEnd = Date.now();
    console.log(`[Pipeline] Stage6 explanation: ${ts.explainEnd - ts.explainStart}ms${explainFailed ? ' (FAILED – fallback used)' : ''}`);

    // ── Timing Summary ─────────────────────────────────────────────
    const timings = {
      normalize_ms:   ts.normalizeEnd  - ts.normalizeStart,
      extraction_ms:  ts.extractEnd    - ts.extractStart,
      jsonParse_ms:   ts.jsonParseMs,
      validation_ms:  ts.validationEnd - ts.validationStart,
      allergen_ms:    ts.allergenEnd   - ts.allergenStart,
      score_ms:       ts.scoreEnd      - ts.scoreStart,
      explanation_ms: ts.explainEnd    - ts.explainStart,
      total_ms:       Date.now()       - ts.start,
      model:          OLLAMA_MODEL,
      explainFailed,
    };

    console.log(`[Pipeline] ── TOTAL: ${timings.total_ms}ms ────────────────────`);
    console.log(`[Pipeline]   normalize=${timings.normalize_ms}ms | extract=${timings.extraction_ms}ms | valid=${timings.validation_ms}ms | allergen=${timings.allergen_ms}ms | score=${timings.score_ms}ms | explain=${timings.explanation_ms}ms`);
    console.log(`[Pipeline] ──────────────────────────────────────────────────`);

    const ingrLen = Array.isArray(extracted.ingredients) ? extracted.ingredients.length : 0;
    const addLen  = Array.isArray(extracted.additives)   ? extracted.additives.length   : 0;

    // ── Final result — backwards-compatible with ResultScreen.tsx / Result.tsx
    const result = {
      productName:      extracted.productName || 'Scanned Product',
      brand:            extracted.brand        || 'Unknown Brand',
      productType:      extracted.productType  || 'General Food',
      servingSize:      extracted.servingSize  || null,
      nutritionUnit:    extracted.nutritionUnit|| null,
      ingredients:      Array.isArray(extracted.ingredients) && ingrLen > 0 ? extracted.ingredients : [],
      nutrients,
      additives:        Array.isArray(extracted.additives) ? extracted.additives : [],
      additiveDetails:  extracted.additiveDetails  || {},
      ingredientDetails:extracted.ingredientDetails|| {},
      allergens,
      finalScore:       score,
      overallAssessment:explanation.overallAssessment || '',
      dietAdvice:       explanation.dietAdvice        || `Health score: ${score}/100`,
      aiSummary:        explanation.aiSummary         || '',
      mainConcerns:     Array.isArray(explanation.mainConcerns)   ? explanation.mainConcerns   : [],
      majorBenefits:    Array.isArray(explanation.majorBenefits)  ? explanation.majorBenefits  : [],
      dimensions: {
        ingredientSafety:       { score: Math.max(0, Math.min(100, score + (ingrLen <= 5 ? 10 : -5))),            justification: `${ingrLen} ingredients, ${addLen} additives detected.` },
        nutritionalQuality:     { score: nutrients.protein !== null ? Math.min(100, Math.round((nutrients.protein||0)*4)) : 50, justification: 'Based on protein and fiber content.' },
        processingLevel:        { score: addLen > 5 ? 25 : addLen > 2 ? 50 : 75,                                  justification: `${addLen} additives detected.` },
        nutrientDensity:        { score: Math.min(100, ((nutrients.protein||0)*3) + ((nutrients.fiber||0)*5)),    justification: 'Based on protein and fiber density.' },
        energyDensity:          { score: nutrients.calories !== null ? Math.max(0, 100 - Math.round((nutrients.calories||0)/10)) : 50, justification: `${nutrients.calories !== null ? nutrients.calories + ' kcal/100g' : 'Calories not available'}.` },
        wholeFoodContent:       { score: ingrLen <= 4 ? 85 : ingrLen <= 8 ? 65 : 35,                              justification: `${ingrLen} total ingredients listed.` },
        functionalHealthImpact: { score, justification: explanation.overallAssessment || 'Based on overall nutritional profile.' },
      },
      _pipeline:           'hybrid-v2',
      _uncertainFields:    uncertainFields,
      _validationWarnings: valWarnings,
      _processingMs:       timings.total_ms,
      _timings:            timings,
    };

    return res.json(result);

  } catch (error) {
    const totalMs = Date.now() - ts.start;
    console.error(`[Pipeline] FATAL ERROR after ${totalMs}ms:`, error.message);
    return res.status(500).json({ error: error.message || 'Analysis failed' });
  }
});

// ─── CHAT ROUTE ───────────────────────────────────────────────────


app.post('/api/chat', async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message) return res.status(400).json({ error: 'No message provided' });

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (apiKey) {
    try {
      console.log('[Server] Routing chat message to Google Gemini API...');
      const geminiContents = history.map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));
      geminiContents.push({ role: 'user', parts: [{ text: message }] });

      const requestBody = {
        systemInstruction: {
          parts: [{ text: 'You are Aavis, a helpful and slightly humorous AI nutrition assistant for an Indian health app. Only answer questions about food, nutrition, and diet. Politely redirect off-topic questions.' }]
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
      console.error('[Server] Gemini Chat error:', error.message);
      return res.status(500).json({ error: error.message });
    }
  }

  const OLLAMA_URL   = process.env.OLLAMA_URL   || 'http://localhost:11434';
  const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:1b';

  try {
    const messages = [{ role: 'system', content: 'You are Aavis, a helpful and slightly humorous AI nutrition assistant for an Indian health app. Only answer questions about food, nutrition, and diet. Politely redirect off-topic questions.' }];
    for (const msg of history) messages.push({ role: msg.role === 'assistant' ? 'assistant' : 'user', content: msg.content });
    messages.push({ role: 'user', content: message });

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: OLLAMA_MODEL, messages, stream: false, options: { temperature: 0.7, num_ctx: 4096 } }),
    });
    if (!response.ok) throw new Error('Ollama server error: ' + response.statusText);
    const data = await response.json();
    return res.json({ reply: data.message?.content || '' });
  } catch (error) {
    console.error('[Server] Chat error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// ─── ERROR HANDLING MIDDLEWARE ────────────────────────────────────
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('[INVALID JSON]', err.message);
    return res.status(400).json({ success: false, error: 'Invalid request format' });
  }
  next(err);
});

// ─── START SERVER ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  🟢 Aavis Backend API running on port ${PORT}`);
  console.log(`  📡 Health: http://localhost:${PORT}/api/health`);
  console.log(`  🤖 Ollama: ${process.env.OLLAMA_URL || 'http://localhost:11434'} (${process.env.OLLAMA_MODEL || 'llama3.2:1b'})`);
  console.log(`  🔬 Pipeline: Hybrid v2 — Deterministic Score + Ollama Explainer\n`);
});
