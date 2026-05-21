import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { getOrCreateUser } from '../../lib/supabaseService';
import { useAppContext } from '../../context/AppContext';
import logoImg from '../../assets/logo.png';

export function Register() {
  const navigate = useNavigate();
  const { hasCompletedOnboarding } = useAppContext();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    
    try {
      // 1. Create Supabase Auth user
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { name }, // Store name in user_metadata
        },
      });

      if (error) {
        // Simplify Supabase password policy errors
        let msg = error.message || 'Failed to sign up';
        if (msg.toLowerCase().includes('password')) {
          msg = 'Password must be at least 6 characters.';
        }
        toast.error(msg);
        setIsLoading(false);
        return;
      }

      // 2. Create profile in users table
      if (data.user) {
        await getOrCreateUser(data.user.email || email.trim(), name);
      }

      toast.success('Account created successfully! 🎉');
      
      // If email confirmation is disabled, user can login immediately
      if (data.session) {
        navigate('/onboarding', { replace: true });
      } else {
        // Email confirmation might be required
        toast.info('Please check your email to confirm your account, or log in directly.');
        navigate('/login', { replace: true });
      }
    } catch (err: any) {
      toast.error('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-navy-900 px-6 py-8 overflow-y-auto no-scrollbar relative">
      {/* Background glow effects */}
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
            <h1 className="text-2xl font-display font-black tracking-tight text-white mb-1">Create Account</h1>
            <p className="text-content-secondary text-sm">
              Join Aavis to eat healthier
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
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

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-content-secondary" />
              <input
                type="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full glass-input rounded-2xl py-3.5 pl-11 pr-4 text-white text-sm placeholder:text-content-secondary"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-content-secondary" />
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full glass-input rounded-2xl py-3.5 pl-11 pr-4 text-white text-sm placeholder:text-content-secondary"
              />
            </div>

            <button
              type="submit"
              disabled={!name || !email || !password || isLoading}
              className="w-full bg-gradient-brand hover:opacity-95 disabled:opacity-50 text-white rounded-2xl py-3.5 font-bold text-base flex items-center justify-center gap-2 transition-all mt-6 shadow-lg shadow-brand-primary/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Creating Account...
                </>
              ) : (
                <>
                  Sign Up <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-content-secondary mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-primary font-bold hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}