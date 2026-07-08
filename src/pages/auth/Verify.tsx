import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

export function Verify() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [showLoader, setShowLoader] = useState(false);
  const verifyAttempted = useRef(false);

  useEffect(() => {
    // Only attempt verification once
    if (verifyAttempted.current) return;
    verifyAttempted.current = true;

    const link = searchParams.get('link');

    if (!link) {
      // If there's no link, maybe Supabase auto-logged us in via hash fragment,
      // or the link is invalid. Check session quickly.
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          navigate('/onboarding', { replace: true });
        } else {
          setStatus('error');
          setErrorMsg('Invalid verification link.');
        }
      });
      return;
    }

    // Start a timer: if verification takes > 500ms, we show the loader UI
    const loaderTimer = setTimeout(() => setShowLoader(true), 500);

    const verify = async () => {
      try {
        const link = searchParams.get('link');
        
        if (!link) {
          throw new Error('Invalid verification link format.');
        }

        // Call our backend to manually extract the session from the action_link
        const res = await fetch('/api/auth/verifyLink', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ link })
        });

        const data = await res.json();
        clearTimeout(loaderTimer);

        if (!res.ok || !data.session) {
          throw new Error(data.error || 'Verification failed');
        }

        // Establish the session locally
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });

        if (sessionError) throw sessionError;

        // Verification successful, session established
        setStatus('success');
        
        // If we showed the loader, give a brief 1-second success state before redirecting
        // If we were faster than 500ms, redirect immediately
        if (showLoader) {
          setTimeout(() => navigate('/onboarding', { replace: true }), 1000);
        } else {
          navigate('/onboarding', { replace: true });
        }
        
      } catch (err: any) {
        clearTimeout(loaderTimer);
        setStatus('error');
        setErrorMsg(err.message || 'Verification failed. Please try again.');
        toast.error('Verification failed');
      }
    };

    verify();

    return () => clearTimeout(loaderTimer);
  }, [navigate, searchParams, showLoader]);

  // If it's fast (<500ms), we just show nothing or a tiny spinner until redirect happens
  if (!showLoader && status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-900">
         <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-navy-900">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-primary/20 via-navy-900 to-navy-900 pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="glass-card p-8 rounded-[2rem] border border-white/10 shadow-2xl flex flex-col items-center text-center">
          
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
            {status === 'loading' && <Loader2 className="w-10 h-10 text-brand-primary animate-spin" />}
            {status === 'success' && <CheckCircle className="w-10 h-10 text-brand-primary animate-bounce-soft" />}
            {status === 'error' && <XCircle className="w-10 h-10 text-red-500 animate-bounce-soft" />}
          </div>

          <h2 className="text-2xl font-display font-black text-white mb-2">
            {status === 'loading' && 'Verifying...'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </h2>
          
          <p className="text-content-secondary mb-2">
            {status === 'loading' && 'Please wait while we confirm your email address.'}
            {status === 'success' && 'Your account has been successfully verified.'}
            {status === 'error' && errorMsg}
          </p>

          {status === 'success' && (
            <p className="text-sm font-bold text-brand-primary animate-pulse mt-4">
              Taking you to the app...
            </p>
          )}

          {status === 'error' && (
            <button
              onClick={() => navigate('/login')}
              className="mt-6 px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
            >
              Go to Login
            </button>
          )}

        </div>
      </div>
    </div>
  );
}
