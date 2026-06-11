import { useState, FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Lock, Loader2, ArrowRight, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import logoImg from '../../assets/logo.png';

export function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  const token = searchParams.get('token');
  const uid = searchParams.get('uid');

  const validations = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  const isValid = Object.values(validations).every(Boolean) && password === confirmPassword && password.length > 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!Object.values(validations).every(Boolean)) {
      toast.error('Password does not meet requirements');
      return;
    }

    if (!token || !uid) {
      toast.error('Invalid or missing reset token. Please request a new password reset link.');
      return;
    }

    setIsUpdating(true);
    
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          uid,
          newPassword: password
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }
      
      toast.success(data.message || 'Password updated successfully! Please sign in.');
      navigate('/login', { replace: true });
    } catch (err: any) {
      toast.error(err.message || 'An error occurred during password reset');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-navy-900 px-6 py-8 overflow-y-auto no-scrollbar relative">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 bg-brand-primary/10 rounded-full blur-[80px]" />

      <header className="absolute top-safe pt-4 left-6 z-20">
        <button onClick={() => navigate('/login')} className="p-2 rounded-full bg-white/5 border border-white/5 text-content-secondary hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
      </header>

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full relative z-10 mt-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-card rounded-3xl p-6 border border-white/5 shadow-2xl"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 flex items-center justify-center relative mx-auto mb-3">
              <div className="absolute inset-0 bg-brand-primary/20 rounded-full blur-md animate-pulse" />
              <img src={logoImg} alt="Aavis Logo" className="w-16 h-16 object-contain relative z-10" />
            </div>
            <h1 className="text-2xl font-display font-black tracking-tight text-white mb-1">Reset Password</h1>
            <p className="text-content-secondary text-sm">
              Create a new strong password for your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-content-secondary" />
              <input
                type="password"
                required
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full glass-input rounded-2xl py-3.5 pl-11 pr-4 text-white text-sm placeholder:text-content-secondary"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-content-secondary" />
              <input
                type="password"
                required
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full glass-input rounded-2xl py-3.5 pl-11 pr-4 text-white text-sm placeholder:text-content-secondary"
              />
            </div>

            {/* Validation Checklist */}
            <div className="bg-navy-900/40 rounded-2xl p-4 space-y-2 border border-navy-700/50">
              <p className="text-[10px] font-bold uppercase tracking-wider text-content-secondary mb-2">Requirements</p>
              <ValidationItem satisfied={validations.minLength} label="At least 8 characters" />
              <ValidationItem satisfied={validations.hasUpper} label="Contains uppercase letter" />
              <ValidationItem satisfied={validations.hasLower} label="Contains lowercase letter" />
              <ValidationItem satisfied={validations.hasNumber} label="Contains number" />
              <ValidationItem satisfied={validations.hasSpecial} label="Contains special character" />
              <ValidationItem satisfied={password === confirmPassword && password.length > 0} label="Passwords match" />
            </div>

            <button
              type="submit"
              disabled={!isValid || isUpdating}
              className="w-full bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-95 disabled:opacity-50 text-white rounded-2xl py-3.5 font-bold text-base flex items-center justify-center gap-2 transition-all mt-6 shadow-lg shadow-brand-primary/20"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Updating...
                </>
              ) : (
                <>
                  Reset Password <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

function ValidationItem({ satisfied, label }: { satisfied: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {satisfied ? (
        <Check className="w-3.5 h-3.5 text-emerald-500" />
      ) : (
        <X className="w-3.5 h-3.5 text-content-secondary" />
      )}
      <span className={satisfied ? 'text-white/90' : 'text-content-secondary'}>{label}</span>
    </div>
  );
}
