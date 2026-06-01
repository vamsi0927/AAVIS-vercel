import React, { useEffect, useState, createContext, useContext } from 'react';
import {
  AppState,
  UserProfile,
  ScanResult,
  NotificationPrefs,
  AppNotification } from
'../lib/types';
import { loadLocalPrefs, saveLocalPrefs } from '../lib/storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getOrCreateUser, updateUserProfile, getUserScans } from '../lib/supabaseService';
import { computeHealthScore } from '../lib/scoring';

interface AppContextType extends AppState {
  isLoadingAuth: boolean;
  login: (userData: { username: string; name?: string }) => void;
  logout: () => void;
  updateProfile: (profile: UserProfile) => void;
  addScan: (scan: ScanResult) => void;
  updateScanInState: (scanId: string, updatedScan: ScanResult) => void;
  completeOnboarding: () => void;
  incrementScanCount: () => void;
  setHasRated: () => void;
  clearHistory: () => void;
  toggleBookmark: (productId: string) => void;
  setLanguage: (lang: 'en' | 'hi') => void;
  updateNotificationPrefs: (prefs: NotificationPrefs) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setCameraPermission: (permission: 'unknown' | 'granted' | 'denied') => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  addNotification: (notification: Omit<AppNotification, 'id' | 'time' | 'read'>) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  supabaseUserId: string | null;
  loadCloudScans: () => Promise<void>;
}
const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultNotifications: AppNotification[] = [
  {
    id: 'default-1',
    type: 'warning',
    title: 'Recall Alert',
    body: 'A product you recently scanned has been recalled. Tap for details.',
    time: '2h ago',
    read: false
  },
  {
    id: 'default-2',
    type: 'tip',
    title: 'Daily Tip',
    body: 'Foods labeled "fat-free" often contain extra sugar. Always check the label.',
    time: '5h ago',
    read: false
  },
  {
    id: 'default-3',
    type: 'report',
    title: 'Weekly Report Ready',
    body: 'Your weekly health summary is here. See how you did this week.',
    time: 'Yesterday',
    read: true
  },
  {
    id: 'default-4',
    type: 'tip',
    title: 'Did you know?',
    body: 'E621 (MSG) can trigger headaches in sensitive individuals.',
    time: '2 days ago',
    read: true
  }
];

const getInitialState = (): AppState => {
  const prefs = loadLocalPrefs();
  return {
    isAuthenticated: false,
    profile: {
      name: '',
      age: '',
      gender: 'Prefer not to say',
      height: '',
      weight: '',
      activityLevel: 'Moderately Active',
      diet: 'None',
      allergens: [],
      conditions: []
    },
    scans: [],
    bookmarkedProductIds: [],
    scanCount: 0,
    hasRated: false,
    notifications: defaultNotifications,
    // Loaded from local preferences
    theme: prefs.theme,
    language: prefs.language,
    notificationPrefs: prefs.notificationPrefs,
    cameraPermission: prefs.cameraPermission,
    notificationsEnabled: prefs.notificationsEnabled,
    hasCompletedOnboarding: prefs.hasCompletedOnboarding,
  };
};

