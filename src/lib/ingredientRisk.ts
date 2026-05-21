/**
 * Ingredient Risk Classification Engine
 * 
 * Classifies raw ingredient strings into 5 risk tiers with
 * consumer-friendly explanations and color codes.
 * 
 * Tiers:
 *   safe       → Green   — Natural, whole, or beneficial
 *   mild       → Yellow  — Slightly processed or mild concern
 *   moderate   → Orange  — Moderately processed / notable concern
 *   harmful    → Red     — Harmful or risky
 *   hazardous  → Purple  — Dangerous additive / avoid
 */

export type IngredientRiskLevel = 'safe' | 'mild' | 'moderate' | 'harmful' | 'hazardous';

export interface IngredientRiskInfo {
  level: IngredientRiskLevel;
  explanation: string;
}

// ─── Risk keyword database ─────────────────────────────────────────
// Each entry: [keyword to match (lowercase), risk level, short explanation]
type RiskEntry = [string, IngredientRiskLevel, string];

const RISK_DB: RiskEntry[] = [
  // ── HAZARDOUS (Purple) ────────────────────────────────────────────
  ['tartrazine',            'hazardous', 'Synthetic dye linked to hyperactivity in children.'],
  ['aspartame',             'hazardous', 'Artificial sweetener. Must be avoided by people with PKU.'],
  ['sodium benzoate',       'hazardous', 'Can form benzene (carcinogen) when combined with Vitamin C.'],
  ['potassium bromate',     'hazardous', 'Banned in many countries. Possible carcinogen.'],
  ['butylated hydroxyanisole', 'hazardous', 'Synthetic antioxidant (BHA). Possible carcinogen.'],
  ['bha',                   'hazardous', 'Synthetic antioxidant. Possible carcinogen in high doses.'],
  ['bht',                   'hazardous', 'Synthetic antioxidant. May disrupt hormones.'],
  ['sodium nitrite',        'hazardous', 'Preservative in processed meats. Forms carcinogenic nitrosamines.'],
  ['sodium nitrate',        'hazardous', 'Preservative. May form cancer-causing compounds when heated.'],
  ['partially hydrogenated', 'hazardous', 'Contains trans fats. Increases heart disease risk.'],
  ['trans fat',             'hazardous', 'Artificial fat that clogs arteries. Avoid completely.'],
  ['acesulfame',            'hazardous', 'Artificial sweetener with limited long-term safety data.'],

  // ── HARMFUL (Red) ────────────────────────────────────────────────
  ['high fructose corn syrup', 'harmful', 'Highly processed sweetener linked to obesity and diabetes.'],
  ['hfcs',                  'harmful', 'Highly processed corn-based sweetener.'],
  ['monosodium glutamate',  'harmful', 'Flavor enhancer (MSG). May cause headaches in sensitive people.'],
  ['msg',                   'harmful', 'Flavor enhancer that can cause sensitivity reactions.'],
  ['artificial flavo',      'harmful', 'Lab-made chemicals that mimic natural taste.'],
  ['artificial colour',     'harmful', 'Synthetic dye with no nutritional value.'],
  ['artificial color',      'harmful', 'Synthetic dye with no nutritional value.'],
  ['sodium erythorbate',    'harmful', 'Chemical preservative used in processed meats.'],
  ['tbhq',                  'harmful', 'Synthetic preservative. May cause nausea at high doses.'],
  ['propyl gallate',        'harmful', 'Synthetic antioxidant. Potential endocrine disruptor.'],
  ['carrageenan',           'harmful', 'Thickener that may cause gut inflammation.'],
  ['polysorbate',           'harmful', 'Synthetic emulsifier that may affect gut bacteria.'],
  ['sucralose',             'harmful', 'Artificial sweetener. May affect gut microbiome.'],
  ['saccharin',             'harmful', 'Artificial sweetener with a bitter aftertaste.'],
  ['bleached flour',        'harmful', 'Flour stripped of nutrients and treated with chemicals.'],
  ['maida',                 'harmful', 'Refined flour stripped of all fiber and nutrients.'],
  ['vanillin',              'harmful', 'Synthetic vanilla substitute made from wood pulp or chemicals.'],
  ['sodium tripolyphosphate', 'harmful', 'Industrial chemical used as a texturizer.'],

  // ── MODERATE (Orange) ────────────────────────────────────────────
  ['palm oil',              'moderate', 'Refined oil high in saturated fat. Linked to deforestation.'],
  ['palmolein',             'moderate', 'Refined palm oil fraction. High in saturated fat.'],
  ['refined oil',           'moderate', 'Chemically processed oil stripped of natural nutrients.'],
  ['vegetable oil',         'moderate', 'Often a blend of refined oils. Quality varies.'],
  ['soybean oil',           'moderate', 'Highly processed omega-6 oil. Use in moderation.'],
  ['canola oil',            'moderate', 'Refined seed oil. Debated health effects.'],
  ['corn oil',              'moderate', 'Highly refined seed oil. High in omega-6.'],
  ['cottonseed oil',        'moderate', 'Refined oil from cotton seeds. May contain residues.'],
  ['sunflower oil',         'moderate', 'Refined seed oil. Omega-6 heavy when over-consumed.'],
  ['dextrose',              'moderate', 'Processed sugar that rapidly spikes blood sugar.'],
  ['maltodextrin',          'moderate', 'Highly processed starch with a very high glycemic index.'],
  ['corn syrup',            'moderate', 'Processed corn-based sugar. Spikes blood glucose.'],
  ['glucose syrup',         'moderate', 'Concentrated liquid sugar from starch.'],
  ['invert sugar',          'moderate', 'Processed sugar used for smoother texture.'],
  ['modified starch',       'moderate', 'Chemically or physically altered starch.'],
  ['modified food starch',  'moderate', 'Starch treated with chemicals for stability.'],
  ['soy lecithin',          'moderate', 'Common emulsifier. Usually safe but often from GMO soy.'],
  ['sodium caseinate',      'moderate', 'Milk-derived protein. Not suitable for dairy-sensitive.'],
  ['whey protein concentrate', 'moderate', 'Dairy-derived protein powder. Allergen concern.'],
  ['malt extract',          'moderate', 'Sweetening agent from grains. Contains gluten.'],
  ['caramel color',         'moderate', 'Processed coloring. Some types may contain 4-MEI.'],
  ['caramel colour',        'moderate', 'Processed coloring. Some types may contain 4-MEI.'],
  ['silicon dioxide',       'moderate', 'Anti-caking agent. Safe but ultra-processed indicator.'],
  ['titanium dioxide',      'moderate', 'White colorant. Banned in some countries due to nano concerns.'],
  ['phosphoric acid',       'moderate', 'Acidifier in colas. May weaken bones over time.'],
  ['sodium phosphate',      'moderate', 'Preservative. Excess phosphates can strain kidneys.'],
  ['xanthan gum',           'moderate', 'Thickener. Safe for most, but can cause bloating.'],
  ['guar gum',              'moderate', 'Thickener from guar beans. Safe in small amounts.'],
  ['sodium metabisulphite', 'moderate', 'Preservative. Can trigger asthma in sensitive people.'],
  ['sulphur dioxide',       'moderate', 'Preservative. Can trigger allergic reactions.'],
  ['potassium sorbate',     'moderate', 'Common preservative. Safe for most.'],
  ['calcium propionate',    'moderate', 'Bread preservative. May cause irritability in children.'],
  ['sodium benzoate',       'moderate', 'Common preservative in acidic foods.'],

  // ── MILD (Yellow) ───────────────────────────────────────────────
  ['sugar',                 'mild', 'Added sweetener. Excess consumption leads to weight gain.'],
  ['cane sugar',            'mild', 'Refined cane sweetener. Use in moderation.'],
  ['starch',                'mild', 'Processed carbohydrate used as thickener.'],
  ['corn starch',           'mild', 'Refined starch from corn. Raises blood sugar quickly.'],
  ['wheat flour',           'mild', 'Refined flour. Less fiber than whole wheat.'],
  ['refined wheat flour',   'mild', 'White flour stripped of bran and germ.'],
  ['skim milk powder',      'mild', 'Processed dairy. Low fat but heavily processed.'],
  ['milk solids',           'mild', 'Dried dairy components. Contains lactose.'],
  ['edible salt',           'mild', 'Sodium chloride. Excess raises blood pressure.'],
  ['salt',                  'mild', 'Excess sodium can raise blood pressure.'],
  ['yeast extract',         'mild', 'Flavor enhancer containing natural glutamates.'],
  ['natural flavo',         'mild', 'Extracted from natural sources but still processed.'],
  ['pectin',                'mild', 'Natural thickener from fruit. Safe but processed.'],
  ['gelatin',               'mild', 'Animal-derived protein. Not vegetarian/vegan.'],
  ['acidity regulator',     'mild', 'Controls pH level of food. Industrial additive.'],
  ['emulsifier',            'mild', 'Helps mix oil and water. Common in ultra-processed food.'],
  ['stabilizer',            'mild', 'Maintains food texture. Indicator of industrial processing.'],
  ['thickener',             'mild', 'Adds viscosity to food. Usually plant-based but processed.'],
  ['raising agent',         'mild', 'Makes dough rise. Typically baking soda or chemical.'],
  ['anti-caking agent',     'mild', 'Prevents clumping. Usually mineral-based.'],
  ['preservative',          'moderate', 'Extends shelf life. Safety varies; moderation recommended.'],
  ['lecithin',              'moderate', 'Common emulsifier. Marker of industrial food.'],
  ['flavoring',             'moderate', 'Chemical flavoring agents to enhance taste.'],
  ['flavouring',            'moderate', 'Chemical flavoring agents to enhance taste.'],
  ['humectant',             'moderate', 'Keeps food moist using industrial chemicals.'],

  // ── SAFE (Green) ────────────────────────────────────────────────
  ['water',                 'safe', 'Essential for life. No health concerns.'],
  ['whole wheat',           'safe', 'Whole grain with natural fiber and nutrients.'],
  ['whole grain',           'safe', 'Unrefined grain retaining bran, germ, and endosperm.'],
  ['oats',                  'safe', 'Whole grain rich in fiber and heart-healthy.'],
  ['rice',                  'safe', 'Staple grain. Provides energy and some nutrients.'],
  ['lentil',                'safe', 'Protein-rich legume with fiber and iron.'],
  ['chickpea',              'safe', 'Nutritious legume. High in protein and fiber.'],
  ['turmeric',              'safe', 'Anti-inflammatory spice with curcumin.'],
  ['cumin',                 'safe', 'Spice that aids digestion. Rich in iron.'],
  ['coriander',             'safe', 'Herb with antioxidant properties.'],
  ['black pepper',          'safe', 'Spice that enhances nutrient absorption.'],
  ['ginger',                'safe', 'Root with anti-nausea and anti-inflammatory properties.'],
  ['garlic',                'safe', 'Natural antimicrobial with heart benefits.'],
  ['onion',                 'safe', 'Vegetable rich in antioxidants and fiber.'],
  ['tomato',                'safe', 'Rich in lycopene, a powerful antioxidant.'],
  ['spinach',               'safe', 'Leafy green packed with iron and vitamins.'],
  ['carrot',                'safe', 'Root vegetable rich in Vitamin A (beta-carotene).'],
  ['potato',                'safe', 'Starchy vegetable. Good source of potassium.'],
  ['pea',                   'safe', 'Green legume rich in protein and fiber.'],
  ['coconut',               'safe', 'Contains healthy MCT fats. Natural food.'],
  ['olive oil',             'safe', 'Heart-healthy monounsaturated fat.'],
  ['mustard oil',           'safe', 'Traditional Indian cooking oil. Contains omega-3.'],
  ['groundnut oil',         'safe', 'Peanut oil with heart-healthy fats.'],
  ['sesame',                'safe', 'Seed rich in calcium and antioxidants.'],
  ['flaxseed',              'safe', 'Omega-3 rich seed. Excellent for heart health.'],
  ['almond',                'safe', 'Nut rich in vitamin E and healthy fats.'],
  ['cashew',                'safe', 'Nut with magnesium and healthy fats.'],
  ['walnut',                'safe', 'Omega-3 rich nut. Supports brain health.'],
  ['milk',                  'safe', 'Dairy. Good source of calcium and protein.'],
  ['curd',                  'safe', 'Fermented dairy with probiotics.'],
  ['yogurt',                'safe', 'Fermented milk with gut-friendly bacteria.'],
  ['egg',                   'safe', 'Complete protein source with essential nutrients.'],
  ['lemon',                 'safe', 'Citrus fruit rich in Vitamin C.'],
  ['lime',                  'safe', 'Citrus fruit with Vitamin C and antioxidants.'],
  ['mango',                 'safe', 'Tropical fruit rich in Vitamin A and C.'],
  ['banana',                'safe', 'Fruit high in potassium and natural energy.'],
  ['apple',                 'safe', 'Fruit with fiber and antioxidants.'],
  ['vitamin',               'safe', 'Essential micronutrient added for fortification.'],
  ['mineral',               'safe', 'Essential micronutrient for body functions.'],
  ['iron',                  'safe', 'Essential mineral for blood health.'],
  ['calcium',               'safe', 'Essential mineral for bones and teeth.'],
  ['folic acid',            'safe', 'B-vitamin important for cell growth.'],
  ['niacin',                'safe', 'Vitamin B3. Supports metabolism.'],
  ['thiamin',               'safe', 'Vitamin B1. Supports nerve function.'],
  ['riboflavin',            'safe', 'Vitamin B2. Helps energy production.'],
  ['ascorbic acid',         'safe', 'Vitamin C. Antioxidant and immune booster.'],
  ['citric acid',           'safe', 'Natural acid from citrus fruits. Very safe.'],
  ['lactic acid',           'safe', 'Natural acid from fermentation. Aids preservation.'],
  ['baking soda',           'safe', 'Sodium bicarbonate. Traditional raising agent.'],
  ['vinegar',               'safe', 'Fermented liquid. Aids digestion.'],
  ['cocoa',                 'safe', 'Rich in antioxidants. Natural flavoring.'],
  ['saffron',               'safe', 'Precious spice with antioxidant properties.'],
  ['cardamom',              'safe', 'Aromatic spice that aids digestion.'],
  ['cinnamon',              'safe', 'Spice with anti-inflammatory properties.'],
  ['clove',                 'safe', 'Spice with antimicrobial properties.'],
  ['fennel',                'safe', 'Seed that aids digestion and freshens breath.'],
  ['basil',                 'safe', 'Herb with anti-inflammatory properties.'],
  ['oregano',               'safe', 'Herb rich in antioxidants.'],
  ['rosemary',              'safe', 'Herb with memory-boosting compounds.'],
  ['green tea',             'safe', 'Rich in catechins and antioxidants.'],
  ['jaggery powder',        'safe', 'Traditional unrefined sweetener with minerals.'],
  ['ragi',                  'safe', 'Finger millet. High in calcium and fiber.'],
  ['bajra',                 'safe', 'Pearl millet. Gluten-free and nutritious.'],
  ['jowar',                 'safe', 'Sorghum. Gluten-free whole grain.'],
  ['besan',                 'safe', 'Chickpea flour. High in protein.'],
];

