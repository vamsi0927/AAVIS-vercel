import { Product } from '../lib/types';

export const SAMPLE_PRODUCTS: Product[] = [
{
  id: 'prod_1',
  name: 'Spicy Ramen Noodles',
  brand: 'NoodleKing',
  imageEmoji: '🍜',
  ingredients: [
  'Wheat Flour',
  'Palm Oil',
  'Salt',
  'Monosodium Glutamate',
  'Sugar',
  'Soy Sauce Powder',
  'Tartrazine',
  'Sodium Benzoate'],

  nutrients: {
    calories: 450,
    sugar: 4,
    sodium: 1800,
    fat: 18,
    satFat: 9,
    protein: 9,
    fiber: 2,
    carbs: 62
  },
  additives: ['E621', 'E102', 'E211'],
  allergens: ['gluten', 'soy']
},
{
  id: 'prod_2',
  name: 'Zero Sugar Cola',
  brand: 'FizzPop',
  imageEmoji: '🥤',
  ingredients: [
  'Carbonated Water',
  'Caramel Color',
  'Phosphoric Acid',
  'Aspartame',
  'Potassium Benzoate',
  'Natural Flavors',
  'Citric Acid'],

  nutrients: {
    calories: 0,
    sugar: 0,
    sodium: 40,
    fat: 0,
    satFat: 0,
    protein: 0,
    fiber: 0,
    carbs: 0
  },
  additives: ['E150d', 'E951', 'E330'],
  allergens: []
},
{
  id: 'prod_3',
  name: 'Oat & Honey Granola',
  brand: 'NatureBite',
  imageEmoji: '🥣',
  ingredients: [
  'Whole Grain Oats',
  'Honey',
  'Canola Oil',
  'Brown Sugar',
  'Almonds',
  'Salt',
  'Lecithin'],

  nutrients: {
    calories: 410,
    sugar: 24,
    sodium: 140,
    fat: 14,
    satFat: 1.5,
    protein: 10,
    fiber: 8,
    carbs: 64
  },
  additives: ['E322'],
  allergens: ['gluten', 'tree nuts']
},
{
  id: 'prod_4',
  name: 'Cheese Nacho Chips',
  brand: 'CrunchyCo',
  imageEmoji: '🧀',
  ingredients: [
  'Corn',
  'Vegetable Oil',
  'Cheese Powder',
  'Salt',
  'Whey',
  'Monosodium Glutamate',
  'Maltodextrin',
  'Citric Acid',
  'Carmine'],

  nutrients: {
    calories: 500,
    sugar: 2,
    sodium: 650,
    fat: 26,
    satFat: 4,
    protein: 7,
    fiber: 4,
    carbs: 60
  },
  additives: ['E621', 'E330', 'E120'],
  allergens: ['dairy']
},
{
  id: 'prod_5',
  name: 'Plain Greek Yogurt',
  brand: 'DairyPure',
  imageEmoji: '🥛',
  ingredients: ['Pasteurized Skim Milk', 'Live Active Cultures'],
  nutrients: {
    calories: 59,
    sugar: 3.2,
    sodium: 36,
    fat: 0.4,
    satFat: 0.1,
    protein: 10.3,
    fiber: 0,
    carbs: 3.6
  },
  additives: [],
  allergens: ['dairy']
}];