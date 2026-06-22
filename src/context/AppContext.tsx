import React, { useEffect, useState, createContext, useContext, useRef } from 'react';
import { toast } from 'sonner';
import {
  AppState,
  UserProfile,
  ScanResult,
  SavedMyth } from
'../lib/types';
import { loadLocalPrefs, saveLocalPrefs } from '../lib/storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getOrCreateUser, updateUserProfile, getUserScans, getSavedMyths, saveMythToCloud, deleteSavedMyth } from '../lib/supabaseService';
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
  removeScan: (scanId: string) => void;
  restoreScans: (scans: ScanResult[]) => void;
  toggleBookmark: (productId: string) => void;
  setLanguage: (lang: 'en' | 'hi') => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setCameraPermission: (permission: 'unknown' | 'granted' | 'denied') => void;
  supabaseUserId: string | null;
  loadCloudScans: () => Promise<void>;
  loadSavedMythsContext: () => Promise<void>;
  saveMyth: (mythData: Omit<SavedMyth, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<SavedMyth | null>;
  removeSavedMyth: (mythId: string) => Promise<boolean>;
}
const AppContext = createContext<AppContextType | undefined>(undefined);



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
    theme: prefs.theme,
    language: prefs.language,
    cameraPermission: prefs.cameraPermission,
    hasCompletedOnboarding: prefs.hasCompletedOnboarding,
    savedMyths: [],
  };
};

