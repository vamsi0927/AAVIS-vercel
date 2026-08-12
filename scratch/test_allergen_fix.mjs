import fs from 'fs';
import path from 'path';

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

const EXCLUSIONS = [
  'cream of tartar',
  'coconut cream',
  'non-dairy cream',
  'nondairy cream',
  'eggplant',
  'butternut',
  'butternut squash'
];

export function detectAllergensDeterministically(ingredients) {
  if (!Array.isArray(ingredients)) return [];

  const detected = new Set();
  const normIngredients = ingredients.map(i => (typeof i === 'string' ? i.toLowerCase() : ''));

  for (const [allergen, keywords] of Object.entries(ALLERGEN_MAP)) {
    for (const kw of keywords) {
      const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      
      for (const ing of normIngredients) {
        if (EXCLUSIONS.some(ex => ing.includes(ex))) {
          // Check if exclusion matches fully
          if (kw === 'cream' && (ing.includes('cream of tartar') || ing.includes('coconut cream') || ing.includes('non-dairy cream'))) continue;
          if (kw === 'egg' && ing.includes('eggplant')) continue;
          if (kw === 'butter' && ing.includes('butternut')) continue;
        }

        if (regex.test(ing)) {
          detected.add(allergen);
          break;
        }
      }
    }
  }

  return Array.from(detected);
}

const TESTS = [
  { ing: ['lentil flour'], expected: [] },
  { ing: ['distilled vinegar'], expected: [] },
  { ing: ['cream of tartar'], expected: [] },
  { ing: ['coconut cream'], expected: [] },
  { ing: ['eggplant'], expected: [] },
  { ing: ['butternut squash'], expected: [] },
  { ing: ['wheat flour', 'skimmed milk powder', 'til oil'], expected: ['wheat', 'dairy', 'sesame'] },
];

for (const t of TESTS) {
  const res = detectAllergensDeterministically(t.ing);
  console.log(`Ings: [${t.ing.join(', ')}] -> Allergens: [${res.join(', ')}] (Expected: [${t.expected.join(', ')}])`);
}
