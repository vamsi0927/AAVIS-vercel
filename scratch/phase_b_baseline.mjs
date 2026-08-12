/**
 * AAVIS Phase B — 3-Run Baseline Measurement
 * Runs the same wheat-flour label 3 times and reports per-stage timings.
 * Uses the _timings object returned by the instrumented server.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const LABEL = 'Ingredients: Wheat Flour, Salt, Sugar, Palm Oil. Nutrition per 100g: Calories 350 kcal, Fat 5g, Saturated Fat 2g, Sodium 200mg, Total Sugars 4g, Protein 10g, Carbs 65g.';
const RUNS = 3;
const SERVER = 'http://localhost:3002';

async function runOnce(run) {
  const wall0 = Date.now();
  const res = await fetch(`${SERVER}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: LABEL })
  });
  const wallMs = Date.now() - wall0;

  if (!res.ok) {
    const err = await res.text();
    return { run, status: 'ERROR', wallMs, error: err };
  }
  const data = await res.json();
  return {
    run,
    status: 'OK',
    wallMs,
    score: data.finalScore,
    ingredients: data.ingredients?.length || 0,
    allergens: data.allergens || [],
    t: data._timings || {},
    validWarnings: data._validationWarnings || [],
    uncertainFields: data._uncertainFields || [],
    explainFailed: data._timings?.explainFailed || false,
  };
}

function fmt(n) { return typeof n === 'number' ? `${n}ms` : 'N/A'; }
function stat(vals) {
  const v = vals.filter(x => typeof x === 'number');
  if (!v.length) return { min: 'N/A', max: 'N/A', avg: 'N/A' };
  return {
    min: Math.min(...v),
    max: Math.max(...v),
    avg: Math.round(v.reduce((s, x) => s + x, 0) / v.length),
  };
}

async function main() {
  console.log('\n🔬 AAVIS Phase B — 3-Run Baseline Measurement');
  console.log('='.repeat(60));
  console.log(`Label: "${LABEL.substring(0, 60)}..."`);
  console.log(`Runs: ${RUNS}\n`);

  const results = [];
  for (let i = 1; i <= RUNS; i++) {
    process.stdout.write(`  Run ${i}/${RUNS} ... `);
    const r = await runOnce(i);
    results.push(r);
    if (r.status === 'OK') {
      console.log(`✅  total=${r.t.total_ms}ms | extract=${r.t.extraction_ms}ms | explain=${r.t.explanation_ms}ms | score=${r.score}`);
    } else {
      console.log(`❌  ERROR: ${r.error?.substring(0, 100)}`);
    }
  }

  const ok = results.filter(r => r.status === 'OK');
  if (!ok.length) {
    console.error('\nAll runs failed. Cannot produce timing report.');
    process.exit(1);
  }

  const stages = ['normalize_ms','extraction_ms','jsonParse_ms','validation_ms','allergen_ms','score_ms','explanation_ms','total_ms'];
  const stageLabels = {
    normalize_ms:   'OCR Normalize',
    extraction_ms:  'Ollama Extraction',
    jsonParse_ms:   'JSON Parse (embedded)',
    validation_ms:  'Nutrition Validation',
    allergen_ms:    'Allergen Detection',
    score_ms:       'Health Score (JS)',
    explanation_ms: 'Ollama Explanation',
    total_ms:       'TOTAL',
  };

  console.log('\n' + '='.repeat(60));
  console.log('📊 PER-STAGE TIMING TABLE (ms)');
  console.log('─'.repeat(60));
  console.log(`${'Stage'.padEnd(28)} ${'Run1'.padStart(7)} ${'Run2'.padStart(7)} ${'Run3'.padStart(7)} ${'Avg'.padStart(7)} ${'Min'.padStart(7)} ${'Max'.padStart(7)}`);
  console.log('─'.repeat(60));

  const report = {};
  for (const stage of stages) {
    const vals = ok.map(r => r.t[stage]);
    const s = stat(vals);
    report[stage] = s;
    const row = `${stageLabels[stage].padEnd(28)} ${fmt(vals[0]).padStart(7)} ${fmt(vals[1]).padStart(7)} ${fmt(vals[2]).padStart(7)} ${fmt(s.avg).padStart(7)} ${fmt(s.min).padStart(7)} ${fmt(s.max).padStart(7)}`;
    if (stage === 'total_ms') console.log('─'.repeat(60));
    console.log(row);
  }

  console.log('='.repeat(60));

  // Bottleneck identification
  const extractAvg = report.extraction_ms.avg || 0;
  const explainAvg = report.explanation_ms.avg || 0;
  const totalAvg   = report.total_ms.avg || 1;
  const restAvg    = totalAvg - extractAvg - explainAvg;

  console.log('\n📌 BOTTLENECK ANALYSIS');
  console.log(`  Ollama extraction:  ${extractAvg}ms  (${Math.round(extractAvg/totalAvg*100)}% of total)`);
  console.log(`  Ollama explanation: ${explainAvg}ms  (${Math.round(explainAvg/totalAvg*100)}% of total)`);
  console.log(`  Ollama total:       ${extractAvg + explainAvg}ms  (${Math.round((extractAvg+explainAvg)/totalAvg*100)}% of total)`);
  console.log(`  Deterministic work: ${restAvg}ms  (${Math.round(restAvg/totalAvg*100)}% of total)`);

  const explainFailed = ok.some(r => r.explainFailed);
  if (explainFailed) {
    console.log('\n  ⚠️  Explanation call FAILED in at least one run — fallback was used.');
  }

  console.log('\n📋 VALIDATION SUMMARY');
  ok.forEach(r => {
    console.log(`  Run ${r.run}: score=${r.score} | ingredients=${r.ingredients} | allergens=[${r.allergens.join(',')}] | warnings=${r.validWarnings.length} | uncertainFields=[${r.uncertainFields.join(',')}]`);
  });

  // Save results
  const outPath = path.join(__dirname, 'baseline_measurements.json');
  fs.writeFileSync(outPath, JSON.stringify({ timestamp: new Date().toISOString(), label: LABEL, runs: results, report }, null, 2));
  console.log(`\n✅ Saved to: ${outPath}\n`);

  // Return structured data for report generation
  return { report, extractAvg, explainAvg, totalAvg, restAvg };
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