export function AppProvider({ children }: {children: React.ReactNode;}) {
  const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [state, setState] = useState<AppState>(getInitialState);

  const hasInitializedRef = useRef(false);
  const currentUserRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Persist only local preferences
  useEffect(() => {
    saveLocalPrefs({
      theme: state.theme,
      language: state.language,
      cameraPermission: state.cameraPermission,
      hasCompletedOnboarding: state.hasCompletedOnboarding,
    });
  }, [state.theme, state.language, state.cameraPermission, state.hasCompletedOnboarding]);


  // ── Supabase Auth Listener ──
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setIsLoadingAuth(false);
      return;
    }

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!hasInitializedRef.current) {
        hasInitializedRef.current = true;
        if (session?.user) {
          currentUserRef.current = session.user.id;
          handleAuthUser(session.user).finally(() => setIsLoadingAuth(false));
        } else {
          setIsLoadingAuth(false);
        }
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'INITIAL_SESSION') {
          if (!hasInitializedRef.current) {
            hasInitializedRef.current = true;
            if (session?.user) {
              currentUserRef.current = session.user.id;
              handleAuthUser(session.user).finally(() => setIsLoadingAuth(false));
            } else {
              setIsLoadingAuth(false);
            }
          }
          return;
        }

        if (event === 'SIGNED_IN') {
          if (session?.user) {
            if (currentUserRef.current === session.user.id) return;
            currentUserRef.current = session.user.id;
            setIsLoadingAuth(true);
            handleAuthUser(session.user).finally(() => setIsLoadingAuth(false));
          }
        } 
        else if (event === 'TOKEN_REFRESHED') {
          return;
        }
        else if (event === 'SIGNED_OUT') {
          const wasAuthenticated = currentUserRef.current !== null;
          currentUserRef.current = null;
          setSupabaseUserId(null);
          
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
          }

          if (hasInitializedRef.current && wasAuthenticated) {
            toast.error('Session expired. Please sign in again.');
          }

          setState(prev => ({
            ...prev,
            isAuthenticated: false,
            scans: [],
            bookmarkedProductIds: [],
            profile: { ...prev.profile, name: '', age: '', gender: 'Prefer not to say', height: '', weight: '', activityLevel: 'Moderately Active', diet: 'None', allergens: [], conditions: [], avatarUrl: undefined }
          }));
          setIsLoadingAuth(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Handle authenticated user — sync to Supabase users table
  const handleAuthUser = async (authUser: any) => {
    try {
      const email = authUser.email || '';
      const name = authUser.user_metadata?.name || email.split('@')[0] || 'User';

      const authUid = authUser.id as string;
      setSupabaseUserId(authUid);

      const dbUser = await getOrCreateUser(email, name).catch(err => {
        console.error('Error fetching user from DB:', err);
        return null; // Fallback to basic auth if DB fails
      });

      if (dbUser) {
        setState(prev => ({
          ...prev,
          isAuthenticated: true,
          profile: {
            ...prev.profile,
            name: dbUser.name || prev.profile.name || name,
            avatarUrl: dbUser.avatar_url || prev.profile.avatarUrl || undefined,
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
        setState(prev => ({
          ...prev,
          isAuthenticated: true,
          profile: {
            ...prev.profile,
            name: name,
          }
        }));
      }

      await loadCloudScans();
      await loadSavedMythsContext();

    } catch (error: any) {
      console.error('Error in handleAuthUser:', error);
      setState(prev => ({ ...prev, isAuthenticated: true }));
    }
  };

  // ── Load scans from cloud ──
  const loadCloudScans = async (signal?: AbortSignal) => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId || !isSupabaseConfigured()) return;

    try {
      const cloudScans = await getUserScans(userId, 100);
      if (signal?.aborted) return;
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
            const savedDimensions = cs.nutrients?._aiDimensions;
            const useAI = !!savedDimensions;
            
            return {
              id: cs.id,
              productId: cs.id,
              date: cs.created_at,
              score: cs.health_score !== null && cs.health_score !== undefined ? cs.health_score : dynamicScore.score,
              verdict: cs.verdict || dynamicScore.verdict,
              warnings: dynamicScore.warnings,
              product,
              aiSummary: cs.ai_summary || undefined,
              dietAdvice: cs.diet_advice || dynamicScore.dietAdvice || undefined,
              scoreReasons: dynamicScore.scoreReasons,
              mainConcerns: dynamicScore.mainConcerns,
              personalizedWarnings: dynamicScore.personalizedWarnings,
              scoreBreakdown: cs.nutrients?._scoreBreakdown || dynamicScore.scoreBreakdown,
              aiDimensions: savedDimensions,
              overallAssessment: cs.nutrients?._overallAssessment,
              majorBenefits: cs.nutrients?._majorBenefits
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
    } catch (e) {
      console.error('Error fetching cloud scans:', e);
    }
  };

  const loadSavedMythsContext = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId || !isSupabaseConfigured()) return;

    try {
      console.log('[AppContext] Loading saved myths for user:', userId);
      const dbMyths = await getSavedMyths(userId);
      console.log('[AppContext] Successfully loaded', dbMyths.length, 'myths from cloud.');
      setState(prev => ({
        ...prev,
        savedMyths: dbMyths
      }));
    } catch (e) {
      console.error('[AppContext] Error fetching saved myths:', e);
    }
  };

  const saveMyth = async (mythData: Omit<import('../lib/types').SavedMyth, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!supabaseUserId) {
      console.log('[AppContext] Save Myth aborted: No Supabase User ID');
      return null;
    }

    console.log('[AppContext] Checking duplicates for myth:', mythData.question);
    const isDuplicate = state.savedMyths.some(
      m => m.question === mythData.question && m.correct_answer === mythData.correct_answer
    );
    if (isDuplicate) {
      console.log('[AppContext] Myth is already saved in state (duplicate check passed)');
      return null;
    }

    console.log('[AppContext] Calling saveMythToCloud...');
    const newMyth = await saveMythToCloud(supabaseUserId, mythData);
    if (newMyth) {
      console.log('[AppContext] Successfully saved to cloud. Updating local state.');
      setState(prev => ({
        ...prev,
        savedMyths: [newMyth, ...prev.savedMyths]
      }));
    } else {
      console.log('[AppContext] saveMythToCloud returned null.');
    }
    return newMyth;
  };

  const removeSavedMyth = async (mythId: string) => {
    const success = await deleteSavedMyth(mythId);
    if (success) {
      setState(prev => ({
        ...prev,
        savedMyths: prev.savedMyths.filter(m => m.id !== mythId)
      }));
    }
    return success;
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
        avatar_url: profile.avatarUrl
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
  const removeScan = (scanId: string) => {
    setState((prev) => ({
      ...prev,
      scans: prev.scans.filter(s => s.id !== scanId),
      scanCount: Math.max(0, prev.scanCount - 1)
    }));
  };
  const restoreScans = (scans: ScanResult[]) => {
    setState((prev) => ({
      ...prev,
      scans,
      scanCount: scans.length
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
        removeScan,
        restoreScans,
        toggleBookmark,
        setLanguage,
        setTheme,
        setCameraPermission,
        supabaseUserId,
        loadCloudScans,
        loadSavedMythsContext,
        saveMyth,
        removeSavedMyth
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