// ─── Classification Engine ─────────────────────────────────────────

/**
 * Classify a single ingredient string into a risk tier.
 * Returns the risk info, or a default 'safe' if nothing matches.
 */
export function classifyIngredient(ingredient: string): IngredientRiskInfo {
  const lower = ingredient.toLowerCase().trim();

  // Skip obvious non-ingredient strings
  if (lower.length < 2 || lower.startsWith('(') || /^\d+[%gm]/.test(lower)) {
    return { level: 'safe', explanation: '' };
  }

  // Check against the database — first match wins, so the DB is ordered
  // from most severe to least severe
  for (const [keyword, level, explanation] of RISK_DB) {
    if (lower.includes(keyword)) {
      return { level, explanation };
    }
  }

  // Heuristic fallbacks for patterns not in the DB
  if (/^e\d{3,4}[a-z]?$/i.test(lower)) {
    return { level: 'moderate', explanation: 'Food additive (E-number). Check specific code for details.' };
  }
  if (/^ins\s?\d{3,4}/i.test(lower)) {
    return { level: 'moderate', explanation: 'INS-coded food additive. Refer to specific number.' };
  }
  if (/sodium|potassium|calcium\s+\w+ate/i.test(lower) && lower.length > 10) {
    return { level: 'mild', explanation: 'Chemical compound used as a food additive.' };
  }

  // Default — unrecognized ingredients are neutral
  return { level: 'safe', explanation: '' };
}

