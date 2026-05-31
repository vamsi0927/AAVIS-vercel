/**
 * Supabase Service Layer
 * All database operations for Aavis.
 * Falls back gracefully when Supabase is not configured.
 */

import { supabase, isSupabaseConfigured } from './supabase';
import { Product } from './types';

// ─── Type Definitions ──────────────────────────────────────────

export interface DBUser {
  id: string;
  email: string;
  name: string;
  age: number | null;
  gender: string;
  height: number | null;
  weight: number | null;
  activity_level: string;
  diet_type: string;
  health_conditions: string[];
  allergens: string[];
  language: string;
  streak: number;
  last_scan_date: string | null;
  created_at: string;
}

export interface DBScan {
  id: string;
  user_id: string;
  product_name: string;
  brand: string;
  barcode: string | null;
  ingredients: string[];
  nutrients: any;
  additives: string[];
  allergens_detected: string[];
  health_score: number;
  verdict: string;
  meme_shown: string | null;
  diet_advice: string | null;
  raw_ocr_text: string | null;
  gemini_analysis: any;
  ai_summary: string | null;
  image_url: string | null;
  created_at: string;
}

export interface DashboardData {
  user: DBUser | null;
  recentScans: DBScan[];
  weeklyGrade: string;
  weeklyAvgScore: number;
  hazardousCount: number;
  totalScansThisWeek: number;
  chartData: { day: string; score: number; count: number }[];
}

// ═══════════════════════════════════════════════════════════════
// USER OPERATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get user profile from the DB using the current Supabase auth session.
 * User row creation is handled automatically by the on_auth_user_created trigger.
 */
export async function getOrCreateUser(_email: string, _name?: string): Promise<DBUser | null> {
  if (!isSupabaseConfigured()) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return existing as DBUser | null;
}

/**
 * Update user profile fields.
 */
export async function updateUserProfile(
  userId: string,
  profile: {
    name?: string;
    age?: number | null;
    gender?: string;
    height?: number | null;
    weight?: number | null;
    activity_level?: string;
    dietary_preferences?: string[];
    allergies?: string[];
    health_conditions?: string[];
    language?: string;
  }
): Promise<DBUser | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('profiles')
    .update(profile)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('[Aavis] Failed to update profile:', error);
    return null;
  }

  return data as DBUser;
}

/**
 * Get user by ID.
 */
export async function getUserById(userId: string): Promise<DBUser | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) return null;
  return data as DBUser;
}

// ═══════════════════════════════════════════════════════════════
// SCAN OPERATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Health score calculation (same logic as requested).
 * Runs client-side for instant feedback.
 */
export function calculateHealthScore(nutrients: any, additives: string[]): number {
  let score = 100;

  // Nutrient penalties
  if (nutrients.trans_fat > 0 || nutrients.transFat > 0) score -= 15;
  if ((nutrients.sugar || 0) > 22.5) score -= 10;
  if ((nutrients.sodium || 0) > 600) score -= 10;
  if ((nutrients.sat_fat || nutrients.satFat || 0) > 5) score -= 8;
  if ((nutrients.calories || 0) > 450) score -= 8;

  // Harmful additive penalties
  const harmfulAdditives = ['E319', 'E621', 'E211', 'E102', 'E110', 'E122', 'E124', 'E129', 'E133', 'E951', 'E954'];
  const harmfulCount = additives.filter(a => harmfulAdditives.includes(a.toUpperCase())).length;
  score -= harmfulCount * 10;

  // Bonuses
  if ((nutrients.fiber || 0) > 5) score += 5;
  if ((nutrients.protein || 0) > 10) score += 5;

  return Math.max(0, Math.min(100, score));
}

/**
 * Determine verdict from score.
 */
export function getVerdict(score: number): 'safe' | 'caution' | 'hazardous' {
  if (score >= 75) return 'safe';
  if (score >= 40) return 'caution';
  return 'hazardous';
}

/**
 * Determine meme condition based on priority order.
 */
export function getMemeCondition(
  nutrients: any,
  additives: string[],
  score: number,
  ingredients: string[]
): string {
  const hasTransFat = (nutrients.trans_fat > 0 || nutrients.transFat > 0) ||
    ingredients.some(i => i.toLowerCase().includes('hydrogenated') || i.toLowerCase().includes('trans fat'));
  
  const artificialColors = ['E102', 'E110', 'E122', 'E124', 'E129', 'E133'];
  const hasArtificialColors = additives.some(a => artificialColors.includes(a.toUpperCase()));

  if (hasTransFat) return 'trans_fat';
  if (additives.length >= 3) return 'additives_3plus';
  if (hasArtificialColors) return 'artificial_colors';
  if ((nutrients.sugar || 0) > 22.5) return 'high_sugar';
  if ((nutrients.sodium || 0) > 600) return 'high_sodium';
  if ((nutrients.calories || 0) > 450) return 'high_calories';
  if (score < 40) return 'hazardous_overall';
  return 'safe';
}

