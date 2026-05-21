import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import logoImg from '../../assets/logo.png';

export function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setIsSending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setIsSending(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password reset link sent to your email!');
    }
  };

  return (
    <div className="flex flex-col h-full bg-navy-900 px-6 py-8 overflow-y-auto no-scrollbar relative">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 bg-brand-primary/10 rounded-full blur-[80px]" />
      
      <header className="absolute top-safe pt-4 left-6 z-20">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-white/5 border border-white/5 text-content-secondary hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
      </header>

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-card rounded-3xl p-6 border border-white/5 shadow-2xl"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 flex items-center justify-center relative mx-auto mb-3">
              <div className="absolute inset-0 bg-brand-primary/20 rounded-full blur-md animate-pulse" />
              <img src={logoImg} alt="Aavis Logo" className="w-16 h-16 object-contain relative z-10" />
            </div>
            <h1 className="text-2xl font-display font-black tracking-tight text-white mb-1">Reset Password</h1>
            <p className="text-content-secondary text-sm">
              We'll send you a recovery link to access your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-content-secondary" />
              <input
                type="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full glass-input rounded-2xl py-3.5 pl-11 pr-4 text-white text-sm placeholder:text-content-secondary"
              />
            </div>

            <button
              type="submit"
              disabled={isSending}
              className="w-full bg-gradient-brand hover:opacity-95 disabled:opacity-50 text-white rounded-2xl py-3.5 font-bold text-base flex items-center justify-center gap-2 transition-all mt-6 shadow-lg shadow-brand-primary/20"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Sending...
                </>
              ) : (
                <>
                  Send Link <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
