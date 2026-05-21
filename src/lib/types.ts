export type HazardLevel = 'safe' | 'caution' | 'hazardous';

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
  calories: number | null; // kcal per 100g
  sugar: number | null; // g per 100g
  sodium: number | null; // mg per 100g
  fat: number | null; // g per 100g
  satFat: number | null; // g per 100g
  protein: number | null; // g per 100g
  fiber: number | null; // g per 100g
  carbs: number | null; // g per 100g
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  imageEmoji: string;
  imageUrl?: string; // Base64 thumbnail or external URL
  ingredients: string[];
  nutrients: Nutrients;
  additives: string[]; // array of E-codes
  dynamicAdditives?: Record<string, Additive>; // AI-generated additive explanations
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