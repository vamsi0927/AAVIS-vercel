/**
 * AAVIS Pipeline V2 - Regression Baseline Verifier
 * Checks that the new hybrid pipeline output contains all fields
 * required by ResultScreen.tsx.
 */
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Required top-level keys from ResultScreen.tsx analysis
const REQUIRED_KEYS = [
  'productName', 'brand', 'servingSize', 'nutritionUnit',
  'ingredients', 'nutrients', 'additives', 'additiveDetails',
  'ingredientDetails', 'allergens', 'finalScore',
  'overallAssessment', 'dietAdvice', 'aiSummary',
  'mainConcerns', 'majorBenefits', 'dimensions'
];

// Required dimension sub-keys
const REQUIRED_DIMENSIONS = [
  'ingredientSafety', 'nutritionalQuality', 'processingLevel',
  'nutrientDensity', 'energyDensity', 'wholeFoodContent', 'functionalHealthImpact'
];

// The 15 audit labels (realistic OCR-style noise included)
const AUDIT_LABELS = [
  { id: 'L01', name: 'Spicy Instant Noodles',   text: 'Ingredints: Wh3at Flour, Refined P4lm 0il, Iodized S4lt, MSG (E621), Sug4r, Tartraz1ne (E102), Sodium Benzoate (E211). Nutri: Energy 450 kcal, Fat 18g, Saturated Fat 9g, Sodium 1800mg, Total Sugars 4g, Protein 9g.' },
  { id: 'L02', name: 'Diet Cola',                text: 'CARBONATED WAT3R, CARAMEL COL0R (E150d), PHOSPHORIC AC1D, ASPARTAME (E951), POTASS1UM BENZOATE (E212). nutrition facts: Calories 0 kcal, Sodium 40mg, Fat 0g, Sugar 0g, Carbs 0g.' },
  { id: 'L03', name: 'Granola Bar',              text: 'INGREDIENTS: Whole Gra1n Oats, H0ney, Canola 0il, Brown Sug4r, Almonds, S4lt, Soy Lec1thin (E322). Nutrition per 40g: Calories 160 kcal, Fat 6g, Sat Fat 0.5g, Sodium 60mg, Sugar 10g, Fiber 3g, Protein 4g.' },
  { id: 'L04', name: 'Cheese Nacho Crisps',     text: 'Ingred1ents: Corn, Vegetable 0il, Cheese Powd3r, MSG (E621), Maltodextr1n, Citr1c Acid (E330), Carmine (E120). Nutrition per 100g: Calories 510 kcal, Fat 27g, Sat Fat 4.5g, Sodium 680mg, Sugars 2.5g, Carbs 58g, Protein 7g.' },
  { id: 'L05', name: 'Strawberry Greek Yogurt', text: 'INGREDIENTS: Pasteurized Lowfat M1lk, Strawberries, Sug4r, Modified Corn St4rch, Pect1n, Carm1ne (E120). Nutrition per 150g: Calories 120, Fat 1.5g, Sat Fat 1g, Sodium 50mg, Sugars 15g, Carbs 18g, Protein 11g.' },
  { id: 'L06', name: 'Salted Potato Crisps',    text: 'Ingredients: Fresh Potatoes, Vegetable Oil, Iodized Salt. Nutrition per 30g: Energy 160 kcal, Fat 10g, Sat Fat 4g, Sodium 150mg, Sugars 0.5g, Carbs 16g, Protein 2g.' },
  { id: 'L07', name: 'Milk Chocolate Bar',      text: 'Ingredients: Sug4r, Cocoa Butter, Milk Sol1ds, Cocoa Mass, Soy Lec1thin (E322), PGPR (E476). Nutrition per 100g: Energy 535 kcal, Fat 30g, Sat Fat 18g, Sodium 80mg, Sugars 55g, Carbs 60g, Protein 7g.' },
  { id: 'L08', name: 'Butter Cookies',          text: 'Ingredients: Wh3at Flour, Butter, Sug4r, Eggs, S4lt, Ammonium Bicarbonate (E503). Nutrition per 100g: Calories 480, Fat 22g, Sat Fat 14g, Sodium 350mg, Sugars 22g, Carbs 65g, Protein 6g.' },
  { id: 'L09', name: 'Instant Tomato Soup',     text: 'Ingredients: Tomato Powd3r, Sugar, Potato St4rch, Salt, MSG (E621), Palm Fat, Yeast Extract, Silicon Dioxide (E551). Nutrition per serving: Energy 90 kcal, Fat 1.5g, Sat Fat 0.8g, Sodium 720mg, Sugars 12g, Carbs 18g, Protein 1.5g.' },
  { id: 'L10', name: 'Whey Protein Isolate',   text: 'INGREDIENTS: Wh3y Protein Isolate, Cocoa Powder, Sunflower Lec1thin, Sucralose (E955), Acesulfame Potassium (E950). Nutrition per 30g: Calories 110, Fat 0.5g, Sat Fat 0g, Sodium 50mg, Sugars 0g, Carbs 2g, Protein 25g.' },
  { id: 'L11', name: 'Orange Juice',            text: 'INGREDIENTS: 100% Pasteur1zed Orange Ju1ce. Nutrition: Serv size 240ml. Calories 110 kcal, Fat 0g, Sodium 0mg, Total Sugars 22g (Added Sugars 0g), Carbs 26g, Protein 2g.' },
  { id: 'L12', name: 'Peanut Butter',           text: 'Ingredients: Roasted Peanuts (90%), Hydrogenated Vegetable 0il, Sug4r, Salt. Nutrition per 32g: Calories 190 kcal, Fat 16g, Sat Fat 3g, Sodium 140mg, Sugars 3g, Carbs 6g, Protein 8g.' },
  { id: 'L13', name: '3-in-1 Coffee',           text: 'Ingredients: Cream3r (Glucose Syrup, Hydrogenated Palm Kernel 0il, Sodium Caseinate, Dipotassium Phosphate E340), Sugar, Instant C0ffee. Nutrition per 15g: Calories 70 kcal, Fat 2g, Sat Fat 1.8g, Sodium 20mg, Sugars 9g, Carbs 12g, Protein 0.5g.' },
  { id: 'L14', name: 'Whole Wheat Bread',       text: 'Ingredients: Whole Wh3at Flour, Water, Yeast, Gluten, Brown Sugar, Soybean 0il, Calcium Propionate (E282), Salt. Nutrition per 50g: Calories 130 kcal, Fat 1.5g, Sat Fat 0.3g, Sodium 220mg, Sugars 3g, Fiber 3g, Protein 5g.' },
  { id: 'L15', name: 'Mayonnaise',              text: 'Ingredients: Soybean 0il, Water, Whole Eggs, Egg Yolks, Vinegar, Salt, Sug4r, Lemon Ju1ce, Calcium Disodium EDTA (E385). Nutrition per 14g: Energy 90 kcal, Fat 10g, Sat Fat 1.5g, Sodium 90mg, Sugars 0g, Carbs 0g, Protein 0.1g.' },
];

