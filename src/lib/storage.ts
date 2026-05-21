import { AppState, UserProfile } from './types';

const STORAGE_KEY = 'aavis_app_state';

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

export function loadState(): AppState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_STATE, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load state', e);
  }
  return DEFAULT_STATE;
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state', e);
  }
}