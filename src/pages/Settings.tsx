import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Bell,
  Moon,
  Camera,
  Trash2,
  Shield,
  FileText,
  HelpCircle,
  Mail,
  Info,
  LogOut,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { toast } from 'sonner';

export function Settings() {
  const navigate = useNavigate();
  const { logout, clearHistory, scans, theme, setTheme, cameraPermission, setCameraPermission } = useAppContext();
  const [userEmail, setUserEmail] = React.useState<string | null>(null);

  React.useEffect(() => {
    import('../lib/supabase').then(({ supabase }) => {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user?.email) setUserEmail(data.user.email);
      });
    });
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleClearHistory = () => {
    if (scans.length === 0) {
      toast.info('No scan history to clear.');
      return;
    }
    if (window.confirm(`Delete all ${scans.length} scan records? This cannot be undone.`)) {
      clearHistory();
      toast.success('Scan history cleared.');
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    toast.success(`Switched to ${nextTheme === 'dark' ? 'Dark' : 'Light'} Mode!`);
  };

  const requestCameraPermission = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Camera access is not supported by this browser/device.");
        setCameraPermission('denied');
        return;
      }
      
      toast.loading("Testing camera permission...", { id: 'camera-perm' });
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      // Stop all tracks immediately
      stream.getTracks().forEach(track => track.stop());
      
      setCameraPermission('granted');
      toast.success("Camera permission granted successfully!", { id: 'camera-perm' });
    } catch (err) {
      console.error("Camera request failed:", err);
      setCameraPermission('denied');
      toast.error("Camera access denied or blocked.", { id: 'camera-perm' });
    }
  };

  const handleFutureReady = () => {
    toast.info('This feature is coming in the next update!');
  };

  return (
    <div className="flex flex-col h-full bg-navy-900 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-brand-primary/10 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-20 right-0 w-72 h-72 bg-brand-secondary/5 rounded-full blur-[100px] pointer-events-none z-0" />

      <header className="pt-safe pt-6 px-4 pb-4 flex items-center bg-navy-900/90 backdrop-blur-md sticky top-0 z-20 border-b border-white/5 md:max-w-7xl md:mx-auto md:w-full md:px-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-content-secondary hover:text-white rounded-xl bg-white/5 border border-white/5 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-black text-lg ml-3 text-white">Settings</h1>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 space-y-8 md:space-y-0 md:grid md:grid-cols-3 md:gap-6 pb-32 mt-2 relative z-10 md:max-w-7xl md:mx-auto md:w-full md:px-8 md:py-6">
        
        {/* Column 1: APP */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-content-secondary uppercase tracking-widest mb-3 px-1">
            App Settings
          </h3>
          <div className="glass-card border border-white/5 rounded-3xl overflow-hidden shadow-lg">
            <button
              onClick={() => navigate('/settings/notifications')}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors border-b border-white/5">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-brand-primary" />
                <span className="font-bold text-sm text-content-primary">Notifications</span>
              </div>
              <ChevronRight className="w-4 h-4 text-content-secondary" />
            </button>
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors border-b border-white/5">
              <div className="flex items-center gap-3">
                <Moon className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-sm text-content-primary">Theme</span>
              </div>
              <span className="text-xs text-content-secondary flex items-center gap-2 capitalize">
                {theme} <ChevronRight className="w-4 h-4" />
              </span>
            </button>
            <button
              onClick={requestCameraPermission}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <Camera className="w-4 h-4 text-brand-safe" />
                <span className="font-bold text-sm text-content-primary">Camera Permissions</span>
              </div>
              <span className="text-xs text-content-secondary flex items-center gap-2 capitalize">
                {cameraPermission === 'unknown' ? 'Request' : cameraPermission} <ChevronRight className="w-4 h-4" />
              </span>
            </button>
          </div>
        </section>

        {/* Column 2: DATA & PRIVACY */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-content-secondary uppercase tracking-widest mb-3 px-1">
            Data & Privacy
          </h3>
          <div className="glass-card border border-white/5 rounded-3xl overflow-hidden shadow-lg">
            <button
              onClick={handleClearHistory}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors border-b border-white/5">
              <div className="flex items-center gap-3">
                <Trash2 className="w-4 h-4 text-red-400" />
                <div className="text-left">
                  <span className="font-bold text-sm text-content-primary block">Clear Scan History</span>
                  <span className="text-[10px] text-content-secondary block font-semibold">
                    {scans.length} scan{scans.length !== 1 ? 's' : ''} stored
                  </span>
                </div>
              </div>
            </button>
            <button
              onClick={() => navigate('/privacy')}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors border-b border-white/5">
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-content-secondary" />
                <span className="font-bold text-sm text-content-primary">Privacy Policy</span>
              </div>
              <ChevronRight className="w-4 h-4 text-content-secondary" />
            </button>
            <button
              onClick={() => navigate('/terms')}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-content-secondary" />
                <span className="font-bold text-sm text-content-primary">Terms & Conditions</span>
              </div>
              <ChevronRight className="w-4 h-4 text-content-secondary" />
            </button>
          </div>
        </section>

        {/* Column 3: SUPPORT & ACCOUNT */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-content-secondary uppercase tracking-widest mb-3 px-1">
            Support & Account
          </h3>

          {userEmail && (
            <div className="glass-card border border-white/5 rounded-3xl p-4 flex items-center gap-4 shadow-lg mb-4">
              <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-brand-primary" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-[10px] text-content-secondary font-bold uppercase tracking-wider">Logged in as</span>
                <span className="text-sm font-bold text-white truncate">{userEmail}</span>
              </div>
            </div>
          )}

          <div className="glass-card border border-white/5 rounded-3xl overflow-hidden shadow-lg mb-4">
            <button
              onClick={() => navigate('/help')}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors border-b border-white/5">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-4 h-4 text-brand-primary" />
                <span className="font-bold text-sm text-white">Help & FAQ</span>
              </div>
              <ChevronRight className="w-4 h-4 text-content-secondary" />
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors border-b border-white/5">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-brand-primary" />
                <span className="font-bold text-sm text-white">Contact Support</span>
              </div>
              <ChevronRight className="w-4 h-4 text-content-secondary" />
            </button>
            <button
              onClick={() => navigate('/about')}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <Info className="w-4 h-4 text-content-secondary" />
                <span className="font-bold text-sm text-white">About Aavis</span>
              </div>
              <ChevronRight className="w-4 h-4 text-content-secondary" />
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-3xl p-4 font-bold hover:bg-red-500/20 active:scale-[0.98] transition-all">
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </section>

      </div>
    </div>
  );
}