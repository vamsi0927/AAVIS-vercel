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

export type IngredientRiskLevel = 'safe' | 'mild' | 'moderate' | 'caution' | 'harmful' | 'hazardous';

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
  ['titanium dioxide',      'hazardous', 'White colorant. Banned in EU since 2022 due to genotoxicity concerns.'],
  ['sodium nitrite',        'hazardous', 'Preservative in processed meats. Forms carcinogenic nitrosamines.'],
  ['sodium nitrate',        'hazardous', 'Preservative. May form cancer-causing compounds when heated.'],
  ['partially hydrogenated', 'hazardous', 'Contains trans fats. Increases heart disease risk.'],
  ['trans fat',             'hazardous', 'Artificial fat that clogs arteries. Avoid completely.'],

  // ── HARMFUL (Red) ────────────────────────────────────────────────
  ['high fructose corn syrup', 'harmful', 'Highly processed sweetener linked to obesity and diabetes.'],
  ['hfcs',                  'harmful', 'Highly processed corn-based sweetener.'],
  ['bht',                   'harmful', 'Synthetic antioxidant related to BHA. Potential endocrine disruptor.'],
  ['acesulfame',            'harmful', 'Artificial sweetener with limited long-term safety data.'],
  ['artificial flavo',      'harmful', 'Lab-made chemicals that mimic natural taste.'],
  ['artificial colour',     'harmful', 'Synthetic dye with no nutritional value.'],
  ['artificial color',      'harmful', 'Synthetic dye with no nutritional value.'],
  ['sodium erythorbate',    'harmful', 'Chemical preservative used in processed meats.'],
  ['tbhq',                  'harmful', 'Synthetic petroleum-derived antioxidant (TBHQ). Linked to liver damage and immune disruption in studies.'],
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
  ['phosphoric acid',       'moderate', 'Acidifier in colas. May weaken bones over time.'],
  ['sodium phosphate',      'moderate', 'Preservative. Excess phosphates can strain kidneys.'],
  ['xanthan gum',           'moderate', 'Thickener. Safe for most, but can cause bloating.'],
  ['guar gum',              'moderate', 'Thickener from guar beans. Safe in small amounts.'],
  ['sodium metabisulphite', 'moderate', 'Preservative. Can trigger asthma in sensitive people.'],
  ['sulphur dioxide',       'moderate', 'Preservative. Can trigger allergic reactions.'],
  ['potassium sorbate',     'moderate', 'Common preservative. Safe for most.'],
  ['calcium propionate',    'moderate', 'Bread preservative. May cause irritability in children.'],

  // ── MILD (Yellow) ───────────────────────────────────────────────
  ['monosodium glutamate',  'mild', 'Flavor enhancer (MSG). Safe for most, but adds to sodium load.'],
  ['msg',                   'mild', 'Flavor enhancer (MSG). Safe for most, but adds to sodium load.'],
  ['disodium guanylate',    'mild', 'Flavor enhancer. Avoid with gout. Indicates heavy flavor engineering.'],
  ['disodium inosinate',    'mild', 'Flavor enhancer. Avoid with gout. Often animal-derived.'],
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

