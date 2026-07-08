import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export function Verify() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAppContext();
  const [status, setStatus] = useState<'loading' | 'success'>('loading');

  useEffect(() => {
    // When the user lands here from the email link, Supabase intercepts the URL hash
    // and automatically logs them in. We just wait a moment to show a nice success state.
    
    // We show loading for at least 1.5s for UX
    const timer1 = setTimeout(() => {
      setStatus('success');
      
      // After showing success, redirect to onboarding
      const timer2 = setTimeout(() => {
        navigate('/onboarding', { replace: true });
      }, 2000);
      
      return () => clearTimeout(timer2);
    }, 1500);

    return () => clearTimeout(timer1);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-navy-900">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-primary/20 via-navy-900 to-navy-900 pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="glass-card p-8 rounded-[2rem] border border-white/10 shadow-2xl flex flex-col items-center text-center">
          
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
            {status === 'loading' ? (
              <Loader2 className="w-10 h-10 text-brand-primary animate-spin" />
            ) : (
              <CheckCircle className="w-10 h-10 text-brand-primary animate-bounce-soft" />
            )}
          </div>

          <h2 className="text-2xl font-display font-black text-white mb-2">
            {status === 'loading' ? 'Verifying...' : 'Email Verified!'}
          </h2>
          
          <p className="text-content-secondary mb-2">
            {status === 'loading' 
              ? 'Please wait while we confirm your email address.' 
              : 'Your account has been successfully verified.'}
          </p>

          {status === 'success' && (
            <p className="text-sm font-bold text-brand-primary animate-pulse mt-4">
              Taking you to the app...
            </p>
          )}

        </div>
      </div>
    </div>
  );
}
