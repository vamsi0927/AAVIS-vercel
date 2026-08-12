export type HazardLevel = 'safe' | 'mild' | 'moderate' | 'caution' | 'harmful' | 'hazardous';

export type ProductCategory = 
  | 'Whole Food'
  | 'Beverage'
  | 'Snack'
  | 'Dairy'
  | 'Bakery'
  | 'Breakfast Food'
  | 'Protein Supplement'
  | 'Confectionery'
  | 'Sauce & Condiment'
  | 'Cooking Oil & Fat'
  | 'Ready Meal'
  | 'Plant-Based Alternative'
  | 'General Food';

export type MythCategory = 
  | 'Nutrition'
  | 'Food Safety'
  | 'Protein'
  | 'Sugar'
  | 'Diabetes'
  | 'Vegan'
  | 'Additives'
  | 'General Health';

export interface DimensionScore {
  score: number;
  justification: string;
}

export interface AIScoringDimensions {
  ingredientSafety: DimensionScore;
  nutritionalQuality: DimensionScore;
  processingLevel: DimensionScore;
  nutrientDensity: DimensionScore;
  energyDensity: DimensionScore;
  wholeFoodContent: DimensionScore;
  functionalHealthImpact: DimensionScore;
}

export interface Additive {
  code: string; // e.g., E102
  name: string;
  category: string;
  hazard: HazardLevel;
  description: string;
  function?: string;
  healthExplanation?: string;
}

export interface Nutrients {
  unit?: string;
  calories: number | null;
  sugar: number | null;
  sodium: number | null;
  fat: number | null;
  satFat: number | null;
  protein: number | null;
  fiber: number | null;
  carbs: number | null;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  imageEmoji: string;
  imageUrl?: string;
  ingredients: string[];
  productType?: ProductCategory | 'food' | 'beverage';
  servingSize?: string;
  normalizationBasis?: '100g' | '100ml';
  nutrients: Nutrients;
  rawNutrients?: Nutrients;
  normalizedNutrients?: Nutrients;
  additives: string[];
  dynamicAdditives?: Record<string, Additive>;
  dynamicIngredients?: Record<string, { hazard: HazardLevel; explanation: string; }>;
  allergens: string[];
}

export interface UserProfile {
  name: string;
  email?: string;
  avatarUrl?: string;
  age: number | '';
  gender: string;
  height: number | '';
  weight: number | '';
  activityLevel: string;
  diet: string;
  allergens: string[];
  conditions: string[];
  lifestyle?: string;
  fitnessGoals?: string[];
}

export interface ScoreBreakdown {
  sugarPenalty: number;
  sodiumPenalty: number;
  satFatPenalty: number;
  additivePenalty: number;
  processingPenalty: number;
  proteinBonus: number;
  fiberBonus: number;
  wholeFoodBonus: number;
  finalScore: number;
}

export interface ScanResult {
  id: string;
  productId: string;
  date: string;
  score: number;
  verdict: HazardLevel;
  warnings: string[];
  product?: Product;
  aiSummary?: string;
  dietAdvice?: string;
  scoreReasons?: string[];
  mainConcerns?: string[];
  personalizedWarnings?: string[];
  image_url?: string;
  imageUrl?: string;
  consumptionImpact?: 'Low' | 'Moderate' | 'High';
  servingWarning?: string;
  nutritionConfidence?: number;
  scoreBreakdown?: ScoreBreakdown;
  aiDimensions?: AIScoringDimensions;
  overallAssessment?: string;
}

export interface MythSource {
  name: string;
  url: string;
}

export interface SavedMyth {
  id: string;
  user_id: string;
  question: string;
  correct_answer: string;
  user_answer?: string;
  is_correct?: boolean;
  explanation: string;
  sources: MythSource[];
  category: MythCategory;
  created_at?: string;
  updated_at?: string;
}

export interface AppState {
  isAuthenticated: boolean;
  profile: UserProfile;
  scans: ScanResult[];
  bookmarkedProductIds: string[];
  hasCompletedOnboarding: boolean;
  scanCount: number;
  hasRated: boolean;
  language: 'en' | 'hi';
  theme: 'dark' | 'light';
  cameraPermission: 'unknown' | 'granted' | 'denied';
  savedMyths: SavedMyth[];
}
