import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://lfhnlsniuubcvjpjwldj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmaG5sc25pdXViY3ZqcGp3bGRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1ODY1NTAsImV4cCI6MjA5NDE2MjU1MH0.yhY_JtKYOikbja4PNIXcq52iWANqYfvzOQF4gNMcuyM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export function isSupabaseConfigured(): boolean {
  return !!supabaseUrl && !!supabaseAnonKey && supabaseUrl.startsWith('https://');
}

