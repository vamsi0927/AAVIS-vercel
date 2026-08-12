import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const text = `Ingredients: Wheat Flour, Palm Oil, Salt, Monosodium Glutamate, Sugar. Nutrition per 100g: Calories 450 kcal, Fat 18g, Saturated Fat 9g, Sodium 1800mg, Total Sugars 4g, Protein 9g.`;
  
  console.log('Sending baseline scan to local Express server on port 3002...');
  try {
    const res = await fetch('http://localhost:3002/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}: ${res.statusText}`);
    }
    
    const data = await res.json();
    const baselinePath = path.join(__dirname, 'regression_baseline.json');
    fs.writeFileSync(baselinePath, JSON.stringify(data, null, 2));
    console.log(`Saved regression baseline payload successfully to: ${baselinePath}`);
    console.log(`Payload keys:`, Object.keys(data));
  } catch (e) {
    console.error('Failed to run baseline scan:', e.message);
  }
}

run();
