import React, { useState } from 'react';
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
  UserX,
  BookOpen,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { toast } from 'sonner';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getApiUrl } from '../lib/apiConfig';
import { deleteAllUserScans } from '../lib/supabaseService';
import { motion, AnimatePresence } from 'framer-motion';

export function Settings() {
  const navigate = useNavigate();
  const { profile, updateProfile, logout, clearHistory, scans, theme, setTheme, cameraPermission, setCameraPermission, supabaseUserId } = useAppContext();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  const handleClearHistory = async () => {
    if (scans.length === 0) {
      toast.info('No scan history to clear.');
      return;
    }
    if (window.confirm(`Delete all ${scans.length} scan records? This cannot be undone.`)) {
      if (supabaseUserId) {
        toast.loading("Clearing history...", { id: 'clear-hist' });
        const success = await deleteAllUserScans(supabaseUserId);
        if (!success) {
          toast.error("Failed to clear cloud scan history.", { id: 'clear-hist' });
          return;
        }
      }
      clearHistory();
      toast.success('Scan history cleared.', { id: 'clear-hist' });
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

  const handleDeleteAccount = async () => {
    setShowDeleteConfirm(false);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error('You must be logged in to delete your account.');
      return;
    }

    toast.loading('Deleting account...', { id: 'delete-acc' });
    try {
      const res = await fetch(getApiUrl('/api/auth/delete-account'), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      toast.success('Account successfully deleted.', { id: 'delete-acc' });
      // clear local session
      logout();
      navigate('/login', { replace: true });
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete account', { id: 'delete-acc' });
    }
  };

  return (
    <div className="flex flex-col h-full bg-navy-900 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-brand-primary/10 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-20 right-0 w-72 h-72 bg-brand-secondary/5 rounded-full blur-[100px] pointer-events-none z-0" />

      <header className="pt-safe pt-6 px-4 pb-4 flex items-center bg-navy-900/90 backdrop-blur-md sticky top-0 z-20 border-b border-white/5 md:max-w-7xl md:mx-auto md:w-full md:px-8">
        <button data-testid='btn-settings-1'
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

            <button data-testid='btn-settings-2'
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

            <button data-testid='btn-settings-3'
              onClick={requestCameraPermission}
              className="w-full flex items-center justify-between py-5 px-4 hover:bg-white/5 transition-colors border-b border-white/5">
              <div className="flex items-center gap-4">
                <Camera className="w-5 h-5 text-brand-safe" />
                <span className="font-bold text-[15px] text-content-primary">Camera Permissions</span>
              </div>
              <span className="text-sm font-medium text-content-secondary flex items-center gap-2 capitalize">
                {cameraPermission === 'unknown' ? 'Request' : cameraPermission} <ChevronRight className="w-5 h-5" />
              </span>
            </button>
            <button data-testid='btn-settings-4'
              onClick={handleClearHistory}
              className="w-full flex items-center justify-between py-5 px-4 hover:bg-white/5 transition-colors">
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
          </div>
        </section>

        {/* Column 2: DATA & PRIVACY */}
        <section className="space-y-5">
          <h3 className="text-xs font-bold text-content-secondary uppercase tracking-widest px-1">
            Data & Privacy
          </h3>
          <div className="glass-card border border-white/5 rounded-3xl overflow-hidden shadow-sm">

            <button data-testid='btn-settings-5'
              onClick={() => navigate('/privacy')}
              className="w-full flex items-center justify-between py-5 px-4 hover:bg-white/5 transition-colors border-b border-white/5">
              <div className="flex items-center gap-4">
                <Shield className="w-5 h-5 text-content-secondary" />
                <span className="font-bold text-[15px] text-content-primary">Privacy Policy</span>
              </div>
              <ChevronRight className="w-5 h-5 text-content-secondary" />
            </button>
            <button data-testid='btn-settings-6'
              onClick={() => navigate('/terms')}
              className="w-full flex items-center justify-between py-5 px-4 hover:bg-white/5 transition-colors border-b border-white/5">
              <div className="flex items-center gap-4">
                <FileText className="w-5 h-5 text-content-secondary" />
                <span className="font-bold text-[15px] text-content-primary">Terms & Conditions</span>
              </div>
              <ChevronRight className="w-5 h-5 text-content-secondary" />
            </button>
            <button data-testid='btn-settings-delete-account'
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-between py-5 px-4 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-4">
                <UserX className="w-5 h-5 text-red-500" />
                <span className="font-bold text-[15px] text-red-500">Delete Account</span>
              </div>
            </button>
          </div>
        </section>

        {/* Column 3: SUPPORT & ACCOUNT */}
        <section className="space-y-5">
          <h3 className="text-xs font-bold text-content-secondary uppercase tracking-widest px-1">
            Support & Guides
          </h3>

          <div className="glass-card border border-white/5 rounded-3xl overflow-hidden shadow-sm">
            <button data-testid='btn-settings-7'
              onClick={() => navigate('/help')}
              className="w-full flex items-center justify-between py-5 px-4 hover:bg-white/5 transition-colors border-b border-white/5">
              <div className="flex items-center gap-4">
                <HelpCircle className="w-5 h-5 text-brand-primary" />
                <span className="font-bold text-[15px] text-content-primary">Help & FAQ</span>
              </div>
              <ChevronRight className="w-5 h-5 text-content-secondary" />
            </button>
            <button data-testid='btn-settings-8'
              onClick={() => navigate('/contact')}
              className="w-full flex items-center justify-between py-5 px-4 hover:bg-white/5 transition-colors border-b border-white/5">
              <div className="flex items-center gap-4">
                <Mail className="w-5 h-5 text-brand-primary" />
                <span className="font-bold text-[15px] text-content-primary">Contact Support</span>
              </div>
              <ChevronRight className="w-5 h-5 text-content-secondary" />
            </button>
            <button data-testid='btn-settings-9'
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
            <button data-testid='btn-settings-10'
              onClick={() => {
                logout();
                navigate('/login');
                toast.success('Logged out successfully');
              }}
              className="w-full flex items-center justify-between py-5 px-4 hover:bg-white/5 transition-colors text-[#ed0e0e]">
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

      {/* Delete Account Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeleteConfirmationText('');
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm glass-card rounded-3xl p-6 shadow-2xl border border-white/10"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                <UserX className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-display font-bold text-white mb-2">Delete Account?</h3>
              <p className="text-content-secondary text-sm mb-4">
                Are you absolutely sure you want to delete your account? This action is permanent and will delete all your data.
              </p>
              <div className="mb-6">
                <label className="block text-xs font-bold text-content-secondary mb-2 uppercase tracking-wider text-center">
                  Type DELETE to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full glass-input border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-content-secondary/50 font-mono text-center tracking-widest focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmationText('');
                  }}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-white/10 hover:bg-white/15 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmationText !== 'DELETE'}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:hover:bg-red-500 transition-colors shadow-lg shadow-red-500/20"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}