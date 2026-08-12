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
  avatar_url: string | null;
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

  diet_advice: string | null;
  raw_ocr_text: string | null;
  ai_summary: string | null;
  image_url: string | null;
  created_at: string;
  analysis_results?: any;
  gemini_analysis?: any;
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
 */
export async function getOrCreateUser(_email: string, _name?: string): Promise<DBUser | null> {
  if (!isSupabaseConfigured()) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: existing, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!existing) {
    // Row missing, create it
    const { data: newUser } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: _email || user.email,
        name: _name || user.user_metadata?.name || 'User'
      })
      .select()
      .single();
    
    return newUser as DBUser | null;
  }

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
    diet_type?: string;
    allergens?: string[];
    health_conditions?: string[];
    language?: string;
    avatar_url?: string | null;
  }
): Promise<DBUser | null> {
  if (!isSupabaseConfigured()) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .upsert({ 
      id: userId, 
      email: user.email!, 
      ...profile 
    }, { onConflict: 'id' })
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
 * Health score calculation.
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
 * Helper to convert a base64 data URL to a Blob
 */
function dataURLtoBlob(dataurl: string): Blob {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Upload a base64 image to Supabase Storage
 */
export async function uploadScanImage(base64Image: string, scanId: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const blob = dataURLtoBlob(base64Image);
    const fileName = `${scanId}_${Date.now()}.jpg`;
    
    const { data, error } = await supabase.storage
      .from('scan-images')
      .upload(fileName, blob, {
        contentType: blob.type,
        upsert: true
      });

    if (error) {
      console.error('[Aavis] Failed to upload scan image to storage:', error);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('scan-images')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('[Aavis] Error during uploadScanImage:', error);
    return null;
  }
}

/**
 * Update the score and breakdown of an existing scan without re-uploading
 */
export async function updateScanScore(
  scanId: string,
  updates: {
    health_score: number;
    verdict: string;
    nutrients: any;
    diet_advice: string;
  }
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  
  const { error } = await supabase
    .from('scans')
    .update({
      health_score: updates.health_score,
      verdict: updates.verdict,
      nutrients: updates.nutrients,
      diet_advice: updates.diet_advice
    })
    .eq('id', scanId);

  if (error) {
    console.error('[Aavis] Failed to update scan score:', error);
    return false;
  }
  return true;
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
    diet_advice?: string;
    raw_ocr_text?: string;
    ai_summary?: string;
    image_url?: string;
    thumbnail_url?: string;
  }
): Promise<DBScan | null> {
  if (!isSupabaseConfigured()) return null;

  // 1. Save the scan
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
      diet_advice: scanData.diet_advice,
      ai_summary: scanData.ai_summary,
      image_url: scanData.image_url,
      thumbnail_url: scanData.thumbnail_url,
    })
    .select()
    .single();

  if (error) {
    console.error('[Aavis] Failed to save scan:', error);
    return null;
  }

  // 2. Update streak
  await updateStreak(userId);

  // 3. Cache product
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
      newStreak = user.streak;
    } else if (diffDays === 1) {
      newStreak = user.streak + 1;
    }
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
const inflightScans = new Map<string, Promise<DBScan[]>>();

export async function getUserScans(userId: string, limit = 50): Promise<DBScan[]> {
  if (!isSupabaseConfigured()) return [];
  
  const cacheKey = `${userId}-${limit}`;
  if (inflightScans.has(cacheKey)) {
    return inflightScans.get(cacheKey)!;
  }

  const promise = supabase
    .from('scans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
    .then(({ data, error }) => {
      inflightScans.delete(cacheKey);
      if (error) return [];
      return (data || []) as DBScan[];
    });

  inflightScans.set(cacheKey, promise);
  return promise;
}

/**
 * Get scan history for a user within a specific date range.
 */
export async function getUserScansByDateRange(userId: string, startDate: Date, endDate: Date): Promise<DBScan[]> {
  if (!isSupabaseConfigured()) return [];

  const endOfDay = new Date(endDate);
  endOfDay.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from('scans')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate.toISOString())
    .lte('date', endOfDay.toISOString())
    .order('date', { ascending: false });

  if (error) {
    console.error('[Aavis] Failed to fetch historical scans:', error);
    return [];
  }
  return (data || []) as DBScan[];
}

