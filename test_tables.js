import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
// Because we might not have service role in .env, we'll use anon key just to probe table existence.
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase URL or Anon Key in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const tablesToCheck = [
  'profiles', 'users', 'scans', 'reports', 'search_history', 
  'saved_products', 'bookmarks', 'product_reviews', 
  'notifications', 'diet_types', 'user_diet_preferences',
  'health_conditions', 'user_health_conditions', 'allergens',
  'user_allergens', 'products', 'additives', 'product_additives',
  'scan_nutrients', 'scan_history', 'achievements', 
  'user_achievements', 'daily_health_reports', 
  'weekly_health_reports', 'ai_chat_history', 
  'educational_articles', 'product_alternatives',
  'verification_tokens', 'password_reset_tokens'
];

async function checkTables() {
  const existingTables = [];
  const missingTables = [];

  console.log('Probing Supabase tables...');
  
  for (const table of tablesToCheck) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        missingTables.push(table);
      } else {
        // If there's an RLS error or something else, it means the table exists!
        existingTables.push(table);
      }
    } else {
      existingTables.push(table);
    }
  }

  console.log('\n--- EXISTING TABLES ---');
  console.log(existingTables.join(', '));
  
  console.log('\n--- MISSING TABLES ---');
  console.log(missingTables.join(', '));
}

checkTables();
