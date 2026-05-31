import { NotificationPrefs } from './types';

export interface LocalPreferences {
  theme: 'dark' | 'light';
  language: 'en' | 'hi';
  notificationPrefs: NotificationPrefs;
  cameraPermission: 'unknown' | 'granted' | 'denied';
  notificationsEnabled: boolean;
  hasCompletedOnboarding: boolean; // Keep this local so device remembers onboarding state
}

const PREFS_KEY = 'aavis_local_prefs';

const DEFAULT_PREFS: LocalPreferences = {
  theme: 'dark',
  language: 'en',
  notificationPrefs: {
    dailyTips: true,
    scanReminders: true,
    productAlerts: true,
    weeklyReport: true,
    mealReminders: true,
    healthAlerts: true
  },
  cameraPermission: 'unknown',
  notificationsEnabled: false,
  hasCompletedOnboarding: false,
};

export function loadLocalPrefs(): LocalPreferences {
  try {
    const stored = localStorage.getItem(PREFS_KEY);
    if (stored) {
      return { ...DEFAULT_PREFS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load local prefs', e);
  }
  return DEFAULT_PREFS;
}

export function saveLocalPrefs(prefs: Partial<LocalPreferences>): void {
  try {
    const current = loadLocalPrefs();
    const updated = { ...current, ...prefs };
    localStorage.setItem(PREFS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save local prefs', e);
  }
}