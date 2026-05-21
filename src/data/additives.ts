import { Additive } from '../lib/types';

export const ADDITIVES_DB: Record<string, Additive> = {
  E102: {
    code: 'E102',
    name: 'Tartrazine',
    category: 'Color',
    hazard: 'hazardous',
    description: 'Synthetic yellow dye.',
    function: 'Artificial colorant used to give a bright yellow hue.',
    healthExplanation: 'Linked to hyperactivity in children (ADHD) and allergic reactions like hives or asthma.'
  },
  E120: {
    code: 'E120',
    name: 'Carmine',
    category: 'Color',
    hazard: 'caution',
    description: 'Red dye derived from crushed insects.',
    function: 'Natural red colorant used in sweets, yogurts, and drinks.',
    healthExplanation: 'Safe for most, but can cause severe allergic reactions. Not suitable for vegans or vegetarians.'
  },
  E150d: {
    code: 'E150d',
    name: 'Sulphite Ammonia Caramel',
    category: 'Color',
    hazard: 'caution',
    description: 'Brown color processed with ammonia and sulphites.',
    function: 'Most common caramel color used in colas and soy sauce.',
    healthExplanation: 'May contain trace amounts of 4-MEI, a chemical linked to cancer in high doses in lab animals.'
  },
  E160a: {
    code: 'E160a',
    name: 'Carotenes',
    category: 'Color',
    hazard: 'safe',
    description: 'Natural orange/yellow color from plants.',
    function: 'Colorant that the body converts into Vitamin A.',
    healthExplanation: 'Very safe and actually provides nutritional benefits as a pro-vitamin.'
  },
  E211: {
    code: 'E211',
    name: 'Sodium Benzoate',
    category: 'Preservative',
    hazard: 'hazardous',
    description: 'Synthetic preservative.',
    function: 'Prevents growth of bacteria and mold in acidic foods like sodas.',
    healthExplanation: 'Can form benzene (a known carcinogen) if combined with Vitamin C (Ascorbic acid).'
  },
  E300: {
    code: 'E300',
    name: 'Ascorbic Acid',
    category: 'Antioxidant',
    hazard: 'safe',
    description: 'Vitamin C.',
    function: 'Prevents food from browning and acts as a preservative.',
    healthExplanation: 'Essential nutrient. Completely safe and beneficial.'
  },
  E322: {
    code: 'E322',
    name: 'Lecithin',
    category: 'Emulsifier',
    hazard: 'safe',
    description: 'Natural fat-like substance.',
    function: 'Helps mix oil and water; keeps chocolate and spreads smooth.',
    healthExplanation: 'Natural and safe. Usually derived from soy or sunflower seeds.'
  },
  E330: {
    code: 'E330',
    name: 'Citric Acid',
    category: 'Acidity Regulator',
    hazard: 'safe',
    description: 'Natural acid from citrus fruits.',
    function: 'Adds a sour taste and acts as a natural preservative.',
    healthExplanation: 'Very safe. Found naturally in lemons and oranges.'
  },
  E440: {
    code: 'E440',
    name: 'Pectins',
    category: 'Thickener',
    hazard: 'safe',
    description: 'Fiber from fruit cell walls.',
    function: 'Used to thicken jams and jellies.',
    healthExplanation: 'A natural fiber that is safe and may even help digestion.'
  },
  E471: {
    code: 'E471',
    name: 'Mono- and Diglycerides',
    category: 'Emulsifier',
    hazard: 'caution',
    description: 'Fats used as emulsifiers.',
    function: 'Keeps bread soft and prevents peanut oil from separating.',
    healthExplanation: 'Generally safe, but may be derived from animal fats (concern for vegans).'
  },
  E500: {
    code: 'E500',
    name: 'Sodium Carbonates',
    category: 'Raising Agent',
    hazard: 'safe',
    description: 'Baking soda.',
    function: 'Helps dough rise and regulates acidity.',
    healthExplanation: 'Very safe mineral salt used in traditional baking.'
  },
  E621: {
    code: 'E621',
    name: 'Monosodium Glutamate (MSG)',
    category: 'Flavor Enhancer',
    hazard: 'caution',
    description: 'Salt of glutamic acid.',
    function: 'Enhances savory (umami) flavor in snacks and Chinese food.',
    healthExplanation: 'Safe for most, but "MSG sensitivity" can cause headaches or sweating in some.'
  },
  E951: {
    code: 'E951',
    name: 'Aspartame',
    category: 'Sweetener',
    hazard: 'hazardous',
    description: 'Artificial sweetener.',
    function: 'Low-calorie sweetener used in "diet" sodas and sugar-free gum.',
    healthExplanation: 'Highly controversial. Must be avoided by people with PKU. Possible carcinogen concerns.'
  },
  E955: {
    code: 'E955',
    name: 'Sucralose',
    category: 'Sweetener',
    hazard: 'caution',
    description: 'Artificial sweetener (Splenda).',
    function: 'Sweetener that is 600 times sweeter than sugar.',
    healthExplanation: 'Safe in moderation, but some studies suggest it may affect gut health.'
  }
};