async function runScan(label) {
  const t0 = Date.now();
  try {
    const res = await fetch('http://localhost:3002/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: label.text })
    });
    const latencyMs = Date.now() - t0;
    if (!res.ok) {
      return { id: label.id, name: label.name, status: 'SERVER_ERROR', latencyMs, error: `HTTP ${res.status}`, data: null };
    }
    const data = await res.json();
    return { id: label.id, name: label.name, status: 'OK', latencyMs, data };
  } catch (e) {
    return { id: label.id, name: label.name, status: 'NETWORK_ERROR', latencyMs: Date.now() - t0, error: e.message, data: null };
  }
}

function verifySchema(data) {
  if (!data) return { valid: false, missingKeys: ['(no data returned)'], dimIssues: [] };
  const missingKeys = REQUIRED_KEYS.filter(k => !(k in data));
  const dimIssues = [];
  if (data.dimensions) {
    REQUIRED_DIMENSIONS.forEach(d => {
      if (!data.dimensions[d]) dimIssues.push(`Missing dimension: ${d}`);
      else if (typeof data.dimensions[d].score !== 'number') dimIssues.push(`${d}.score is not a number`);
    });
  } else {
    dimIssues.push('dimensions object is missing');
  }
  return { valid: missingKeys.length === 0 && dimIssues.length === 0, missingKeys, dimIssues };
}

