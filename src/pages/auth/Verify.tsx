import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getApiUrl } from '../../lib/apiConfig';
import { toast } from 'sonner';

export function Verify() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success-same-device' | 'success-cross-device' | 'error' | 'app-redirect'>('loading');
  const [appRedirectLink, setAppRedirectLink] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showLoader, setShowLoader] = useState(false);
  const verifyAttempted = useRef(false);

  useEffect(() => {
    // Only attempt verification once
    if (verifyAttempted.current) return;
    verifyAttempted.current = true;

    const link = searchParams.get('link');
    const source = searchParams.get('source') || 'web-desktop';

    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    const isSameDevice = (() => {
      if (source === 'app-android') return isAndroid;
      if (source === 'app-ios') return isIOS;
      return localStorage.getItem('aavis_signup_session') === 'active';
    })();

    const isAppSource = source.startsWith('app-');
    const isCapableOfOpeningApp = (source === 'app-android' && isAndroid) || (source === 'app-ios' && isIOS);
    const shouldAttemptDeepLink = isAppSource && isCapableOfOpeningApp;

    if (!link) {
      // If there's no link, check session quickly.
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

    const verify = async (linkParam: string) => {
      try {
        const res = await fetch(getApiUrl('/api/auth/verifyLink'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ link: linkParam })
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

        // Clear local signup session
        localStorage.removeItem('aavis_signup_session');

        if (isSameDevice) {
          setStatus('success-same-device');
          // If we showed the loader, give a brief 1-second success state before redirecting
          if (showLoader) {
            setTimeout(() => navigate('/onboarding', { replace: true }), 1000);
          } else {
            navigate('/onboarding', { replace: true });
          }
        } else {
          setStatus('success-cross-device');
        }
      } catch (err: any) {
        clearTimeout(loaderTimer);
        setStatus('error');
        setErrorMsg(err.message || 'Verification failed. Please try again.');
        toast.error('Verification failed');
      }
    };

    const checkSessionAndVerify = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          clearTimeout(loaderTimer);
          localStorage.removeItem('aavis_signup_session');
          if (isSameDevice) {
            setStatus('success-same-device');
            navigate('/onboarding', { replace: true });
          } else {
            setStatus('success-cross-device');
          }
          return;
        }

        if (shouldAttemptDeepLink) {
          clearTimeout(loaderTimer);
          const appLink = `aavis://verify?link=${encodeURIComponent(link)}`;
          setStatus('app-redirect');
          setAppRedirectLink(appLink);
          
          try {
            window.location.href = appLink;
          } catch (e) {
            console.error('[Verify] App redirect failed:', e);
          }
        } else {
          verify(link);
        }
      } catch (err) {
        console.error('[Verify] Pre-verification error:', err);
        verify(link);
      }
    };

    checkSessionAndVerify();

    return () => clearTimeout(loaderTimer);
  }, [navigate, searchParams, showLoader]);

  // If it's fast (<500ms), we just show nothing or a tiny spinner until redirect/state update happens
  if (!showLoader && status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-900">
         <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
      </div>
    );
  }

  const isSuccessState = status === 'success-same-device' || status === 'success-cross-device';

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-navy-900">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-primary/20 via-navy-900 to-navy-900 pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="glass-card p-8 rounded-[2rem] border border-white/10 shadow-2xl flex flex-col items-center text-center">
          
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
            {status === 'loading' && <Loader2 className="w-10 h-10 text-brand-primary animate-spin" />}
            {status === 'app-redirect' && <CheckCircle className="w-10 h-10 text-brand-primary" />}
            {isSuccessState && <CheckCircle className="w-10 h-10 text-brand-primary animate-bounce-soft" />}
            {status === 'error' && <XCircle className="w-10 h-10 text-red-500 animate-bounce-soft" />}
          </div>

          {status === 'success-cross-device' ? (
            <div className="w-full">
              <h2 className="text-2xl font-display font-black text-white mb-4">
                Email Verified Successfully
              </h2>
              <div className="space-y-4 text-content-secondary mb-8">
                <p>Your account is now verified.</p>
                <p>You can continue using AAVIS on this device.</p>
                <p className="text-sm opacity-80 pt-2 border-t border-white/5">
                  If you'd like to continue on another device, simply open AAVIS there and sign in with your verified account.
                </p>
              </div>
              <button 
                data-testid="btn-verify-continue"
                onClick={() => navigate('/onboarding', { replace: true })}
                className="w-full py-3.5 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl font-bold transition-colors shadow-lg shadow-brand-primary/20"
              >
                Continue
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-display font-black text-white mb-2">
                {status === 'loading' && 'Verifying...'}
                {status === 'app-redirect' && 'Open in App'}
                {status === 'success-same-device' && 'Email Verified!'}
                {status === 'error' && 'Verification Failed'}
              </h2>
              
              <p className="text-content-secondary mb-2">
                {status === 'loading' && 'Please wait while we confirm your email address.'}
                {status === 'app-redirect' && 'Tap below to continue to the AAVIS mobile app.'}
                {status === 'success-same-device' && 'Your account has been successfully verified.'}
                {status === 'error' && errorMsg}
              </p>

              {status === 'success-same-device' && (
                <p className="text-sm font-bold text-brand-primary animate-pulse mt-4">
                  Taking you to the app...
                </p>
              )}

              {status === 'app-redirect' && (
                <div className="flex flex-col w-full mt-6 gap-3">
                  <button data-testid='btn-verify-app'
                    onClick={() => { window.location.href = appRedirectLink; }}
                    className="w-full py-3.5 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl font-bold transition-colors shadow-lg shadow-brand-primary/20"
                  >
                    Open AAVIS App
                  </button>
                  <button data-testid='btn-verify-web-fallback'
                    onClick={() => {
                      setStatus('loading');
                      const link = searchParams.get('link');
                      if (link) {
                        // Directly trigger web verification
                        // In case of app fallback verify, we consider it same device if it was from phone
                        verify(link);
                      }
                    }}
                    className="text-content-secondary text-sm hover:text-white transition-colors"
                  >
                    Continue in browser
                  </button>
                </div>
              )}

              {status === 'error' && (
                <button data-testid='btn-verify-1'
                  onClick={() => navigate('/login')}
                  className="mt-6 px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
                >
                  Go to Login
                </button>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
