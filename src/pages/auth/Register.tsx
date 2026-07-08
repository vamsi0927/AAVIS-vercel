import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { getOrCreateUser } from '../../lib/supabaseService';
import { getApiUrl } from '../../lib/apiConfig';
import logoImg from '../../assets/logo.png';

export function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'register' | 'verify'>('register');
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) return;
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    
    try {
      const res = await fetch(getApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          name
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign up');
      }

      setStep('verify');
    } catch (err: any) {
      // Show clean user-facing message, not raw JSON
      const msg = err.message || '';
      if (msg.includes('failed to send verification email')) {
        toast.error('Account created, but we could not send the verification email. Please contact support.');
      } else if (msg.startsWith('{') || msg.startsWith('[')) {
        toast.error('Registration failed. Please try again.');
      } else {
        toast.error(msg || 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp,
        type: 'signup'
      });

      if (error) {
        toast.error(error.message || 'Invalid or expired verification code');
        return;
      }

      // Create profile in users table
      if (data.user) {
        await getOrCreateUser(data.user.email || email.trim(), name);
      }

      toast.success('Account verified successfully! 🎉');
      navigate('/onboarding', { replace: true });
    } catch (err: any) {
      toast.error('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-navy-900 px-6 py-8 overflow-y-auto no-scrollbar relative">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 bg-brand-primary/10 rounded-full blur-[80px]" />
      <div className="absolute bottom-1/4 left-1/4 w-60 h-60 bg-brand-secondary/5 rounded-full blur-[80px]" />

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-card rounded-3xl p-6 border border-white/5 shadow-2xl"
        >
          <div className="mb-6 text-center">
            <div className="w-16 h-16 flex items-center justify-center relative mx-auto mb-3">
              <div className="absolute inset-0 bg-brand-primary/20 rounded-full blur-md animate-pulse" />
              <img src={logoImg} alt="Aavis Logo" className="w-16 h-16 object-contain relative z-10" />
            </div>
            <h1 className="text-2xl font-display font-black tracking-tight text-white mb-1">
              {step === 'register' ? 'Create Account' : ''}
            </h1>
            <p className="text-content-secondary text-sm">
              {step === 'register' ? 'Join Aavis to eat healthier' : ''}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {step === 'register' ? (
              <motion.form 
                key="register"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleRegister} 
                className="space-y-4"
              >
                {/* Full Name */}
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-content-secondary" />
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full glass-input rounded-2xl py-3.5 pl-11 pr-4 text-white text-sm placeholder:text-content-secondary"
                  />
                </div>

                {/* Email */}
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-content-secondary" />
                  <input
                    type="email"
                    required
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full glass-input rounded-2xl py-3.5 pl-11 pr-4 text-white text-sm placeholder:text-content-secondary"
                  />
                </div>

                {/* Password with eye toggle */}
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-content-secondary" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Password (min. 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full glass-input rounded-2xl py-3.5 pl-11 pr-12 text-white text-sm placeholder:text-content-secondary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-content-secondary hover:text-white transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>

                {/* Confirm Password with eye toggle */}
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-content-secondary" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full glass-input rounded-2xl py-3.5 pl-11 pr-12 text-white text-sm placeholder:text-content-secondary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-content-secondary hover:text-white transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={!name || !email || !password || !confirmPassword || isLoading}
                  className="w-full bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-95 disabled:opacity-50 text-white rounded-2xl py-3.5 font-bold text-base flex items-center justify-center gap-2 transition-all mt-6 shadow-lg shadow-brand-primary/20"
                >
                  {isLoading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Creating Account...</>
                  ) : (
                    <>Sign Up <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.div 
                key="verify"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6 text-center py-4"
              >
                <div className="w-16 h-16 mx-auto bg-brand-primary/20 rounded-full flex items-center justify-center mb-6">
                  <Mail className="w-8 h-8 text-brand-primary" />
                </div>
                <p className="text-content-secondary text-sm">
                  We've sent a verification link to <span className="text-white font-medium">{email}</span>. Please click the link to activate your account.
                </p>
                <p className="text-brand-safe text-xs font-medium bg-brand-safe/10 py-2 px-3 rounded-lg mt-4 inline-block">
                  Note: If you don't see the email, please check your spam or junk folder.
                </p>
                <p className="text-content-secondary text-xs mt-4">
                  Once you have verified your email, you can safely close this screen.
                </p>

                <button
                  type="button"
                  onClick={() => setStep('register')}
                  className="w-full bg-transparent border border-white/10 hover:bg-white/5 text-white rounded-2xl py-3.5 font-medium text-sm transition-all mt-6"
                >
                  Edit email address
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {step === 'register' && (
            <p className="text-center text-xs text-content-secondary mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-primary font-bold hover:underline">
                Sign in
              </Link>
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}