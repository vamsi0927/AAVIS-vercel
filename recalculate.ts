import { createClient } from '@supabase/supabase-js';
import { computeHealthScore } from './src/lib/scoring';
import { Product, UserProfile } from './src/lib/types';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function recalculate() {
  console.log('Fetching all scans from Supabase...');
  const { data: scans, error } = await supabase.from('scans').select('*');
  
  if (error) {
    console.error('Error fetching scans:', error);
    return;
  }

  console.log(`Found ${scans.length} scans to recalculate.`);

  // Dummy profile since we only use conditions/allergens for penalties
  const profile: UserProfile = {
    name: 'User',
    age: 25,
    gender: 'Prefer not to say',
    height: 175,
    weight: 70,
    activityLevel: 'Active',
    diet: 'None',
    allergens: [],
    conditions: []
  };

  for (const scan of scans) {
    const product: Product = {
      id: scan.id,
      name: scan.product_name || 'Unknown Product',
      brand: scan.brand || 'Unknown Brand',
      imageEmoji: '📦',
      ingredients: scan.ingredients || [],
      nutrients: scan.nutrients || {},
      additives: scan.additives || [],
      dynamicAdditives: {}, // We don't have this in the scan table directly
      allergens: scan.allergens_detected || []
    };

    const newScore = computeHealthScore(product, profile);
    
    console.log(`Updating scan ${scan.id} (${product.name}): ${scan.health_score} -> ${newScore.score}`);
    
    const { error: updateError } = await supabase
      .from('scans')
      .update({
        health_score: newScore.score,
        verdict: newScore.verdict,
        diet_advice: newScore.dietAdvice
      })
      .eq('id', scan.id);
      
    if (updateError) {
      console.error(`Error updating scan ${scan.id}:`, updateError);
    }
  }
  
  console.log('Finished recalculating all scans!');
}

recalculate();
