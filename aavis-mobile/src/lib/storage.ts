import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocalPreferences {
  theme: 'dark' | 'light';
  language: 'en' | 'hi';
  cameraPermission: 'unknown' | 'granted' | 'denied';
  hasCompletedOnboarding: boolean;
  mythsCompletedCount: number;
}

const PREFS_KEY = 'aavis_local_prefs';

const DEFAULT_PREFS: LocalPreferences = {
  theme: 'light',
  language: 'en',
  cameraPermission: 'unknown',
  hasCompletedOnboarding: false,
  mythsCompletedCount: 0,
};

let cachedPrefs: LocalPreferences = { ...DEFAULT_PREFS };

export async function initLocalPrefs(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(PREFS_KEY);
    if (stored) {
      cachedPrefs = { ...DEFAULT_PREFS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load local prefs', e);
  }
}

export function loadLocalPrefs(): LocalPreferences {
  return cachedPrefs;
}

export function saveLocalPrefs(prefs: Partial<LocalPreferences>): void {
  try {
    cachedPrefs = { ...cachedPrefs, ...prefs };
    AsyncStorage.setItem(PREFS_KEY, JSON.stringify(cachedPrefs)).catch(err => {
      console.error('Failed to save local prefs', err);
    });
  } catch (e) {
    console.error('Failed to save local prefs', e);
  }
}
