import { AppState, UserProfile } from './types';

const BASE_KEY = 'aavis_app_state';

/** Returns the localStorage key scoped to a specific user (or global fallback). */
function storageKey(userId?: string | null): string {
  return userId ? `${BASE_KEY}_${userId}` : BASE_KEY;
}

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  age: '',
  gender: '',
  height: '',
  weight: '',
  activityLevel: 'Moderately Active',
  diet: 'None',
  allergens: [],
  conditions: [],
  fitnessGoals: []
};

const DEFAULT_STATE: AppState = {
  isAuthenticated: false,
  profile: DEFAULT_PROFILE,
  scans: [],
  bookmarkedProductIds: [],
  hasCompletedOnboarding: false,
  scanCount: 0,
  hasRated: false,
  language: 'en',
  notificationPrefs: {
    dailyTips: true,
    scanReminders: true,
    productAlerts: true
  }
};

export function loadState(userId?: string | null): AppState {
  try {
    const stored = localStorage.getItem(storageKey(userId));
    if (stored) {
      return { ...DEFAULT_STATE, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load state', e);
  }
  return DEFAULT_STATE;
}

export function saveState(state: AppState, userId?: string | null): void {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state', e);
  }
}