/**
 * Delete a specific scan for a user.
 */
export async function deleteUserScan(scanId: string, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase
    .from('scans')
    .delete()
    .eq('id', scanId)
    .eq('user_id', userId);

  if (error) {
    console.error('[Aavis] Failed to delete scan:', error);
    return false;
  }
  return true;
}

/**
 * Delete all scans for a user.
 */
export async function deleteAllUserScans(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase
    .from('scans')
    .delete()
    .eq('user_id', userId);

  if (error) {
    console.error('[Aavis] Failed to clear all scans:', error);
    return false;
  }
  return true;
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
// DIET ADVICE (Local AI)
// ═══════════════════════════════════════════════════════════════

/**
 * Get personalized diet advice from Local AI (Ollama).
 */
export async function getDietAdvice(
  dietType: string,
  healthConditions: string[],
  ingredients: string[],
  productName: string
): Promise<string> {
  const conditionsStr = healthConditions.length > 0 ? healthConditions.join(', ') : 'none';
  const ingredientsStr = ingredients.slice(0, 15).join(', ');

  const prompt = `User is ${dietType} and has health conditions: ${conditionsStr}. This product "${productName}" contains: ${ingredientsStr}. In exactly 2 sentences, tell them if they should eat this or not. Be direct and friendly.`;

  const ollamaBody = JSON.stringify({
    model: 'llama3.2',
    messages: [{ role: 'user', content: prompt }],
    stream: false,
    options: { temperature: 0.3, num_ctx: 1024 }
  });

  try {
    let response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: ollamaBody
    }).catch(() => fetch('http://10.0.2.2:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: ollamaBody
    }));

    if (!response.ok) throw new Error('Ollama error');

    const data = await response.json();
    return data.message?.content?.trim() || 'Could not generate diet advice.';
  } catch (error) {
    console.error('[Aavis] Diet advice error:', error);
    return 'Could not generate diet advice. Try again later.';
  }
}

// ═══════════════════════════════════════════════════════════════
// SAVED MYTHS
// ═══════════════════════════════════════════════════════════════

export async function saveMythToCloud(
  userId: string,
  mythData: Omit<import('./types').SavedMyth, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<import('./types').SavedMyth | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const payload = {
      user_id: userId,
      question: mythData.question,
      correct_answer: mythData.correct_answer,
      user_answer: mythData.user_answer,
      is_correct: mythData.is_correct,
      explanation: mythData.explanation,
      sources: mythData.sources,
      category: mythData.category
    };
    const { data, error } = await supabase
      .from('saved_myths')
      .insert(payload)
      .select()
      .single();

    if (error) {
      if (error.code !== '23505') {
        console.error('[SupabaseService] Error saving myth to DB:', error);
      }
      return null;
    }
    
    return data as import('./types').SavedMyth;
  } catch (e) {
    console.error('[SupabaseService] Error in saveMythToCloud:', e);
    return null;
  }
}

const inflightMyths = new Map<string, Promise<import('./types').SavedMyth[]>>();

export async function getSavedMyths(userId: string): Promise<import('./types').SavedMyth[]> {
  if (!isSupabaseConfigured()) return [];

  if (inflightMyths.has(userId)) {
    return inflightMyths.get(userId)!;
  }

  const promise = supabase
    .from('saved_myths')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .then(({ data, error }) => {
      inflightMyths.delete(userId);
      if (error) {
        console.error('[Supabase] Error fetching saved myths:', error);
        return [];
      }
      return data as import('./types').SavedMyth[];
    });

  inflightMyths.set(userId, promise);
  return promise;
}

export async function deleteSavedMyth(mythId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase
    .from('saved_myths')
    .delete()
    .eq('id', mythId);

  if (error) {
    console.error('[Supabase] Error deleting saved myth:', error);
    return false;
  }

  return true;
}
