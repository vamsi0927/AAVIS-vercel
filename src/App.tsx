import React from 'react';
import {
  HashRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
  Navigate
} from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { Toaster } from 'sonner';
import { AppProvider, useAppContext } from './context/AppContext';
import { MobileFrame } from './components/MobileFrame';
import { BottomNav } from './components/BottomNav';
import { Sidebar } from './components/Sidebar';
import { RatingPrompt } from './components/RatingPrompt';
import { OfflineBanner } from './components/OfflineBanner';
import { useShakeDetector } from './hooks/useShakeDetector';
import { motion, AnimatePresence } from 'framer-motion';
// Existing pages
import { Splash } from './pages/Splash';
import { Onboarding } from './pages/Onboarding';
import { Home } from './pages/Home';
import { Scan } from './pages/Scan';
import { Result } from './pages/Result';
import { History } from './pages/History';
import { Profile } from './pages/Profile';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
// Auth
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { VerifyOTP } from './pages/auth/VerifyOTP';
import { ResetPassword } from './pages/auth/ResetPassword';
// Setup
import { ProfileSetup } from './pages/setup/ProfileSetup';
// Dashboard
import { HealthDashboard } from './pages/dashboard/HealthDashboard';
import { MostScanned } from './pages/dashboard/MostScanned';
import { HazardousProducts } from './pages/dashboard/HazardousProducts';
import { NutritionIntake } from './pages/dashboard/NutritionIntake';
// Scan variants
import { ScanBarcode } from './pages/scan/Barcode';
import { ScanManual } from './pages/scan/Manual';
// Result sub-screens
import { ResultNutrients } from './pages/result/Nutrients';
import { ResultIngredients } from './pages/result/Ingredients';
import { ResultShare } from './pages/result/Share';
import { ResultAdditives } from './pages/result/ResultAdditives';
import { ResultAllergens } from './pages/result/ResultAllergens';
// Product Data
import { ReportData } from './pages/product/ReportData';
import { SuggestProduct } from './pages/product/SuggestProduct';
// Education
import { AdditivesList } from './pages/education/AdditivesList';
import { AdditiveDetail } from './pages/education/AdditiveDetail';
import { NutritionGuide } from './pages/education/NutritionGuide';
import { FSSAIGuidelines } from './pages/education/FSSAIGuidelines';
import { Settings } from './pages/Settings';
import { LanguageSettings } from './pages/settings/Language';
import { EditProfile } from './pages/settings/EditProfile';
import { UpdateConditions } from './pages/settings/UpdateConditions';
import { ApiSettings } from './pages/settings/ApiSettings';
// Dashboard Extensions
import { WaterTracker } from './pages/dashboard/WaterTracker';
import { Achievements } from './pages/dashboard/Achievements';
import { WeeklyReport } from './pages/dashboard/WeeklyReport';
import { NutritionChat } from './pages/dashboard/NutritionChat';
import { GlobalAIChat } from './components/GlobalAIChat';
// Product Extensions
import { CompareProducts } from './pages/product/CompareProducts';
import { ProductAlternatives } from './pages/product/ProductAlternatives';
// Education
import { FoodMyths } from './pages/education/FoodMyths';
import { EducationHub } from './pages/education/EducationHub';
import { LabelGuide } from './pages/education/LabelGuide';
import { PackagingGuide } from './pages/education/PackagingGuide';
import { HiddenSugarsGuide } from './pages/education/HiddenSugarsGuide';
import { FoodClaimsGuide } from './pages/education/FoodClaimsGuide';
import { PortionGuide } from './pages/education/PortionGuide';
import { NutritionBoardsHub } from './pages/education/NutritionBoardsHub';
import { SugarBoard } from './pages/education/boards/SugarBoard';
import { SaltBoard } from './pages/education/boards/SaltBoard';
import { FatBoard } from './pages/education/boards/FatBoard';
import { AdditivesBoard } from './pages/education/boards/AdditivesBoard';
import { KidsBoard } from './pages/education/boards/KidsBoard';


