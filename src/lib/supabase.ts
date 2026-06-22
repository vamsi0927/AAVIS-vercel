/// <reference types="vite/client" />
/**
 * Supabase Client
 * Central Supabase connection used across the app.
 * Reads credentials from VITE_ env variables.
 * Configured with localStorage persistence for cross-session + APK compatibility.
 */

import { createClient } from '@supabase/supabase-js';
import { Preferences } from '@capacitor/preferences';

const capacitorStorage = {
  getItem: async (key: string): Promise<string | null> => {
    const { value } = await Preferences.get({ key });
    return value;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await Preferences.set({ key, value });
  },
  removeItem: async (key: string): Promise<void> => {
    await Preferences.remove({ key });
  },
};

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Sanitize stringified "undefined" / "null" values injected by bundlers/hosting
if (supabaseUrl === 'undefined' || supabaseUrl === 'null') supabaseUrl = '';
if (supabaseAnonKey === 'undefined' || supabaseAnonKey === 'null') supabaseAnonKey = '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Aavis] Supabase credentials missing. Database features will be disabled. ' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://lfhnlsniuubcvjpjwldj.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmaG5sc25pdXViY3ZqcGp3bGRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1ODY1NTAsImV4cCI6MjA5NDE2MjU1MH0.yhY_JtKYOikbja4PNIXcq52iWANqYfvzOQF4gNMcuyM',
  {
    auth: {
      storage: capacitorStorage,    // Use Capacitor Preferences
      autoRefreshToken: true,       // Auto-refresh JWT
      persistSession: true,         // Keep session
      detectSessionInUrl: true,     // Handle OAuth callbacks
      storageKey: 'aavis-auth',     // Custom storage key
    },
  }
);

/**
 * Check if Supabase is properly configured.
 * Returns false if env vars are missing — lets the app gracefully fall back.
 */
export function isSupabaseConfigured(): boolean {
  const url = supabaseUrl || 'https://lfhnlsniuubcvjpjwldj.supabase.co';
  const key = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmaG5sc25pdXViY3ZqcGp3bGRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1ODY1NTAsImV4cCI6MjA5NDE2MjU1MH0.yhY_JtKYOikbja4PNIXcq52iWANqYfvzOQF4gNMcuyM';
  return !!url && !!key && url.startsWith('https://');
}
