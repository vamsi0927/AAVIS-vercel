import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(url, key);

async function checkDB() {
  console.log("Checking saved_myths table...");
  const { data: tableData, error: tableError } = await supabase.from('saved_myths').select('*').limit(1);
  if (tableError) {
    console.error("Table check failed:", tableError);
  } else {
    console.log("Table check passed. saved_myths exists.");
  }
}

checkDB();