export function AppProvider({ children }: {children: React.ReactNode;}) {
  const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [state, setState] = useState<AppState>(getInitialState);

  // Persist only local preferences
  useEffect(() => {
    saveLocalPrefs({
      theme: state.theme,
      language: state.language,
      notificationPrefs: state.notificationPrefs,
      cameraPermission: state.cameraPermission,
      notificationsEnabled: state.notificationsEnabled,
      hasCompletedOnboarding: state.hasCompletedOnboarding,
    });
  }, [state.theme, state.language, state.notificationPrefs, state.cameraPermission, state.notificationsEnabled, state.hasCompletedOnboarding]);


  // ── Supabase Auth Listener ──
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setIsLoadingAuth(false);
      return;
    }

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleAuthUser(session.user).finally(() => {
          setIsLoadingAuth(false);
        });
      } else {
        setIsLoadingAuth(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setIsLoadingAuth(true);
          handleAuthUser(session.user).finally(() => {
            setIsLoadingAuth(false);
          });
        } else if (event === 'SIGNED_OUT') {
          setSupabaseUserId(null);
          // Clear all user-specific state on logout so a new login starts fresh
          setState(prev => ({
            ...prev,
            isAuthenticated: false,
            scans: [],
            bookmarkedProductIds: [],
            profile: {
              name: '',
              age: '',
              gender: 'Prefer not to say',
              height: '',
              weight: '',
              activityLevel: 'Moderately Active',
              diet: 'None',
              allergens: [],
              conditions: []
            }
          }));
          setIsLoadingAuth(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Handle authenticated user — sync to Supabase users table
  const handleAuthUser = async (authUser: any) => {
    try {
      const email = authUser.email || '';
      const name = authUser.user_metadata?.name || email.split('@')[0] || 'User';

      // authUser.id IS the auth.uid() — always use it as the canonical user ID
      const authUid = authUser.id as string;
      setSupabaseUserId(authUid);

      // Fetch profile from Supabase users table (row created by trigger on signup)
      const dbUser = await getOrCreateUser(email, name);

      if (dbUser) {
        // Sync profile from cloud (cloud is source of truth if it has data)
        setState(prev => ({
          ...prev,
          isAuthenticated: true,
          profile: {
            ...prev.profile,
            name: dbUser.name || prev.profile.name || name,
            age: dbUser.age || prev.profile.age || '',
            gender: dbUser.gender || prev.profile.gender || 'Prefer not to say',
            height: dbUser.height || prev.profile.height || '',
            weight: dbUser.weight || prev.profile.weight || '',
            activityLevel: dbUser.activity_level || prev.profile.activityLevel || 'Moderately Active',
            diet: dbUser.diet_type || prev.profile.diet || 'None',
            allergens: dbUser.allergens?.length ? dbUser.allergens : prev.profile.allergens,
            conditions: dbUser.health_conditions?.length ? dbUser.health_conditions : prev.profile.conditions,
          }
        }));
      } else {
        // Supabase users table unavailable, still authenticate
        setState(prev => ({
          ...prev,
          isAuthenticated: true,
          profile: {
            ...prev.profile,
            name: name,
          }
        }));
      }

      // FIRE THE SYNC: Automatically fetch user's scan history when they log in!
      await loadCloudScans();

    } catch (err) {
      console.error('[Aavis] Auth sync error:', err);
      setState(prev => ({ ...prev, isAuthenticated: true }));
    }
  };

  // ── Load scans from cloud ──
  const loadCloudScans = async () => {
    // Wait until authUid is available from state (either setupAuthListener or manual pass)
    // Actually, we pass userId directly if we want, or use supabase.auth.getSession
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId || !isSupabaseConfigured()) return;

    try {
      const cloudScans = await getUserScans(userId, 100);
      if (cloudScans.length > 0) {
        setState(prev => {
          const currentProfile = prev.profile;
          
          const cloudConverted: ScanResult[] = cloudScans.map(cs => {
            const product = {
              id: cs.id,
              name: cs.product_name,
              brand: cs.brand,
              imageEmoji: '🤖',
              imageUrl: cs.image_url || undefined,
              ingredients: cs.ingredients || [],
              productType: cs.nutrients?._productType || undefined,
              servingSize: cs.nutrients?._servingSize || undefined,
              rawNutrients: cs.nutrients?._rawNutrients || undefined,
              nutrients: cs.nutrients || {},
              additives: cs.additives || [],
              dynamicAdditives: cs.nutrients?._dynamicAdditives || {},
              dynamicIngredients: cs.nutrients?._dynamicIngredients || {},
              allergens: cs.allergens_detected || [],
            };
            
            const dynamicScore = computeHealthScore(product as any, currentProfile as any);
            
            return {
              id: cs.id,
              productId: cs.id,
              date: cs.created_at,
              score: dynamicScore.score,
              verdict: dynamicScore.verdict,
              warnings: dynamicScore.warnings,
              product,
              aiSummary: cs.ai_summary || undefined,
              dietAdvice: dynamicScore.dietAdvice || cs.diet_advice || undefined,
              scoreReasons: dynamicScore.scoreReasons,
              mainConcerns: dynamicScore.mainConcerns,
              personalizedWarnings: dynamicScore.personalizedWarnings,
              scoreBreakdown: dynamicScore.scoreBreakdown,
            };
          });

          const cloudIds = new Set(cloudConverted.map(c => c.id));
          const cloudBookmarkedIds = cloudScans.filter(cs => (cs as any).is_bookmarked).map(cs => cs.id);

          const seen = new Set();
          const deduped = cloudConverted.filter(scan => {
            const timeKey = scan.date.substring(0, 13);
            const key = `${scan.product?.name}-${timeKey}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          const allBookmarks = Array.from(new Set([...prev.bookmarkedProductIds, ...cloudBookmarkedIds]));

          return { ...prev, scans: deduped, scanCount: deduped.length, bookmarkedProductIds: allBookmarks };
        });
      }
    } catch (err) {
      console.error('[Aavis] Failed to load cloud scans:', err);
    }
  };

  const login = (userData: { username: string; name?: string }) => {
    setState((prev) => ({
      ...prev,
      isAuthenticated: true,
      profile: {
        ...prev.profile,
        name: userData.name || userData.username,
      }
    }));
  };

  const logout = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    setSupabaseUserId(null);
    setState((prev) => ({
      ...prev,
      isAuthenticated: false
    }));
  };

  const updateProfile = async (newProfile: UserProfile) => {
    // Normalize string arrays to Title Case and remove duplicates
    const normalizeArray = (arr?: string[]) => {
      if (!arr) return [];
      return Array.from(new Set(arr.map(s => 
        s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
      )));
    };

    const profile = {
      ...newProfile,
      allergens: normalizeArray(newProfile.allergens),
      conditions: normalizeArray(newProfile.conditions),
      fitnessGoals: normalizeArray(newProfile.fitnessGoals),
    };

    setState((prev) => {
      // Recalculate historical scans based on the new profile
      const updatedScans = prev.scans.map(scan => {
        if (!scan.product) return scan;
        const newScore = computeHealthScore(scan.product, profile);
        return {
          ...scan,
          score: newScore.score,
          verdict: newScore.verdict,
          warnings: newScore.warnings,
          scoreReasons: newScore.scoreReasons,
          mainConcerns: newScore.mainConcerns,
          personalizedWarnings: newScore.personalizedWarnings,
          dietAdvice: newScore.dietAdvice || scan.dietAdvice
        };
      });

      return {
        ...prev,
        profile,
        scans: updatedScans
      };
    });

    // Sync profile to Supabase
    const userId = supabaseUserId;
    if (userId && isSupabaseConfigured()) {
      updateUserProfile(userId, {
        name: profile.name,
        age: typeof profile.age === 'number' ? profile.age : profile.age ? parseInt(profile.age as string) : null,
        gender: profile.gender,
        height: typeof profile.height === 'number' ? profile.height : profile.height ? parseFloat(profile.height as string) : null,
        weight: typeof profile.weight === 'number' ? profile.weight : profile.weight ? parseFloat(profile.weight as string) : null,
        activity_level: profile.activityLevel,
        diet_type: profile.diet,
        health_conditions: profile.conditions,
        allergens: profile.allergens,
      }).catch(err => console.error('[Aavis] Profile sync error:', err));
    }
  };

  const addScan = (scan: ScanResult) => {
    setState(prev => ({
      ...prev,
      scans: [scan, ...prev.scans],
      scanCount: prev.scanCount + 1
    }));
  };

  const updateScanInState = (scanId: string, updatedScan: ScanResult) => {
    setState(prev => ({
      ...prev,
      scans: prev.scans.map(s => s.id === scanId ? updatedScan : s),
    }));
  };

  const completeOnboarding = () => {
    setState((prev) => ({
      ...prev,
      hasCompletedOnboarding: true
    }));
  };
  const incrementScanCount = () => {
    setState((prev) => ({
      ...prev,
      scanCount: prev.scanCount + 1
    }));
  };
  const setHasRated = () => {
    setState((prev) => ({
      ...prev,
      hasRated: true
    }));
  };
  const clearHistory = () => {
    setState((prev) => ({
      ...prev,
      scans: []
    }));
  };
  const toggleBookmark = (scanId: string) => {
    setState((prev) => {
      const isBookmarked = prev.bookmarkedProductIds.includes(scanId);
      const newAction = isBookmarked ? 'remove' : 'add';
      
      // Sync to cloud
      if (supabaseUserId) {
        import('../lib/supabaseService').then(({ toggleBookmarkDB }) => {
          toggleBookmarkDB(supabaseUserId, scanId, newAction).catch(console.error);
        });
      }

      return {
        ...prev,
        bookmarkedProductIds: isBookmarked ?
        prev.bookmarkedProductIds.filter((id) => id !== scanId) :
        [...prev.bookmarkedProductIds, scanId]
      };
    });
  };
  const setLanguage = (language: 'en' | 'hi') => {
    setState((prev) => ({
      ...prev,
      language
    }));
  };
  const updateNotificationPrefs = (notificationPrefs: NotificationPrefs) => {
    setState((prev) => ({
      ...prev,
      notificationPrefs
    }));
  };

  const setTheme = (theme: 'dark' | 'light') => {
    setState((prev) => ({ ...prev, theme }));
    // Apply theme to document
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
  };

  const setCameraPermission = (cameraPermission: 'unknown' | 'granted' | 'denied') => {
    setState((prev) => ({ ...prev, cameraPermission }));
  };

  const setNotificationsEnabled = (notificationsEnabled: boolean) => {
    setState((prev) => ({ ...prev, notificationsEnabled }));
  };

  const addNotification = (n: Omit<AppNotification, 'id' | 'time' | 'read'>) => {
    const newNotif: AppNotification = {
      ...n,
      id: `notif-${Date.now()}`,
      time: 'Just now',
      read: false
    };
    
    setState((prev) => ({
      ...prev,
      notifications: [newNotif, ...prev.notifications]
    }));

    // Trigger dynamic Web Notification if permitted
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(newNotif.title, { body: newNotif.body });
      } catch (e) {
        console.warn("Browser Notification instantiation failed:", e);
      }
    }
  };

  const markNotificationAsRead = (id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map(item => item.id === id ? { ...item, read: true } : item)
    }));
  };

  const clearNotifications = () => {
    setState((prev) => ({
      ...prev,
      notifications: []
    }));
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        isLoadingAuth,
        login,
        logout,
        updateProfile,
        addScan,
        updateScanInState,
        completeOnboarding,
        incrementScanCount,
        setHasRated,
        clearHistory,
        toggleBookmark,
        setLanguage,
        updateNotificationPrefs,
        setTheme,
        setCameraPermission,
        setNotificationsEnabled,
        addNotification,
        markNotificationAsRead,
        clearNotifications,
        supabaseUserId,
        loadCloudScans,
      }}>
      
      {children}
    </AppContext.Provider>);

}
export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}