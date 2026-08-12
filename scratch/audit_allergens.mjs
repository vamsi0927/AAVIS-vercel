/**
 * AAVIS Phase E — Allergen Keyword Audit Script
 * Audits 60+ allergen keywords against false-positive test cases.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ALLERGEN_MAP = {
  dairy:       ['milk', 'cream', 'butter', 'cheese', 'whey', 'casein', 'caseinate', 'lactose', 'lactalbumin', 'lactoglobulin', 'ghee', 'paneer', 'curd', 'yogurt', 'yoghurt', 'milk solids', 'milk powder', 'skimmed milk', 'condensed milk'],
  egg:         ['egg', 'eggs', 'egg yolk', 'egg white', 'albumen', 'ovomucin'],
  wheat:       ['wheat', 'wheat flour', 'whole wheat', 'refined flour', 'maida', 'gluten', 'semolina', 'durum', 'spelt', 'triticale'],
  soy:         ['soy', 'soya', 'soybean', 'soy lecithin', 'soya lecithin', 'tofu', 'tempeh', 'edamame', 'miso'],
  peanut:      ['peanut', 'peanuts', 'groundnut', 'groundnuts', 'arachis oil'],
  'tree nuts': ['almond', 'cashew', 'walnut', 'pistachio', 'hazelnut', 'macadamia', 'pecan', 'brazil nut', 'pine nut', 'coconut'],
  fish:        ['fish', 'salmon', 'tuna', 'cod', 'haddock', 'sardine', 'anchovy', 'anchovies', 'fish sauce', 'fish oil'],
  shellfish:   ['shrimp', 'prawn', 'crab', 'lobster', 'oyster', 'clam', 'scallop', 'mussel', 'shellfish'],
  sesame:      ['sesame', 'sesame oil', 'tahini', 'til', 'gingelly'],
  mustard:     ['mustard', 'mustard oil', 'mustard seeds'],
  sulphites:   ['sulphite', 'sulfite', 'sulphur dioxide', 'sulfur dioxide', 'e220', 'e221', 'e222', 'e223', 'e224'],
  celery:      ['celery', 'celeriac'],
  lupin:       ['lupin', 'lupine'],
};

// Test cases to check false positive triggers
const FALSE_POSITIVE_TESTS = [
  { ing: 'lentil flour', expectedNoAllergen: 'sesame', triggerKeyword: 'til' },
  { ing: 'distilled vinegar', expectedNoAllergen: 'sesame', triggerKeyword: 'til' },
  { ing: 'cream of tartar', expectedNoAllergen: 'dairy', triggerKeyword: 'cream' },
  { ing: 'coconut cream', expectedNoAllergen: 'dairy', triggerKeyword: 'cream' },
  { ing: 'eggplant', expectedNoAllergen: 'egg', triggerKeyword: 'egg' },
  { ing: 'nutmeg', expectedNoAllergen: 'tree nuts', triggerKeyword: 'nut' },
  { ing: 'butternut squash', expectedNoAllergen: 'dairy', triggerKeyword: 'butter' },
];

function auditKeyword(category, keyword) {
  // Classification logic:
  // CONFIRMED: Word-boundary matched, unambiguous allergen term
  // POSSIBLE: Broad term that could be non-allergenic in specific contexts (e.g. coconut, arachis oil)
  // CONTEXTUAL: Short substring prone to false positives without word boundary (e.g. 'til', 'cream', 'egg')

  if (['til', 'cream', 'egg', 'nut', 'butter'].includes(keyword.toLowerCase())) {
    return 'CONTEXTUAL (Needs word boundary / negative exclusion rule)';
  }
  if (['coconut', 'arachis oil', 'fish oil', 'sesame oil'].includes(keyword.toLowerCase())) {
    return 'POSSIBLE (Specific form / regulation dependent)';
  }
  return 'CONFIRMED';
}

function main() {
  console.log('\n🔍 AAVIS Allergen Keyword Audit Report');
  console.log('='.repeat(70));

  const auditSummary = [];
  let totalKeywords = 0;

  for (const [category, keywords] of Object.entries(ALLERGEN_MAP)) {
    console.log(`\n📦 Category: ${category.toUpperCase()} (${keywords.length} keywords)`);
    console.log('─'.repeat(70));
    for (const kw of keywords) {
      totalKeywords++;
      const classification = auditKeyword(category, kw);
      auditSummary.push({ category, keyword: kw, classification });
      console.log(`  - ${kw.padEnd(25)} : [${classification}]`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('🧪 FALSE-POSITIVE BOUNDARY TESTING');
  console.log('─'.repeat(70));

  for (const test of FALSE_POSITIVE_TESTS) {
    const rawMatch = ALLERGEN_MAP[test.expectedNoAllergen].some(kw => test.ing.toLowerCase().includes(kw));
    const status = rawMatch ? '⚠️ FALSE POSITIVE DETECTED' : '✅ SAFE';
    console.log(`  Ingredient: "${test.ing}" -> Category: ${test.expectedNoAllergen} (${status})`);
  }

  console.log('='.repeat(70));
  console.log(`Total audited keywords: ${totalKeywords}`);
  
  const outPath = path.join(__dirname, 'allergen_audit_results.json');
  fs.writeFileSync(outPath, JSON.stringify({ timestamp: new Date().toISOString(), auditSummary }, null, 2));
  console.log(`Saved audit to: ${outPath}\n`);
}

main();