/**
 * Fetch a random meme from the database for a given condition.
 */
export async function fetchMemeFromDB(condition: string, language = 'en'): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('memes')
      .select('id, text')
      .eq('condition', condition)
      .eq('language', language);

    if (error || !data || data.length === 0) return null;

    // Pick a random meme
    const randomIdx = Math.floor(Math.random() * data.length);
    const meme = data[randomIdx];

    return meme.text;
  } catch (err) {
    console.error('Error fetching meme from database:', err);
    return null;
  }
}

/**
 * Save a scan to the database and update user streak.
 */
export async function saveScan(
  userId: string,
  scanData: {
    product_name: string;
    brand: string;
    barcode?: string;
    ingredients: string[];
    nutrients: any;
    additives: string[];
    allergens_detected: string[];
    health_score: number;
    verdict: string;
    meme_shown?: string;
    diet_advice?: string;
    raw_ocr_text?: string;
    gemini_analysis?: any;
    ai_summary?: string;
    image_url?: string;
    thumbnail_url?: string;
  }
): Promise<DBScan | null> {
  if (!isSupabaseConfigured()) return null;

  // 1. Save the scan (excluding massive AI response data to save space)
  const { data: scan, error } = await supabase
    .from('scans')
    .insert({
      user_id: userId,
      product_name: scanData.product_name,
      brand: scanData.brand,
      barcode: scanData.barcode,
      ingredients: scanData.ingredients,
      nutrients: scanData.nutrients,
      additives: scanData.additives,
      allergens_detected: scanData.allergens_detected,
      health_score: scanData.health_score,
      verdict: scanData.verdict,
      meme_shown: scanData.meme_shown,
      diet_advice: scanData.diet_advice,
      ai_summary: scanData.ai_summary,
      image_url: scanData.image_url,
      thumbnail_url: scanData.thumbnail_url,
      // Intentionally omitting gemini_analysis and raw_ocr_text
    })
    .select()
    .single();

  if (error) {
    console.error('[Aavis] Failed to save scan:', error);
    return null;
  }

  // 2. Update streak
  await updateStreak(userId);

  // 3. Cache product (upsert by name since no barcode for camera scans)
  await cacheProduct(scanData);

  return scan as DBScan;
}

/**
 * Update user scan streak.
 */
async function updateStreak(userId: string): Promise<void> {
  const { data: user } = await supabase
    .from('profiles')
    .select('streak, last_scan_date')
    .eq('id', userId)
    .single();

  if (!user) return;

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const lastScan = user.last_scan_date;

  let newStreak = 1;

  if (lastScan) {
    const lastDate = new Date(lastScan);
    const todayDate = new Date(today);
    const diffMs = todayDate.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Same day — streak stays
      newStreak = user.streak;
    } else if (diffDays === 1) {
      // Consecutive day — increment
      newStreak = user.streak + 1;
    }
    // else: gap > 1 day — reset to 1
  }

  await supabase
    .from('profiles')
    .update({ streak: newStreak, last_scan_date: today })
    .eq('id', userId);
}

/**
 * Cache a product in the products table (upsert).
 */
async function cacheProduct(productData: {
  product_name: string;
  brand: string;
  barcode?: string;
  ingredients: string[];
  nutrients: any;
  additives: string[];
  allergens_detected?: string[];
  health_score: number;
  verdict: string;
}): Promise<void> {
  // Only cache if we have a barcode (unique key)
  if (!productData.barcode) return;

  await supabase
    .from('products')
    .upsert({
      barcode: productData.barcode,
      name: productData.product_name,
      brand: productData.brand,
      ingredients: productData.ingredients,
      nutrients: productData.nutrients,
      additives: productData.additives,
      allergens: productData.allergens_detected || [],
      health_score: productData.health_score,
      verdict: productData.verdict,
      updated_at: new Date().toISOString()
    }, { onConflict: 'barcode' });
}

/**
 * Get scan history for a user.
 */
