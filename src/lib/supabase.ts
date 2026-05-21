/// <reference types="vite/client" />
/**
 * Supabase Client
 * Central Supabase connection used across the app.
 * Reads credentials from VITE_ env variables.
 * Configured with localStorage persistence for cross-session + APK compatibility.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

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
      persistSession: true,        // Keep session in localStorage
      autoRefreshToken: true,       // Auto-refresh JWT
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
  return !!supabaseUrl && !!supabaseAnonKey && supabaseUrl.startsWith('https://');
}
