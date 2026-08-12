/**
 * AAVIS Phase C — Model Benchmark Script with Timeout & Fallback
 * Compares llama3.2:1b and llama3.1:latest on 3 representative food labels.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OLLAMA_URL = 'http://localhost:11434';

const EXTRACTION_PROMPT = `You are a strict food label data extractor. Your ONLY task is to extract information EXACTLY as written in the label text.

CRITICAL RULES:
1. If a nutrition value is NOT explicitly written on the label return null — NOT zero.
2. If serving size is not stated return null.
3. If added sugar or fiber is not listed return null.
4. NEVER calculate, estimate, or infer any value.
5. All "INS XXX" codes must become "EXXX" in additives array.

Return ONLY this JSON structure:
{
  "productName": "string or null",
  "brand": "string or null",
  "productType": "General Food",
  "servingSize": null,
  "nutritionUnit": null,
  "ingredients": ["flat list of ingredients"],
  "nutrients": {
    "calories": null, "sugar": null, "addedSugar": null, "sodium": null,
    "fat": null, "satFat": null, "protein": null, "fiber": null, "carbs": null
  },
  "additives": [],
  "additiveDetails": {},
  "ingredientDetails": {},
  "allergens": []
}`;

const TEST_LABELS = [
  {
    id: 'Label1_Standard',
    name: 'Spicy Instant Noodles',
    text: 'Ingredients: Wheat Flour, Palm Oil, Salt, Monosodium Glutamate (INS 621), Sugar, Tartrazine (INS 102). Nutrition per 100g: Energy 450 kcal, Fat 18g, Saturated Fat 9g, Sodium 1800mg, Total Sugars 4g, Protein 9g.'
  },
  {
    id: 'Label2_NoNutrition',
    name: 'Butter Cookies (No Nutrients)',
    text: 'Ingredients: Wheat Flour, Butter (Milk), Sugar, Eggs, Salt, INS 503.'
  },
  {
    id: 'Label3_ComplexSubIng',
    name: 'Cheese Nacho Crisps',
    text: 'Ingredients: Corn, Vegetable Oil (Palm Oil, Sunflower Oil), Cheese Powder (Milk Solids, Salt), INS 621. Nutrition per 30g: Energy 150 kcal, Fat 8g, Sodium 180mg, Carbs 17g, Sugars 1g, Protein 2g.'
  }
];

const MODELS = ['llama3.2:1b', 'llama3.1:latest'];

async function testModelOnLabel(model, label) {
  const prompt = `${EXTRACTION_PROMPT}\n\nFOOD LABEL TEXT:\n${label.text}`;
  const t0 = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 75000); // 75s timeout per request

  try {
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        format: 'json',
        options: { temperature: 0.05, num_ctx: 4096 }
      })
    });
    clearTimeout(timeoutId);
    
    const latency = Date.now() - t0;
    if (!res.ok) {
      return { model, labelId: label.id, status: 'HTTP_ERROR', latency, error: res.statusText };
    }

    const data = await res.json();
    const rawContent = data.message?.content || '';
    
    let parsed = null;
    let jsonValid = false;
    try {
      let cleaned = rawContent.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
      parsed = JSON.parse(cleaned);
      jsonValid = true;
    } catch (e) {
      const match = rawContent.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); jsonValid = true; } catch (e2) {}
      }
    }

    if (!jsonValid || !parsed) {
      return { model, labelId: label.id, status: 'INVALID_JSON', latency, rawContent };
    }

    const n = parsed.nutrients || {};
    const hallucinatedCount = (label.id === 'Label2_NoNutrition') ?
      Object.values(n).filter(v => v !== null && typeof v === 'number').length : 0;

    const ingCount = Array.isArray(parsed.ingredients) ? parsed.ingredients.length : 0;

    return {
      model,
      labelId: label.id,
      labelName: label.name,
      status: 'OK',
      latency,
      jsonValid,
      hallucinatedCount,
      ingCount,
      parsed
    };
  } catch (err) {
    clearTimeout(timeoutId);
    const isAbort = err.name === 'AbortError';
    return {
      model,
      labelId: label.id,
      status: isAbort ? 'TIMEOUT (>75s)' : 'FETCH_ERROR',
      latency: Date.now() - t0,
      error: err.message
    };
  }
}

async function main() {
  console.log('\n🧪 AAVIS Phase C — Model Benchmark (llama3.2:1b vs llama3.1:latest)');
  console.log('='.repeat(65));

  const results = [];

  for (const model of MODELS) {
    console.log(`\n🤖 Testing Model: ${model}`);
    for (const label of TEST_LABELS) {
      process.stdout.write(`  [${label.id}] ${label.name.padEnd(35)} ... `);
      const res = await testModelOnLabel(model, label);
      results.push(res);
      if (res.status === 'OK') {
        console.log(`✅ ${res.latency}ms | JSON: ${res.jsonValid} | Ingrs: ${res.ingCount} | Hallucinations: ${res.hallucinatedCount}`);
      } else {
        console.log(`❌ ${res.status} (${res.latency}ms): ${res.error || 'failed'}`);
      }
    }
  }

  console.log('\n' + '='.repeat(65));
  console.log('📊 BENCHMARK COMPARISON SUMMARY');
  console.log('─'.repeat(65));
  console.log(`${'Model'.padEnd(16)} ${'Label'.padEnd(20)} ${'Latency'.padStart(12)} ${'JSON Valid'.padStart(12)} ${'Hallucinations'.padStart(15)}`);
  console.log('─'.repeat(65));

  for (const r of results) {
    const latStr = `${r.latency}ms`;
    const valStr = r.status === 'OK' ? `${r.jsonValid}` : r.status;
    const halStr = r.status === 'OK' ? `${r.hallucinatedCount}` : 'N/A';
    console.log(`${r.model.padEnd(16)} ${r.labelId.padEnd(20)} ${latStr.padStart(12)} ${valStr.padStart(12)} ${halStr.padStart(15)}`);
  }

  console.log('='.repeat(65));

  const outPath = path.join(__dirname, 'model_benchmark_results.json');
  fs.writeFileSync(outPath, JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2));
  console.log(`\nSaved benchmark data to: ${outPath}\n`);
}

main().catch(console.error);
