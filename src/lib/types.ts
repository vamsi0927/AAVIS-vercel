export type HazardLevel = 'safe' | 'mild' | 'moderate' | 'caution' | 'harmful' | 'hazardous';

export interface Additive {
  code: string; // e.g., E102
  name: string;
  category: string;
  hazard: HazardLevel;
  description: string;
  function?: string; // e.g., "Synthetic yellow dye"
  healthExplanation?: string; // e.g., "May cause allergic reactions and hyperactivity in children."
}

export interface Nutrients {
  unit?: string; // e.g., '100g', '100ml'
  calories: number | null; // kcal
  sugar: number | null; // g
  sodium: number | null; // mg
  fat: number | null; // g
  satFat: number | null; // g
  protein: number | null; // g
  fiber: number | null; // g
  carbs: number | null; // g
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  imageEmoji: string;
  imageUrl?: string; // Base64 thumbnail or external URL
  ingredients: string[];
  
  // New Normalization Fields
  productType?: 'food' | 'beverage';
  servingSize?: string; // e.g. "28g"
  normalizationBasis?: '100g' | '100ml';
  
  // Nutrients
  nutrients: Nutrients; // (Keep for backwards compatibility / local overrides)
  rawNutrients?: Nutrients;
  normalizedNutrients?: Nutrients;
  
  additives: string[]; // array of E-codes
  dynamicAdditives?: Record<string, Additive>; // AI-generated additive explanations
  dynamicIngredients?: Record<string, { hazard: HazardLevel; explanation: string; }>; // AI-generated ingredient explanations
  allergens: string[];
}

export interface UserProfile {
  name: string;
  age: number | '';
  gender: string;
  height: number | '';
  weight: number | '';
  activityLevel: string;
  diet: string; // 'None', 'Veg', 'Nonveg', 'Vegan', 'Keto', 'Jain'
  allergens: string[]; // 'peanuts', 'gluten', 'dairy', 'soy', 'eggs', 'shellfish', 'tree nuts'
  conditions: string[]; // 'Diabetes', 'Hypertension', 'Heart Disease', 'High Cholesterol'
  lifestyle?: string;
  fitnessGoals?: string[]; // e.g. 'Weight Loss', 'Muscle Gain', 'Maintenance'
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
  aiSummary?: string; // AI-generated health summary from Aavis AI
  dietAdvice?: string;
  scoreReasons?: string[];
  mainConcerns?: string[];
  personalizedWarnings?: string[];
  image_url?: string;
  imageUrl?: string;
  
  // New Normalization Engine Fields
  consumptionImpact?: 'Low' | 'Moderate' | 'High';
  servingWarning?: string;
  nutritionConfidence?: number;
  scoreBreakdown?: ScoreBreakdown;
}

export interface NotificationPrefs {
  dailyTips: boolean;
  scanReminders: boolean;
  productAlerts: boolean;
  weeklyReport: boolean;
  mealReminders: boolean;
  healthAlerts: boolean;
}

export interface AppNotification {
  id: string;
  type: 'tip' | 'alert' | 'report' | 'warning';
  title: string;
  body: string;
  time: string;
  read: boolean;
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
  notificationPrefs: NotificationPrefs;
  theme: 'dark' | 'light';
  cameraPermission: 'unknown' | 'granted' | 'denied';
  notificationsEnabled: boolean;
  notifications: AppNotification[];
}