// Map of known high-risk E-codes for quick lookup
const HIGH_RISK_E_CODES: Record<string, [IngredientRiskLevel, string]> = {
  'e102': ['hazardous', 'Tartrazine — synthetic dye linked to hyperactivity in children.'],
  'e104': ['harmful',   'Quinoline Yellow — synthetic dye. Banned in US and Australia.'],
  'e110': ['hazardous', 'Sunset Yellow — synthetic dye linked to hyperactivity.'],
  'e120': ['harmful',   'Carmine — insect-derived dye. Risk of severe allergic reaction.'],
  'e122': ['hazardous', 'Carmoisine — synthetic azo dye. Banned in some countries.'],
  'e124': ['hazardous', 'Ponceau 4R — synthetic dye. Banned in US.'],
  'e129': ['hazardous', 'Allura Red — synthetic dye linked to hyperactivity.'],
  'e133': ['harmful',   'Brilliant Blue — synthetic dye. Banned in some countries.'],
  'e150d':['harmful',   'Sulphite Ammonia Caramel — may contain 4-MEI, linked to cancer in animals.'],
  'e171': ['hazardous', 'Titanium Dioxide — banned in EU since 2022. Potential genotoxicity.'],
  'e210': ['hazardous', 'Benzoic Acid — forms benzene with Vitamin C. Carcinogen risk.'],
  'e211': ['hazardous', 'Sodium Benzoate — forms benzene with Vitamin C. ADHD risk in children.'],
  'e202': ['moderate',  'Potassium Sorbate — preservative. Safe for most but an industrial additive.'],
  'e212': ['hazardous', 'Potassium Benzoate — same benzene-formation risk as E211.'],
  'e220': ['moderate',  'Sulphur Dioxide — preservative. Can trigger asthma in sensitive people.'],
  'e223': ['moderate',  'Sodium Metabisulphite — preservative. Can trigger asthma in sensitive people.'],
  'e250': ['hazardous', 'Sodium Nitrite — forms carcinogenic nitrosamines. IARC Group 1.'],
  'e251': ['hazardous', 'Sodium Nitrate — converts to nitrite in body. Cancer risk.'],
  'e282': ['moderate',  'Calcium Propionate — bread preservative. Linked to irritability in children.'],
  'e319': ['harmful',   'TBHQ — petroleum-derived synthetic antioxidant. Linked to liver damage.'],
  'e320': ['hazardous', 'BHA — possible carcinogen (IARC 2B). Tumor-promoting in animal studies.'],
  'e321': ['harmful',   'BHT — controversial synthetic antioxidant. Potential endocrine disruptor.'],
  'e322': ['moderate',  'Lecithin — emulsifier. Common marker of industrial food.'],
  'e407': ['harmful',   'Carrageenan — may cause gut inflammation. Concern for IBS/Crohn\'s.'],
  'e433': ['harmful',   'Polysorbate 80 — disrupts gut microbiome in studies.'],
  'e466': ['harmful',   'CMC — chemically modified cellulose. Disrupts gut microbiome.'],
  'e471': ['mild',      'Mono- and Diglycerides — industrial emulsifier. May be animal-derived.'],
  'e621': ['mild',      'MSG — flavor enhancer. Safe for most, but adds to sodium load.'],
  'e627': ['mild',      'Disodium Guanylate — avoid with gout. Indicates heavy flavor engineering.'],
  'e631': ['mild',      'Disodium Inosinate — avoid with gout. Often animal-derived.'],
  'e950': ['harmful',   'Acesulfame K — artificial sweetener. Limited long-term safety data.'],
  'e951': ['hazardous', 'Aspartame — IARC Group 2B possible carcinogen. Avoid with PKU.'],
  'e954': ['harmful',   'Saccharin — oldest artificial sweetener. Controversial safety history.'],
  'e955': ['harmful',   'Sucralose — may disrupt gut microbiome with regular use.'],
};

/**
 * Classify a single ingredient string into a risk tier.
 * Handles:
 *  - Direct keyword matches from RISK_DB (e.g. "tbhq", "palm oil")
 *  - E-number codes embedded anywhere in the string (e.g. "Antioxidant (E319-TBHQ)")
 *  - Bare E-code strings (e.g. "E211", "INS 621")
 *  - Generic chemical compound heuristics
 */
