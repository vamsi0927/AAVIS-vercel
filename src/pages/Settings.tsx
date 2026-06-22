import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Moon,
  Camera,
  Trash2,
  Shield,
  FileText,
  HelpCircle,
  Mail,
  Info,
  LogOut,
  User,
  BookOpen,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { toast } from 'sonner';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export function Settings() {
  const navigate = useNavigate();
  const { profile, updateProfile, logout, clearHistory, scans, theme, setTheme, cameraPermission, setCameraPermission } = useAppContext();

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
        <section className="space-y-5">
          <h3 className="text-xs font-bold text-content-secondary uppercase tracking-widest px-1">
            App Settings
          </h3>
          <div className="glass-card border border-white/5 rounded-3xl overflow-hidden shadow-sm">

            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between py-5 px-4 hover:bg-white/5 transition-colors border-b border-white/5">
              <div className="flex items-center gap-4">
                <Moon className="w-5 h-5 text-indigo-400" />
                <span className="font-bold text-[15px] text-content-primary">Theme</span>
              </div>
              <span className="text-sm font-medium text-content-secondary flex items-center gap-2 capitalize">
                {theme} <ChevronRight className="w-5 h-5" />
              </span>
            </button>
            <button
              onClick={requestCameraPermission}
              className="w-full flex items-center justify-between py-5 px-4 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-4">
                <Camera className="w-5 h-5 text-brand-safe" />
                <span className="font-bold text-[15px] text-content-primary">Camera Permissions</span>
              </div>
              <span className="text-sm font-medium text-content-secondary flex items-center gap-2 capitalize">
                {cameraPermission === 'unknown' ? 'Request' : cameraPermission} <ChevronRight className="w-5 h-5" />
              </span>
            </button>
          </div>
        </section>

        {/* Column 2: DATA & PRIVACY */}
        <section className="space-y-5">
          <h3 className="text-xs font-bold text-content-secondary uppercase tracking-widest px-1">
            Data & Privacy
          </h3>
          <div className="glass-card border border-white/5 rounded-3xl overflow-hidden shadow-sm">
            <button
              onClick={handleClearHistory}
              className="w-full flex items-center justify-between py-5 px-4 hover:bg-white/5 transition-colors border-b border-white/5">
              <div className="flex items-center gap-4">
                <Trash2 className="w-5 h-5 text-red-400" />
                <div className="text-left flex flex-col">
                  <span className="font-bold text-[15px] text-content-primary">Clear Scan History</span>
                  <span className="text-xs font-medium text-content-secondary">
                    {scans.length} scan{scans.length !== 1 ? 's' : ''} stored
                  </span>
                </div>
              </div>
            </button>
            <button
              onClick={() => navigate('/privacy')}
              className="w-full flex items-center justify-between py-5 px-4 hover:bg-white/5 transition-colors border-b border-white/5">
              <div className="flex items-center gap-4">
                <Shield className="w-5 h-5 text-content-secondary" />
                <span className="font-bold text-[15px] text-content-primary">Privacy Policy</span>
              </div>
              <ChevronRight className="w-5 h-5 text-content-secondary" />
            </button>
            <button
              onClick={() => navigate('/terms')}
              className="w-full flex items-center justify-between py-5 px-4 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-4">
                <FileText className="w-5 h-5 text-content-secondary" />
                <span className="font-bold text-[15px] text-content-primary">Terms & Conditions</span>
              </div>
              <ChevronRight className="w-5 h-5 text-content-secondary" />
            </button>
          </div>
        </section>

        {/* Column 3: SUPPORT & ACCOUNT */}
        <section className="space-y-5">
          <h3 className="text-xs font-bold text-content-secondary uppercase tracking-widest px-1">
            Support & Guides
          </h3>

          <div className="glass-card border border-white/5 rounded-3xl overflow-hidden shadow-sm">
            <button
              onClick={() => navigate('/education/additives')}
              className="w-full flex items-center justify-between py-5 px-4 hover:bg-white/5 transition-colors border-b border-white/5">
              <div className="flex items-center gap-4">
                <BookOpen className="w-5 h-5 text-brand-primary" />
                <span className="font-bold text-[15px] text-content-primary">E-Numbers Guide</span>
              </div>
              <ChevronRight className="w-5 h-5 text-content-secondary" />
            </button>
            <button
              onClick={() => navigate('/help')}
              className="w-full flex items-center justify-between py-5 px-4 hover:bg-white/5 transition-colors border-b border-white/5">
              <div className="flex items-center gap-4">
                <HelpCircle className="w-5 h-5 text-brand-primary" />
                <span className="font-bold text-[15px] text-content-primary">Help & FAQ</span>
              </div>
              <ChevronRight className="w-5 h-5 text-content-secondary" />
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="w-full flex items-center justify-between py-5 px-4 hover:bg-white/5 transition-colors border-b border-white/5">
              <div className="flex items-center gap-4">
                <Mail className="w-5 h-5 text-brand-primary" />
                <span className="font-bold text-[15px] text-content-primary">Contact Support</span>
              </div>
              <ChevronRight className="w-5 h-5 text-content-secondary" />
            </button>
            <button
              onClick={() => navigate('/about')}
              className="w-full flex items-center justify-between py-5 px-4 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-4">
                <Info className="w-5 h-5 text-content-secondary" />
                <span className="font-bold text-[15px] text-content-primary">About Aavis</span>
              </div>
              <ChevronRight className="w-5 h-5 text-content-secondary" />
            </button>
          </div>
        </section>

        {/* Column 4: ACCOUNT */}
        <section className="space-y-5 md:hidden">
          <h3 className="text-xs font-bold text-content-secondary uppercase tracking-widest px-1">
            Account
          </h3>
          <div className="glass-card border border-white/5 rounded-3xl overflow-hidden shadow-sm">
            <button
              onClick={() => {
                logout();
                navigate('/login');
                toast.success('Logged out successfully');
              }}
              className="w-full flex items-center justify-between py-5 px-4 hover:bg-white/5 transition-colors text-brand-hazardous">
              <div className="flex items-center gap-4">
                <LogOut className="w-5 h-5" />
                <span className="font-bold text-[15px]">Sign Out</span>
              </div>
            </button>
          </div>
        </section>

        {/* App Version */}
        <div className="col-span-1 md:col-span-3 flex justify-center items-center mt-8 pt-8">
          <p className="text-xs font-semibold text-content-secondary/40 tracking-widest uppercase">Aavis Version 1.0.0 (Build 42)</p>
        </div>

      </div>
    </div>
  );
}