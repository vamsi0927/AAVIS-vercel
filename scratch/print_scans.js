import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Key in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: scans, error } = await supabase
    .from('scans')
    .select('*')
    .limit(10);

  if (error) {
    console.error('Error fetching scans:', error);
    return;
  }

  console.log(`Fetched ${scans.length} scans:`);
  scans.forEach((scan, index) => {
    console.log(`\n--- Scan #${index + 1} ---`);
    console.log(`Keys:`, Object.keys(scan));
    console.log(`ID: ${scan.id}`);
    console.log(`Product Name: ${scan.product_name}`);
    console.log(`Health Score: ${scan.health_score}`);
    console.log(`Analysis Results:`, JSON.stringify(scan.analysis_results, null, 2));
    console.log(`Gemini Analysis:`, JSON.stringify(scan.gemini_analysis, null, 2));
  });
}

main();
