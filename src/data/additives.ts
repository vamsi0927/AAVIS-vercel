import { Additive } from '../lib/types';

/**
 * Aavis Additives Database — v2
 *
 * hazard levels reflect real scientific risk assessments:
 *  "hazardous"  → High Risk  (avoid — carcinogens, banned in other countries, strong evidence of harm)
 *  "caution"    → Caution    (controversial, processed, may affect sensitive groups)
 *  "moderate"   → Moderate   (legally permitted, processed, limited long-term data)
 *  "safe"       → Safe       (natural, well-studied, beneficial or neutral)
 *
 * NOTE: "legally permitted" ≠ "safe". E319 (TBHQ) and similar are permitted at low doses
 * but carry meaningful health concerns and must NOT be shown in green.
 */
export const ADDITIVES_DB: Record<string, Additive> = {

  // ─── Colorants ────────────────────────────────────────────────────────────
  E102: {
    code: 'E102', name: 'Tartrazine', category: 'Artificial Color', hazard: 'hazardous',
    description: 'Synthetic yellow azo dye.',
    function: 'Gives foods a bright yellow/lemon color.',
    healthExplanation: 'Strongly linked to hyperactivity and behavioral changes in children (ADHD). Banned in Norway and Austria. Requires warning label in EU.'
  },
  E104: {
    code: 'E104', name: 'Quinoline Yellow', category: 'Artificial Color', hazard: 'caution',
    description: 'Synthetic yellow dye.',
    function: 'Yellow colorant used in confectionery and drinks.',
    healthExplanation: 'Requires a hyperactivity warning label in the EU. Banned in the USA and Australia.'
  },
  E110: {
    code: 'E110', name: 'Sunset Yellow', category: 'Artificial Color', hazard: 'hazardous',
    description: 'Synthetic orange-yellow azo dye.',
    function: 'Orange/yellow colorant used in snacks and drinks.',
    healthExplanation: 'Linked to hyperactivity in children. Requires EU warning label. Banned in Norway and Finland.'
  },
  E120: {
    code: 'E120', name: 'Carmine (Cochineal)', category: 'Natural Color', hazard: 'caution',
    description: 'Red dye from crushed cochineal insects.',
    function: 'Natural red colorant in sweets, yogurts, and beverages.',
    healthExplanation: 'Generally safe but can cause severe allergic reactions in some individuals. Not suitable for vegans or vegetarians.'
  },
  E129: {
    code: 'E129', name: 'Allura Red AC', category: 'Artificial Color', hazard: 'hazardous',
    description: 'Synthetic red azo dye.',
    function: 'Red colorant in candy, sauces, and drinks.',
    healthExplanation: 'Linked to hyperactivity in children. Requires EU warning label. Banned in several countries.'
  },
  E133: {
    code: 'E133', name: 'Brilliant Blue FCF', category: 'Artificial Color', hazard: 'caution',
    description: 'Synthetic blue dye.',
    function: 'Blue colorant in confectionery and beverages.',
    healthExplanation: 'Generally considered lower risk among synthetic dyes but still an unnecessary industrial colorant. Banned in several countries.'
  },
  E150d: {
    code: 'E150d', name: 'Sulphite Ammonia Caramel', category: 'Color', hazard: 'caution',
    description: 'Brown colorant processed with ammonia and sulphites.',
    function: 'Most common caramel color used in colas and soy sauce.',
    healthExplanation: 'May contain 4-MEI, a compound linked to cancer in animal studies. The "natural brown" appearance can be misleading.'
  },
  E160a: {
    code: 'E160a', name: 'Beta-Carotene', category: 'Natural Color', hazard: 'safe',
    description: 'Natural orange/yellow pigment from plants.',
    function: 'Colorant that the body converts into Vitamin A.',
    healthExplanation: 'Very safe and nutritionally beneficial as a pro-vitamin A. One of the safest food colorants.'
  },
  E171: {
    code: 'E171', name: 'Titanium Dioxide', category: 'Color', hazard: 'hazardous',
    description: 'White mineral pigment used in food coatings.',
    function: 'Provides opacity and bright white color.',
    healthExplanation: 'Banned as a food additive in the European Union since 2022 due to concerns about potential genotoxicity (DNA damage). Still permitted in some countries at low doses.'
  },

  // ─── Preservatives ───────────────────────────────────────────────────────
  E210: {
    code: 'E210', name: 'Benzoic Acid', category: 'Preservative', hazard: 'hazardous',
    description: 'Synthetic organic acid used as preservative.',
    function: 'Prevents mold and bacterial growth in acidic foods.',
    healthExplanation: 'Can react with Vitamin C to form benzene, a known carcinogen. May trigger asthma and hives in sensitive individuals.'
  },
  E211: {
    code: 'E211', name: 'Sodium Benzoate', category: 'Preservative', hazard: 'hazardous',
    description: 'Salt form of benzoic acid — very common synthetic preservative.',
    function: 'Preserves acidic foods, sodas, and sauces.',
    healthExplanation: 'Forms benzene (carcinogen) when combined with Vitamin C. Linked to ADHD in children. Should be avoided in products also containing ascorbic acid.'
  },
  E212: {
    code: 'E212', name: 'Potassium Benzoate', category: 'Preservative', hazard: 'hazardous',
    description: 'Potassium salt of benzoic acid.',
    function: 'Antimicrobial preservative in beverages and foods.',
    healthExplanation: 'Same benzene-formation risk as Sodium Benzoate (E211) when combined with Vitamin C.'
  },
  E250: {
    code: 'E250', name: 'Sodium Nitrite', category: 'Preservative', hazard: 'hazardous',
    description: 'Curing salt used in processed meats.',
    function: 'Prevents botulism and preserves pink color in cured meats.',
    healthExplanation: 'Can form carcinogenic nitrosamines when heated. IARC classifies processed meats containing nitrites as Group 1 carcinogen (causes cancer). Limit processed meat consumption.'
  },
  E251: {
    code: 'E251', name: 'Sodium Nitrate', category: 'Preservative', hazard: 'hazardous',
    description: 'Naturally occurring mineral used as meat curing agent.',
    function: 'Converts to nitrite in the body to preserve meats.',
    healthExplanation: 'Converts to sodium nitrite in the body — carries the same cancer risk from nitrosamine formation.'
  },
  E300: {
    code: 'E300', name: 'Ascorbic Acid (Vitamin C)', category: 'Antioxidant', hazard: 'safe',
    description: 'Natural Vitamin C.',
    function: 'Prevents browning and acts as a natural antioxidant.',
    healthExplanation: 'Essential micronutrient. Completely safe and beneficial at food-grade levels.'
  },
  E319: {
    code: 'E319', name: 'TBHQ (Tert-Butylhydroquinone)', category: 'Synthetic Antioxidant', hazard: 'caution',
    description: 'Synthetic petroleum-derived antioxidant preservative.',
    function: 'Extends shelf life of oils and fried foods by preventing rancidity.',
    healthExplanation: 'TBHQ is derived from butane (a petroleum product). Studies show it may cause liver damage, impair immune response, and potentially promote certain cancers at higher doses. It is not a natural compound — it is an industrial chemical added to extend product shelf life. Legal at low doses but clearly not "safe" in the nutritional sense.'
  },
  E320: {
    code: 'E320', name: 'BHA (Butylated Hydroxyanisole)', category: 'Synthetic Antioxidant', hazard: 'hazardous',
    description: 'Synthetic antioxidant preservative.',
    function: 'Prevents fats and oils from going rancid.',
    healthExplanation: 'Classified as a possible carcinogen (IARC Group 2B). Has shown tumor-promoting effects in animal studies. The US National Toxicology Program lists it as "reasonably anticipated to be a human carcinogen".'
  },
  E321: {
    code: 'E321', name: 'BHT (Butylated Hydroxytoluene)', category: 'Synthetic Antioxidant', hazard: 'caution',
    description: 'Synthetic antioxidant related to BHA.',
    function: 'Preserves fats from oxidation in processed foods.',
    healthExplanation: 'Controversial — some studies suggest endocrine disruption and tumor promotion in animals. Not banned, but listed as a substance of concern. Best avoided in daily diet.'
  },
  E202: {
    code: 'E202', name: 'Potassium Sorbate', category: 'Preservative', hazard: 'moderate',
    description: 'Salt of sorbic acid. Very common preservative.',
    function: 'Inhibits mold and yeast growth in foods.',
    healthExplanation: 'One of the safer synthetic preservatives. Generally well tolerated, but still an industrial additive. Can cause mild skin irritation in sensitive individuals.'
  },
  E282: {
    code: 'E282', name: 'Calcium Propionate', category: 'Preservative', hazard: 'moderate',
    description: 'Mold inhibitor common in commercial bread.',
    function: 'Extends shelf life of baked goods.',
    healthExplanation: 'Legal and widely used. Some studies link it to irritability and sleep disturbances in children with heavy bread consumption. An indicator of heavily processed bread.'
  },

  // ─── Antioxidants ────────────────────────────────────────────────────────
  E322: {
    code: 'E322', name: 'Lecithin', category: 'Emulsifier', hazard: 'moderate',
    description: 'Natural fat-like substance, often from soy or sunflower.',
    function: 'Keeps chocolate smooth and prevents oil/water separation.',
    healthExplanation: 'Generally safe and natural. However, soy lecithin is usually from GMO soy and is an indicator of industrial food manufacturing. Sunflower lecithin is preferred.'
  },
  E330: {
    code: 'E330', name: 'Citric Acid', category: 'Acidity Regulator', hazard: 'safe',
    description: 'Acid found naturally in citrus fruits.',
    function: 'Adds sourness and acts as a natural preservative.',
    healthExplanation: 'Very safe and found naturally in lemons and oranges. Widely consumed and well-tolerated.'
  },

  // ─── Emulsifiers ─────────────────────────────────────────────────────────
  E407: {
    code: 'E407', name: 'Carrageenan', category: 'Thickener / Emulsifier', hazard: 'caution',
    description: 'Seaweed-derived thickener and stabilizer.',
    function: 'Thickens dairy products, plant milks, and deli meats.',
    healthExplanation: 'Associated with gut inflammation and may worsen IBS and Crohn\'s disease symptoms. Despite being "natural" in origin, it has significant GI concerns. Degraded carrageenan is classified as a possible carcinogen.'
  },
  E433: {
    code: 'E433', name: 'Polysorbate 80', category: 'Emulsifier', hazard: 'caution',
    description: 'Synthetic emulsifier derived from sorbitol and fatty acids.',
    function: 'Keeps oil and water mixed in ice cream, sauces, and cosmetics.',
    healthExplanation: 'Studies in mice show polysorbate 80 disrupts gut microbiome and may promote metabolic syndrome and inflammatory bowel disease. A strong marker of ultra-processed foods.'
  },
  E440: {
    code: 'E440', name: 'Pectins', category: 'Thickener', hazard: 'safe',
    description: 'Natural fiber from fruit cell walls.',
    function: 'Thickens jams, jellies, and some dairy products.',
    healthExplanation: 'A natural soluble fiber. Safe, and actually beneficial — may help lower cholesterol and improve gut health.'
  },
  E466: {
    code: 'E466', name: 'Carboxymethyl Cellulose (CMC)', category: 'Emulsifier', hazard: 'caution',
    description: 'Chemically modified cellulose used as a stabilizer.',
    function: 'Thickens and stabilizes processed foods.',
    healthExplanation: 'Animal studies show CMC can disrupt gut microbiome and promote inflammation. A clear marker of ultra-processed industrial food.'
  },
  E471: {
    code: 'E471', name: 'Mono- and Diglycerides', category: 'Emulsifier', hazard: 'mild',
    description: 'Fats derived from plant or animal sources.',
    function: 'Keeps bread soft, prevents oil separation.',
    healthExplanation: 'Generally considered safe at food levels but can be derived from animal fat (concern for vegans). Also an indicator of industrial food processing.'
  },
  E500: {
    code: 'E500', name: 'Sodium Carbonates (Baking Soda)', category: 'Raising Agent', hazard: 'safe',
    description: 'Traditional baking soda used for centuries.',
    function: 'Helps dough rise; regulates acidity.',
    healthExplanation: 'Very safe mineral. A traditional ingredient used in home and commercial baking with no meaningful health concerns at food-grade levels.'
  },

  // ─── Flavor enhancers ────────────────────────────────────────────────────
  E621: {
    code: 'E621', name: 'Monosodium Glutamate (MSG)', category: 'Flavor Enhancer', hazard: 'mild',
    description: 'Sodium salt of glutamic acid — the umami enhancer.',
    function: 'Intensifies savory flavor in snacks, instant noodles, and seasonings.',
    healthExplanation: 'Officially recognized as safe by major health bodies. However, some people report sensitivity (headaches, flushing). High MSG intake also contributes to sodium load. Naturally found in foods like tomatoes and parmesan in smaller amounts.'
  },
  E627: {
    code: 'E627', name: 'Disodium Guanylate', category: 'Flavor Enhancer', hazard: 'mild',
    description: 'Nucleotide-based flavor enhancer.',
    function: 'Synergistically boosts MSG potency in processed foods.',
    healthExplanation: 'Should be avoided by people with gout or high uric acid. Always used alongside MSG, indicating highly engineered flavor profiles.'
  },
  E631: {
    code: 'E631', name: 'Disodium Inosinate', category: 'Flavor Enhancer', hazard: 'mild',
    description: 'Nucleotide-based flavor enhancer from meat or fish.',
    function: 'Used with MSG to enhance umami taste.',
    healthExplanation: 'Not suitable for vegetarians (often animal-derived). Should be avoided with gout. A clear indicator of heavy flavor engineering in processed foods.'
  },

  // ─── Sweeteners ──────────────────────────────────────────────────────────
  E950: {
    code: 'E950', name: 'Acesulfame Potassium (Ace-K)', category: 'Artificial Sweetener', hazard: 'caution',
    description: 'Zero-calorie artificial sweetener.',
    function: 'Sweetens "diet" and "sugar-free" products.',
    healthExplanation: 'Limited long-term safety data. Some studies suggest it may disrupt gut microbiome and affect insulin response. Often combined with other artificial sweeteners to mask its bitter taste.'
  },
  E951: {
    code: 'E951', name: 'Aspartame', category: 'Artificial Sweetener', hazard: 'hazardous',
    description: 'Widely used artificial sweetener (200× sweeter than sugar).',
    function: 'Sweetener in diet sodas, sugar-free gums, and "zero calorie" products.',
    healthExplanation: 'Classified as "possibly carcinogenic" (IARC Group 2B) as of 2023. MUST be avoided by people with phenylketonuria (PKU). Highly controversial with ongoing scientific debate about long-term safety.'
  },
  E954: {
    code: 'E954', name: 'Saccharin', category: 'Artificial Sweetener', hazard: 'caution',
    description: 'Oldest artificial sweetener. Extremely sweet, often bitter.',
    function: 'Zero-calorie sweetener in diet products.',
    healthExplanation: 'Was previously listed as a potential carcinogen based on animal studies. Later delisted after human studies. Still controversial. Bitter aftertaste indicates its synthetic nature.'
  },
  E955: {
    code: 'E955', name: 'Sucralose (Splenda)', category: 'Artificial Sweetener', hazard: 'caution',
    description: 'Chlorinated derivative of sucrose — 600× sweeter than sugar.',
    function: 'Sweetens diet foods and beverages.',
    healthExplanation: 'May disrupt gut microbiome with regular use. Recent studies raise concerns about metabolism of its breakdown products. Not recommended for people with compromised gut health.'
  },
};