function checkHallucinations(data, originalText) {
  const issues = [];
  const n = data.nutrients || {};
  if (n.sugar !== null && n.carbs !== null && typeof n.sugar === 'number' && typeof n.carbs === 'number' && n.sugar > n.carbs) {
    issues.push(`Sugar (${n.sugar}) > Carbs (${n.carbs}) — validation quarantine should have caught this`);
  }
  if (n.satFat !== null && n.fat !== null && typeof n.satFat === 'number' && typeof n.fat === 'number' && n.satFat > n.fat) {
    issues.push(`SatFat (${n.satFat}) > Fat (${n.fat}) — validation quarantine should have caught this`);
  }
  if (typeof n.sodium === 'number' && n.sodium > 10000) issues.push(`Sodium ${n.sodium} mg is impossibly high`);
  if (typeof n.calories === 'number' && n.calories > 900) issues.push(`Calories ${n.calories} kcal > 900/100g limit`);
  return issues;
}

async function main() {
  console.log('\n🔬 AAVIS Hybrid Pipeline V2 - 15-Label Validation\n' + '='.repeat(55));
  
  const results = [];
  for (const label of AUDIT_LABELS) {
    process.stdout.write(`  [${label.id}] ${label.name.padEnd(30)} ...`);
    const result = await runScan(label);
    const schema = verifySchema(result.data);
    const hallucinations = result.data ? checkHallucinations(result.data, label.text) : [];
    results.push({ ...result, schema, hallucinations });
    
    const statusIcon = result.status === 'OK' && schema.valid && hallucinations.length === 0 ? '✅' : '⚠️ ';
    console.log(` ${statusIcon} ${result.latencyMs}ms | Score: ${result.data?.finalScore ?? 'N/A'} | Allergens: ${(result.data?.allergens || []).join(', ') || 'none'}`);
    
    if (!schema.valid) console.log(`     ⛔ Schema: missing [${schema.missingKeys.join(', ')}]`);
    if (hallucinations.length) console.log(`     🚨 Hallucination: ${hallucinations.join('; ')}`);
    if (result.data?._validationWarnings?.length) {
      console.log(`     🛡️  Validation quarantined: ${result.data._validationWarnings.join(' | ')}`);
    }
  }

  // Summary stats
  const ok = results.filter(r => r.status === 'OK');
  const schemaValid = results.filter(r => r.schema.valid);
  const noHallucinations = results.filter(r => r.hallucinations.length === 0);
  const avgLatency = ok.length > 0 ? Math.round(ok.reduce((s, r) => s + r.latencyMs, 0) / ok.length) : 0;

  console.log('\n' + '='.repeat(55));
  console.log(`📊 RESULTS:`);
  console.log(`   Pipeline success:    ${ok.length}/15`);
  console.log(`   Schema valid:        ${schemaValid.length}/15`);
  console.log(`   No hallucinations:   ${noHallucinations.length}/15`);
  console.log(`   Avg latency:         ${avgLatency}ms`);
  console.log('='.repeat(55));

  // Save results
  const outPath = path.join(__dirname, 'validation_results_v2.json');
  fs.writeFileSync(outPath, JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2));
  console.log(`\nSaved full results to: ${outPath}\n`);
}

main().catch(console.error);
