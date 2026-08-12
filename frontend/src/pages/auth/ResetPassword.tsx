import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Lock, Loader2, ArrowRight, Check, X, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { getApiUrl } from '../../lib/apiConfig';
import logoImg from '../../assets/logo.png';

export function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
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

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, navigate]);

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
      const res = await fetch(getApiUrl('/api/auth/reset-password'), {
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
        const msg = data.error || 'Failed to reset password';
        throw new Error(msg.startsWith('{') ? 'Failed to reset password. Please try again.' : msg);
      }
      
      toast.success(data.message || 'Password reset successfully');
      setIsSuccess(true);
    } catch (err: any) {
      const msg = err.message || 'An error occurred during password reset';
      toast.error(msg.startsWith('{') || msg.startsWith('[') ? 'An error occurred. Please try again.' : msg);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-navy-900 px-6 py-8 overflow-y-auto no-scrollbar relative">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 bg-brand-primary/10 rounded-full blur-[80px]" />

      <header className="absolute top-safe pt-4 left-6 z-20">
        {!isSuccess && (
          <button data-testid='btn-resetpassword-1' onClick={() => navigate('/login')} className="p-2 rounded-full bg-white/5 border border-white/5 text-content-secondary hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
      </header>

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full relative z-10 mt-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-card rounded-3xl p-6 border border-white/5 shadow-2xl overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck className="w-10 h-10 text-emerald-500" />
                </div>
                <h1 className="text-2xl font-display font-bold text-white mb-2">Password reset successfully</h1>
                <p className="text-content-secondary text-sm mb-8">
                  Your password has been securely updated. You will be redirected to the sign in page shortly.
                </p>
                <button
                  onClick={() => navigate('/login', { replace: true })}
                  className="w-full bg-white text-navy-900 hover:bg-gray-100 rounded-2xl py-3.5 font-bold transition-all shadow-lg"
                >
                  Go to Sign In
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 flex items-center justify-center relative mx-auto mb-3">
                    <div className="absolute inset-0 bg-brand-primary/20 rounded-full blur-md animate-pulse" />
                    <img src={logoImg} alt="Aavis Logo" className="w-16 h-16 object-contain relative z-10" />
                  </div>
                  <h1 className="text-2xl font-display font-black tracking-tight text-white mb-1">Set New Password</h1>
                  <p className="text-content-secondary text-sm">
                    Create a new strong password for your account.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* New password with eye toggle */}
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-content-secondary" />
                    <input data-testid='input-resetpassword-1'
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="New password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full glass-input rounded-2xl py-3.5 pl-11 pr-12 text-white text-sm placeholder:text-content-secondary"
                    />
                    <button data-testid='btn-resetpassword-2'
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-content-secondary hover:text-white transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Confirm password with eye toggle */}
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-content-secondary" />
                    <input data-testid='input-resetpassword-2'
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full glass-input rounded-2xl py-3.5 pl-11 pr-12 text-white text-sm placeholder:text-content-secondary"
                    />
                    <button data-testid='btn-resetpassword-3'
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-content-secondary hover:text-white transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
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

                  <button data-testid='btn-resetpassword-4'
                    type="submit"
                    disabled={!isValid || isUpdating}
                    className="w-full bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-95 disabled:opacity-50 text-white rounded-2xl py-3.5 font-bold text-base flex items-center justify-center gap-2 transition-all mt-6 shadow-lg shadow-brand-primary/20"
                  >
                    {isUpdating ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Updating...</>
                    ) : (
                      <>Reset Password <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                  
                  <p className="text-center text-xs text-content-secondary mt-6">
                    Remember your password?{' '}
                    <Link to="/login" className="text-brand-primary font-bold hover:underline">
                      Sign In
                    </Link>
                  </p>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
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