export async function getUserScans(userId: string, limit = 50): Promise<DBScan[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('scans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data || []) as DBScan[];
}

// ═══════════════════════════════════════════════════════════════
// SEARCH OPERATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Search with 24-hour cache.
 */
export async function searchWithCache(
  userId: string,
  query: string
): Promise<{ response: string; cached: boolean } | null> {
  if (!isSupabaseConfigured()) return null;

  // Check cache (same query in last 24 hours)
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const { data: cached } = await supabase
    .from('search_history')
    .select('ai_response')
    .eq('query', query.toLowerCase().trim())
    .gte('searched_at', twentyFourHoursAgo)
    .order('searched_at', { ascending: false })
    .limit(1)
    .single();

  if (cached?.ai_response) {
    return { response: cached.ai_response, cached: true };
  }

  return null; // No cache — caller should do AI search then call saveSearchResult
}

/**
 * Save a search result to history.
 */
export async function saveSearchResult(
  userId: string,
  query: string,
  aiResponse: string
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  await supabase
    .from('search_history')
    .insert({
      user_id: userId,
      query: query.toLowerCase().trim(),
      ai_response: aiResponse
    });
}

/**
 * Get recent search history for a user.
 */
export async function getSearchHistory(userId: string, limit = 10): Promise<{ query: string; ai_response: string; searched_at: string }[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('search_history')
    .select('query, ai_response, searched_at')
    .eq('user_id', userId)
    .order('searched_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return data || [];
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD OPERATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get full dashboard data for a user.
 */
export async function getDashboardData(userId: string): Promise<DashboardData | null> {
  if (!isSupabaseConfigured()) return null;

  // 1. Get user
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  // 2. Get last 7 days scans
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: weekScans } = await supabase
    .from('scans')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', sevenDaysAgo)
    .order('created_at', { ascending: false });

  const scans = (weekScans || []) as DBScan[];

  // 3. Calculate weekly stats
  const scores = scans.map(s => s.health_score).filter(s => s != null);
  const weeklyAvgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  
  let weeklyGrade = 'F';
  if (weeklyAvgScore >= 75) weeklyGrade = 'A';
  else if (weeklyAvgScore >= 60) weeklyGrade = 'B';
  else if (weeklyAvgScore >= 40) weeklyGrade = 'C';
  else if (weeklyAvgScore >= 20) weeklyGrade = 'D';

  const hazardousCount = scans.filter(s => s.verdict === 'hazardous').length;

  // 4. Build chart data (group by day)
  const chartMap: Record<string, { totalScore: number; count: number }> = {};
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  scans.forEach(scan => {
    const day = dayNames[new Date(scan.created_at).getDay()];
    if (!chartMap[day]) chartMap[day] = { totalScore: 0, count: 0 };
    chartMap[day].totalScore += scan.health_score || 0;
    chartMap[day].count += 1;
  });

  const chartData = dayNames.map(day => ({
    day,
    score: chartMap[day] ? Math.round(chartMap[day].totalScore / chartMap[day].count) : 0,
    count: chartMap[day]?.count || 0
  }));

  return {
    user: user as DBUser,
    recentScans: scans,
    weeklyGrade,
    weeklyAvgScore,
    hazardousCount,
    totalScansThisWeek: scans.length,
    chartData
  };
}

// ═══════════════════════════════════════════════════════════════
// BOOKMARK OPERATIONS
// ═══════════════════════════════════════════════════════════════

export async function toggleBookmarkDB(
  userId: string,
  scanId: string,
  action: 'add' | 'remove'
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase
    .from('scans')
    .update({ is_bookmarked: action === 'add' })
    .eq('user_id', userId)
    .eq('id', scanId);
  return !error;
}

export async function getUserBookmarks(userId: string): Promise<any[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('scans')
    .select('*')
    .eq('user_id', userId)
    .eq('is_bookmarked', true)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data || [];
}

// ═══════════════════════════════════════════════════════════════
// REPORT OPERATIONS
// ═══════════════════════════════════════════════════════════════

export async function submitReport(
  userId: string,
  productId: string | null,
  reason: string,
  details: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase
    .from('reports')
    .insert({
      user_id: userId,
      product_id: productId,
      reason,
      details
    });

  return !error;
}

// ═══════════════════════════════════════════════════════════════
// DIET ADVICE (Gemini)
// ═══════════════════════════════════════════════════════════════

/**
 * Get personalized diet advice from Gemini.
 * This runs client-side using the existing VITE_GEMINI_API_KEY.
 */
export async function getDietAdvice(
  dietType: string,
  healthConditions: string[],
  ingredients: string[],
  productName: string
): Promise<string> {
  const { getGeminiApiKey } = await import('./apiConfig');
  const apiKey = getGeminiApiKey();
  if (!apiKey) return 'Set up your diet preferences in Profile for personalized advice.';

  const conditionsStr = healthConditions.length > 0 ? healthConditions.join(', ') : 'none';
  const ingredientsStr = ingredients.slice(0, 15).join(', '); // Limit to 15 to save tokens

  const prompt = `User is ${dietType} and has health conditions: ${conditionsStr}. This product "${productName}" contains: ${ingredientsStr}. In exactly 2 sentences, tell them if they should eat this or not. Be direct and friendly.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 256 }
        })
      }
    );

    if (!response.ok) throw new Error('API_ERROR');

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'Could not generate diet advice.';
  } catch (error) {
    console.error('[Aavis] Diet advice error:', error);
    return 'Could not generate diet advice. Try again later.';
  }
}
