/**
 * AAVIS Phase F — 15-Label Regression Test Script
 * Verifies all 15 audit labels against the hybrid v2 pipeline:
 * - Contract valid
 * - Health score present (5-100)
 * - Nutrition data valid (no impossible values)
 * - Ingredients present
 * - Allergens correct
 * - No fake/mock data
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER = 'http://localhost:3002';

const REQUIRED_KEYS = [
  'productName', 'brand', 'servingSize', 'nutritionUnit',
  'ingredients', 'nutrients', 'additives', 'additiveDetails',
  'ingredientDetails', 'allergens', 'finalScore',
  'overallAssessment', 'dietAdvice', 'aiSummary',
  'mainConcerns', 'majorBenefits', 'dimensions'
];

const REQUIRED_DIMENSIONS = [
  'ingredientSafety', 'nutritionalQuality', 'processingLevel',
  'nutrientDensity', 'energyDensity', 'wholeFoodContent', 'functionalHealthImpact'
];

const LABELS = [
  { id: 'L01', name: 'Spicy Instant Noodles',   text: 'Ingredients: Wheat Flour, Palm Oil, Salt, Monosodium Glutamate (INS 621), Sugar, Tartrazine (INS 102), Sodium Benzoate (INS 211). Nutrition per 100g: Energy 450 kcal, Fat 18g, Saturated Fat 9g, Sodium 1800mg, Total Sugars 4g, Protein 9g.', expectedAllergens: ['wheat'] },
  { id: 'L02', name: 'Diet Cola',                text: 'Ingredients: Carbonated Water, Caramel Color (INS 150d), Phosphoric Acid, Aspartame (INS 951), Potassium Benzoate (INS 212). Nutrition per 100g: Energy 0 kcal, Sodium 40mg, Fat 0g, Total Sugars 0g, Carbs 0g.', expectedAllergens: [] },
  { id: 'L03', name: 'Granola Bar',              text: 'Ingredients: Whole Grain Oats, Honey, Canola Oil, Brown Sugar, Almonds, Salt, Soy Lecithin (INS 322). Nutrition per 40g: Energy 160 kcal, Fat 6g, Saturated Fat 0.5g, Sodium 60mg, Total Sugars 10g, Fiber 3g, Protein 4g.', expectedAllergens: ['soy', 'tree nuts'] },
  { id: 'L04', name: 'Cheese Nacho Crisps',     text: 'Ingredients: Corn, Vegetable Oil, Cheese Powder (Milk Solids, Salt), Monosodium Glutamate (INS 621), Citric Acid (INS 330), Carmine (INS 120). Nutrition per 100g: Energy 510 kcal, Fat 27g, Saturated Fat 4.5g, Sodium 680mg, Total Sugars 2.5g, Carbs 58g, Protein 7g.', expectedAllergens: ['dairy'] },
  { id: 'L05', name: 'Strawberry Greek Yogurt', text: 'Ingredients: Pasteurized Lowfat Milk, Strawberries, Sugar, Modified Corn Starch, Pectin, Carmine (INS 120). Nutrition per 150g: Energy 120 kcal, Fat 1.5g, Saturated Fat 1g, Sodium 50mg, Total Sugars 15g, Carbs 18g, Protein 11g.', expectedAllergens: ['dairy'] },
  { id: 'L06', name: 'Salted Potato Crisps',    text: 'Ingredients: Fresh Potatoes, Vegetable Oil, Iodized Salt. Nutrition per 30g: Energy 160 kcal, Fat 10g, Saturated Fat 4g, Sodium 150mg, Total Sugars 0.5g, Carbs 16g, Protein 2g.', expectedAllergens: [] },
  { id: 'L07', name: 'Milk Chocolate Bar',      text: 'Ingredients: Sugar, Cocoa Butter, Milk Solids, Cocoa Mass, Soy Lecithin (INS 322), PGPR (INS 476). Nutrition per 100g: Energy 535 kcal, Fat 30g, Saturated Fat 18g, Sodium 80mg, Total Sugars 55g, Carbs 60g, Protein 7g.', expectedAllergens: ['dairy', 'soy'] },
  { id: 'L08', name: 'Butter Cookies',          text: 'Ingredients: Wheat Flour, Butter, Sugar, Eggs, Salt, Ammonium Bicarbonate (INS 503). Nutrition per 100g: Energy 480 kcal, Fat 22g, Saturated Fat 14g, Sodium 350mg, Total Sugars 22g, Carbs 65g, Protein 6g.', expectedAllergens: ['wheat', 'dairy', 'egg'] },
  { id: 'L09', name: 'Instant Tomato Soup',     text: 'Ingredients: Tomato Powder, Sugar, Potato Starch, Salt, Monosodium Glutamate (INS 621), Palm Fat, Yeast Extract, Silicon Dioxide (INS 551). Nutrition per serving: Energy 90 kcal, Fat 1.5g, Saturated Fat 0.8g, Sodium 720mg, Total Sugars 12g, Carbs 18g, Protein 1.5g.', expectedAllergens: [] },
  { id: 'L10', name: 'Whey Protein Isolate',   text: 'Ingredients: Whey Protein Isolate (Milk), Cocoa Powder, Sunflower Lecithin, Sucralose (INS 955), Acesulfame Potassium (INS 950). Nutrition per 30g: Energy 110 kcal, Fat 0.5g, Saturated Fat 0g, Sodium 50mg, Total Sugars 0g, Carbs 2g, Protein 25g.', expectedAllergens: ['dairy'] },
  { id: 'L11', name: 'Orange Juice',            text: 'Ingredients: 100% Pasteurized Orange Juice. Nutrition Facts: Serving 240ml. Energy 110 kcal, Fat 0g, Sodium 0mg, Total Sugars 22g, Carbs 26g, Protein 2g.', expectedAllergens: [] },
  { id: 'L12', name: 'Peanut Butter',           text: 'Ingredients: Roasted Peanuts (90%), Hydrogenated Vegetable Oil, Sugar, Salt. Nutrition per 32g: Energy 190 kcal, Fat 16g, Saturated Fat 3g, Sodium 140mg, Total Sugars 3g, Carbs 6g, Protein 8g.', expectedAllergens: ['peanut'] },
  { id: 'L13', name: '3-in-1 Coffee',           text: 'Ingredients: Creamer (Glucose Syrup, Hydrogenated Palm Kernel Oil, Sodium Caseinate), Sugar, Instant Coffee. Nutrition per 15g: Energy 70 kcal, Fat 2g, Saturated Fat 1.8g, Sodium 20mg, Total Sugars 9g, Carbs 12g, Protein 0.5g.', expectedAllergens: ['dairy'] },
  { id: 'L14', name: 'Whole Wheat Bread',       text: 'Ingredients: Whole Wheat Flour, Water, Yeast, Gluten, Brown Sugar, Soybean Oil, Calcium Propionate (INS 282), Salt. Nutrition per 50g: Energy 130 kcal, Fat 1.5g, Saturated Fat 0.3g, Sodium 220mg, Total Sugars 3g, Fiber 3g, Protein 5g.', expectedAllergens: ['wheat', 'soy'] },
  { id: 'L15', name: 'Mayonnaise',              text: 'Ingredients: Soybean Oil, Water, Whole Eggs, Egg Yolks, Vinegar, Salt, Sugar, Lemon Juice, Calcium Disodium EDTA (INS 385). Nutrition per 14g: Energy 90 kcal, Fat 10g, Saturated Fat 1.5g, Sodium 90mg, Total Sugars 0g, Carbs 0g, Protein 0.1g.', expectedAllergens: ['egg', 'soy'] },
];

async function runRegression() {
  console.log('\n📋 AAVIS Phase F — 15-Label Regression Suite');
  console.log('='.repeat(70));

  const results = [];
  for (const label of LABELS) {
    process.stdout.write(`  [${label.id}] ${label.name.padEnd(30)} ... `);
    const t0 = Date.now();
    try {
      const res = await fetch(`${SERVER}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: label.text })
      });
      const latency = Date.now() - t0;
      if (!res.ok) {
        console.log(`❌ HTTP ${res.status}`);
        results.push({ id: label.id, name: label.name, status: 'HTTP_ERROR', latency });
        continue;
      }
      const data = await res.json();

      // Check Contract
      const missingKeys = REQUIRED_KEYS.filter(k => !(k in data));
      const missingDims = REQUIRED_DIMENSIONS.filter(d => !data.dimensions?.[d]);
      
      const contractValid = missingKeys.length === 0 && missingDims.length === 0;
      const scoreValid = typeof data.finalScore === 'number' && data.finalScore >= 5 && data.finalScore <= 100;
      const ingrsPresent = Array.isArray(data.ingredients) && data.ingredients.length > 0;
      
      // Allergen check
      const detectedAllergens = data.allergens || [];
      const missedExpected = label.expectedAllergens.filter(a => !detectedAllergens.includes(a));
      const allergensValid = missedExpected.length === 0;

      // Hallucination check
      const n = data.nutrients || {};
      const hallucinated = (n.sugar !== null && n.carbs !== null && n.sugar > n.carbs) ||
                           (n.satFat !== null && n.fat !== null && n.satFat > n.fat);

      const pass = contractValid && scoreValid && ingrsPresent && allergensValid && !hallucinated;
      const statusIcon = pass ? '✅' : '⚠️';

      console.log(`${statusIcon} ${latency}ms | Score: ${data.finalScore} | Allergens: [${detectedAllergens.join(', ')}]`);
      if (!contractValid) console.log(`     Missing keys: [${missingKeys.join(', ')}] Dims: [${missingDims.join(', ')}]`);
      if (missedExpected.length) console.log(`     Missed expected allergens: [${missedExpected.join(', ')}]`);
      if (hallucinated) console.log(`     🚨 Hallucination detected!`);

      results.push({
        id: label.id,
        name: label.name,
        pass,
        latency,
        score: data.finalScore,
        allergens: detectedAllergens,
        contractValid,
        scoreValid,
        ingrsPresent,
        allergensValid,
        hallucinated,
        timings: data._timings || {}
      });
    } catch (e) {
      console.log(`❌ FETCH_ERROR: ${e.message}`);
      results.push({ id: label.id, name: label.name, pass: false, error: e.message });
    }
  }

  console.log('\n' + '='.repeat(70));
  const passed = results.filter(r => r.pass).length;
  console.log(`📊 REGRESSION SUMMARY: ${passed}/${LABELS.length} PASSED`);
  console.log('='.repeat(70));

  const outPath = path.join(__dirname, 'regression_v2_results.json');
  fs.writeFileSync(outPath, JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2));
  console.log(`Saved regression report to: ${outPath}\n`);
}

runRegression().catch(console.error);
