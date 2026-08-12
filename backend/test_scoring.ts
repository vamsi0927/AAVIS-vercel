import { computeHealthScore } from './src/lib/scoring';
import { Product, UserProfile } from './src/lib/types';

const product: Product = {
  id: 'lays_test',
  name: "Lay's Classic",
  brand: "Lay's",
  imageEmoji: '🥔',
  productType: 'food',
  servingSize: '28g',
  ingredients: ['potatoes', 'vegetable oil', 'salt'],
  rawNutrients: {
    unit: '1 serving (28g)',
    calories: 160,
    sugar: 1,
    sodium: 170,
    fat: 10,
    satFat: 1.5,
    protein: 2,
    fiber: 1,
    carbs: 15
  },
  nutrients: {
    unit: '1 serving (28g)',
    calories: 160,
    sugar: 1,
    sodium: 170,
    fat: 10,
    satFat: 1.5,
    protein: 2,
    fiber: 1,
    carbs: 15
  },
  additives: [],
  allergens: []
};

const profile: UserProfile = {
  name: 'Test', age: 25, gender: 'Male', height: 175, weight: 70, activityLevel: 'Active', diet: 'None', allergens: [], conditions: []
};

const result = computeHealthScore(product, profile);
console.log(JSON.stringify(result, null, 2));