// ─── Color & Style Helpers ─────────────────────────────────────────

/** Tailwind classes for the ingredient chip background + border */
export function getRiskChipClasses(level: IngredientRiskLevel): string {
  switch (level) {
    case 'hazardous':
      return 'bg-purple-500/15 border-purple-500/40 text-purple-300';
    case 'harmful':
      return 'bg-red-500/15 border-red-500/40 text-red-300';
    case 'moderate':
      return 'bg-orange-500/15 border-orange-500/40 text-orange-300';
    case 'mild':
      return 'bg-yellow-500/15 border-yellow-500/40 text-yellow-300';
    case 'safe':
    default:
      return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300';
  }
}

/** Small colored dot for the risk level */
export function getRiskDotColor(level: IngredientRiskLevel): string {
  switch (level) {
    case 'hazardous': return 'bg-purple-400';
    case 'harmful':   return 'bg-red-400';
    case 'moderate':  return 'bg-orange-400';
    case 'mild':      return 'bg-yellow-400';
    case 'safe':
    default:          return 'bg-emerald-400';
  }
}

/** Additive hazard level → 5-tier color mapping for the badge */
export function getAdditiveCardBorder(hazard: string): string {
  switch (hazard) {
    case 'hazardous': return 'border-l-purple-500';
    case 'caution':   return 'border-l-orange-400';
    case 'safe':
    default:          return 'border-l-emerald-400';
  }
}

export function getAdditiveBadgeClasses(hazard: string): string {
  switch (hazard) {
    case 'hazardous':
      return 'bg-purple-500/20 text-purple-300';
    case 'caution':
      return 'bg-orange-500/20 text-orange-300';
    case 'safe':
    default:
      return 'bg-emerald-500/20 text-emerald-300';
  }
}