export function classifyIngredient(ingredient: string): IngredientRiskInfo {
  const lower = ingredient.toLowerCase().trim();

  // Skip obvious non-ingredient strings
  if (lower.length < 2 || lower.startsWith('(') || /^\d+[%gm]/.test(lower)) {
    return { level: 'safe', explanation: '' };
  }

  // ── Step 1: Extract any E-number mentioned anywhere in the string ──
  // Matches patterns like E319, E319-TBHQ, INS 319, (E319), E319a etc.
  const eCodeMatches = lower.match(/\be(\d{3,4}[a-z]?)\b|\bins\s?(\d{3,4})\b/gi);
  if (eCodeMatches) {
    for (const match of eCodeMatches) {
      // Normalise to e-number format: strip 'ins', spaces
      const normalised = match.replace(/^ins\s?/i, 'e').replace(/\s/g, '').toLowerCase();
      const hit = HIGH_RISK_E_CODES[normalised];
      if (hit) return { level: hit[0], explanation: hit[1] };
    }
    // Unknown E-number — flag as moderate, not safe
    return { level: 'moderate', explanation: 'Food additive (E-number). Specific risk level unknown — exercise caution.' };
  }

  // ── Step 2: Keyword database scan (most severe → least severe) ──
  for (const [keyword, level, explanation] of RISK_DB) {
    if (lower.includes(keyword)) {
      return { level, explanation };
    }
  }

  // ── Step 3: Generic chemical compound heuristics ──
  if (/sodium|potassium|calcium\s+\w+ate/i.test(lower) && lower.length > 10) {
    return { level: 'mild', explanation: 'Chemical salt used as a food additive.' };
  }

  // Default — genuinely unrecognized, assume neutral
  return { level: 'safe', explanation: '' };
}

// ─── Color & Style Helpers ─────────────────────────────────────────
//
// Colour logic (traffic-light extended to 5 levels):
//   hazardous → deep crimson red   (avoid entirely)
//   harmful   → rose/orange-red    (significant risk)
//   moderate  → amber              (notable concern, limit)
//   mild      → yellow             (minor concern)
//   safe      → emerald green      (clean ingredient)

/** Tailwind classes for the ingredient chip background + border */
export function getRiskChipClasses(level: IngredientRiskLevel): string {
  switch (level) {
    case 'hazardous':
      return 'bg-red-600/20 border-red-500/50 text-red-300';
    case 'harmful':
      return 'bg-rose-500/20 border-rose-400/50 text-rose-300';
    case 'caution':
    case 'moderate':
      return 'bg-amber-500/15 border-amber-400/40 text-amber-300';
    case 'mild':
      return 'bg-yellow-400/10 border-yellow-400/35 text-yellow-300';
    case 'safe':
    default:
      return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300';
  }
}

/** Small colored dot for the risk level */
export function getRiskDotColor(level: IngredientRiskLevel): string {
  switch (level) {
    case 'hazardous': return 'bg-red-500';
    case 'harmful':   return 'bg-rose-400';
    case 'caution':
    case 'moderate':  return 'bg-amber-400';
    case 'mild':      return 'bg-yellow-400';
    case 'safe':
    default:          return 'bg-emerald-400';
  }
}

/** Additive hazard level → color mapping for the left border */
export function getAdditiveCardBorder(hazard: string): string {
  switch (hazard) {
    case 'hazardous': return 'border-l-red-500';      // Deep Crimson
    case 'harmful':   return 'border-l-rose-400';     // Rose/Orange-Red (Harmful)
    case 'caution':
    case 'moderate':  return 'border-l-amber-400';    // Amber (Caution)
    case 'mild':      return 'border-l-yellow-400';   // Yellow (Mild)
    case 'safe':      return 'border-l-emerald-400';  // Emerald/Green (Safe)
    default:          return 'border-l-amber-400';
  }
}

export function getAdditiveBadgeClasses(hazard: string): string {
  switch (hazard) {
    case 'hazardous':
      return 'bg-red-600/20 border-red-500/50 text-red-300 border';
    case 'harmful':
      return 'bg-rose-500/20 border-rose-400/50 text-rose-300 border';
    case 'caution':
    case 'moderate':
      return 'bg-amber-500/15 border-amber-400/40 text-amber-300 border';
    case 'mild':
      return 'bg-yellow-400/10 border-yellow-400/35 text-yellow-300 border';
    case 'safe':
      return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 border';
    default:
      return 'bg-amber-500/15 border-amber-400/40 text-amber-300 border';
  }
}