// Other
import { Saved } from './pages/Saved';
import { Search } from './pages/Search';
import { Help } from './pages/support/Help';
import { Contact } from './pages/support/Contact';
import { AboutAavis } from './pages/support/AboutAavis';
function ProtectedRoute({ children }: {children: React.ReactNode;}) {
  const { isAuthenticated, isLoadingAuth } = useAppContext();
  
  if (isLoadingAuth) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-navy-900 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <p className="text-navy-200">Loading your profile...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    const currentPath = window.location.pathname;
    return <Navigate to={`/login?next=${currentPath}`} replace />;
  }
  
  return <>{children}</>;
}
function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, isAuthenticated } = useAppContext();
  const [isPanicking, setIsPanicking] = React.useState(false);

  useShakeDetector(() => {
    if (!isPanicking) {
      setIsPanicking(true);
      setTimeout(() => setIsPanicking(false), 3000); // Stop panicking after 3 seconds
    }
  });

  React.useEffect(() => {
    const handleBackButton = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      const path = window.location.pathname;
      if (['/', '/home', '/login', '/onboarding'].includes(path)) {
        CapacitorApp.exitApp();
      } else {
        navigate(-1);
      }
    });

    return () => {
      handleBackButton.then(listener => listener.remove());
    };
  }, [navigate]);

  React.useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
  }, [theme]);

  const showBottomNav = [
  '/home',
  '/history',
  '/profile',
  '/dashboard',
  '/saved',
  '/education'].
  includes(location.pathname);
  
  const hideSidebar = ['/', '/login', '/register', '/onboarding', '/setup'].includes(location.pathname);
  
  return (
    <div className="flex flex-row h-full w-full bg-navy-900 overflow-hidden">
      {isAuthenticated && !hideSidebar && <Sidebar className="hidden md:flex" />}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Routes>
        {/* Public */}
        <Route path="/" element={<Splash />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />

        {/* Setup */}
        <Route
          path="/setup"
          element={
            <ProtectedRoute>
              <ProfileSetup />
            </ProtectedRoute>
          } 
        />
        

        {/* Main */}
        <Route
          path="/home"
          element={
          <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
        
        <Route
          path="/scan"
          element={
          <ProtectedRoute>
              <Scan />
            </ProtectedRoute>
          } />
        
        <Route
          path="/scan/barcode"
          element={
          <ProtectedRoute>
              <ScanBarcode />
            </ProtectedRoute>
          } />
        
        <Route
          path="/scan/manual"
          element={
          <ProtectedRoute>
              <ScanManual />
            </ProtectedRoute>
          } />
        
        <Route
          path="/result/:id"
          element={
          <ProtectedRoute>
              <Result />
            </ProtectedRoute>
          } />
        
        <Route
          path="/result/:id/nutrients"
          element={
          <ProtectedRoute>
              <ResultNutrients />
            </ProtectedRoute>
          } />
        
        <Route
          path="/result/:id/ingredients"
          element={
          <ProtectedRoute>
              <ResultIngredients />
            </ProtectedRoute>
          } />
        
        <Route
          path="/result/:id/share"
          element={
          <ProtectedRoute>
              <ResultShare />
            </ProtectedRoute>
          } />
        
        <Route
          path="/history"
          element={
          <ProtectedRoute>
              <History />
            </ProtectedRoute>
          } />
        
        <Route
          path="/profile"
          element={
          <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
        
        <Route
          path="/dashboard"
          element={
          <ProtectedRoute>
              <HealthDashboard />
            </ProtectedRoute>
          } />
        
        <Route
          path="/saved"
          element={
          <ProtectedRoute>
              <Saved />
            </ProtectedRoute>
          } />
        
        <Route
          path="/search"
          element={
          <ProtectedRoute>
              <Search />
            </ProtectedRoute>
          } />
        


        {/* Education */}
        <Route
          path="/education"
          element={
            <ProtectedRoute>
              <EducationHub />
            </ProtectedRoute>
          } />
        <Route
          path="/education/label-guide"
          element={
            <ProtectedRoute>
              <LabelGuide />
            </ProtectedRoute>
          } />
        <Route
          path="/education/packaging-guide"
          element={
            <ProtectedRoute>
              <PackagingGuide />
            </ProtectedRoute>
          } />
        <Route
          path="/education/hidden-sugars"
          element={
            <ProtectedRoute>
              <HiddenSugarsGuide />
            </ProtectedRoute>
          } />
        <Route
          path="/education/food-claims"
          element={
            <ProtectedRoute>
              <FoodClaimsGuide />
            </ProtectedRoute>
          } />
        <Route
          path="/education/portion-guide"
          element={
            <ProtectedRoute>
              <PortionGuide />
            </ProtectedRoute>
          } />
        <Route
          path="/education/boards"
          element={
            <ProtectedRoute>
              <NutritionBoardsHub />
            </ProtectedRoute>
          } />
        <Route
          path="/education/boards/sugar"
          element={
            <ProtectedRoute>
              <SugarBoard />
            </ProtectedRoute>
          } />
        <Route
          path="/education/boards/salt"
          element={
            <ProtectedRoute>
              <SaltBoard />
            </ProtectedRoute>
          } />
        <Route
          path="/education/boards/fat"
          element={
            <ProtectedRoute>
              <FatBoard />
            </ProtectedRoute>
          } />
        <Route
          path="/education/boards/additives"
          element={
            <ProtectedRoute>
              <AdditivesBoard />
            </ProtectedRoute>
          } />
        <Route
          path="/education/boards/kids"
          element={
            <ProtectedRoute>
              <KidsBoard />
            </ProtectedRoute>
          } />
        <Route
          path="/education/additives"
          element={
          <ProtectedRoute>
              <AdditivesList />
            </ProtectedRoute>
          } />
        

        {/* Settings */}
        <Route
          path="/settings"
          element={
          <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
        
        <Route
          path="/settings/language"
          element={
          <ProtectedRoute>
              <LanguageSettings />
            </ProtectedRoute>
          } />
        

        
        <Route
          path="/settings/edit-profile"
          element={
          <ProtectedRoute>
              <EditProfile />
            </ProtectedRoute>
          } />

        <Route
          path="/settings/update-conditions"
          element={
          <ProtectedRoute>
              <UpdateConditions />
            </ProtectedRoute>
          } />
        
        <Route
          path="/settings/api-keys"
          element={
          <ProtectedRoute>
              <ApiSettings />
            </ProtectedRoute>
          } />
        

        {/* Support */}
        <Route
          path="/help"
          element={
          <ProtectedRoute>
              <Help />
            </ProtectedRoute>
          } />
        
        <Route
          path="/contact"
          element={
          <ProtectedRoute>
              <Contact />
            </ProtectedRoute>
          } />
          
        <Route
          path="/about"
          element={
          <ProtectedRoute>
              <AboutAavis />
            </ProtectedRoute>
          } />
        
              {/* New Missing Routes */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/result/:id/additives" element={<ProtectedRoute><ResultAdditives /></ProtectedRoute>} />
        <Route path="/result/:id/allergens" element={<ProtectedRoute><ResultAllergens /></ProtectedRoute>} />
        <Route path="/product/:id/report" element={<ProtectedRoute><ReportData /></ProtectedRoute>} />
        <Route path="/product/suggest" element={<ProtectedRoute><SuggestProduct /></ProtectedRoute>} />
        <Route path="/dashboard/most-scanned" element={<ProtectedRoute><MostScanned /></ProtectedRoute>} />
        <Route path="/dashboard/hazardous" element={<ProtectedRoute><HazardousProducts /></ProtectedRoute>} />
        <Route path="/dashboard/intake" element={<ProtectedRoute><NutritionIntake /></ProtectedRoute>} />
        <Route path="/education/additives/:id" element={<ProtectedRoute><AdditiveDetail /></ProtectedRoute>} />
        <Route path="/education/nutrition" element={<ProtectedRoute><NutritionGuide /></ProtectedRoute>} />
        <Route path="/education/fssai" element={<ProtectedRoute><FSSAIGuidelines /></ProtectedRoute>} />
        <Route path="/education/myths" element={<ProtectedRoute><FoodMyths /></ProtectedRoute>} />

        {/* Brand New Screens */}
        <Route path="/compare" element={<ProtectedRoute><CompareProducts /></ProtectedRoute>} />
        <Route path="/product/:id/alternatives" element={<ProtectedRoute><ProductAlternatives /></ProtectedRoute>} />
        <Route path="/dashboard/water" element={<ProtectedRoute><WaterTracker /></ProtectedRoute>} />
        <Route path="/dashboard/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
        <Route path="/dashboard/weekly-report" element={<ProtectedRoute><WeeklyReport /></ProtectedRoute>} />
        <Route path="/dashboard/chat" element={<ProtectedRoute><NutritionChat /></ProtectedRoute>} />
        </Routes>
        {showBottomNav && <div className="md:hidden"><BottomNav /></div>}
        <GlobalAIChat />
        <RatingPrompt />

        {/* Shake Panic Modal */}
        <AnimatePresence>
          {isPanicking && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center p-6 bg-red-900/40 backdrop-blur-sm"
            >
              <motion.div
                animate={{ x: [-10, 10, -10, 10, 0], y: [-5, 5, -5, 5, 0] }}
                transition={{ repeat: Infinity, duration: 0.2 }}
                className="bg-navy-900 border-2 border-red-500 rounded-3xl p-6 text-center shadow-2xl max-w-sm"
              >
                <div className="text-5xl mb-4">🫨</div>
                <h2 className="text-xl font-bold text-white mb-2">Whoa, take it easy!</h2>
                <p className="text-content-secondary">Shaking your device doesn't shake off the calories!</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
export function App() {
  return (
    <AppProvider>
      <HashRouter>
        <MobileFrame>
          <OfflineBanner />
          <AppContent />
          <Toaster
            position="top-center"
            theme="dark"
            offset="60px"
            toastOptions={{
              style: {
                background: '#1f2335',
                border: '1px solid #2a2f45',
                color: '#f4f5fb'
              }
            }} />
          
        </MobileFrame>
      </HashRouter>
    </AppProvider>);

}
