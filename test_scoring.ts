import { computeHealthScore } from './src/lib/scoring';
import { Product, UserProfile } from './src/lib/types';

const product: Product = {
  id: 'test',
  name: 'Instant Noodles',
  brand: 'Unknown Brand',
  imageEmoji: '🍜',
  ingredients: [
    'SODIUM TRIPOLYPHOSPHATE',
    'CARAMEL COLOR',
    'PALM OIL',
    'GUAR GUM',
    'DISODIUM GUANYLATE',
    'DISODIUM INOSINATE',
    'POTASSIUM CARBONATE',
    'SODIUM CARBONATE',
    'SUGAR',
    'WHEAT FLOUR',
    'SALT',
    'CORNSTARCH'
  ],
  nutrients: {
    calories: null,
    sugar: 1, // Let's assume some values since they aren't visible
    sodium: 1200,
    fat: null,
    satFat: null,
    protein: 9,
    fiber: 1,
    carbs: null
  },
  additives: ['E451', 'E150', 'E412', 'E627', 'E631', 'E501', 'E500'],
  allergens: []
};

const profile: UserProfile = {
  name: 'Test',
  age: 25,
  gender: 'Male',
  height: 175,
  weight: 70,
  activityLevel: 'Active',
  diet: 'None',
  allergens: [],
  conditions: []
};

console.log(JSON.stringify(computeHealthScore(product, profile), null, 2));
