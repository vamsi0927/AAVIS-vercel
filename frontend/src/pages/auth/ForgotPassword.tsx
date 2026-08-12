import { useState, FormEvent, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { getApiUrl } from '../../lib/apiConfig';
import logoImg from '../../assets/logo.png';

export function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step === 'otp') {
      inputRefs.current[0]?.focus();
    }
  }, [step]);

  const handleSendOTP = async (e: FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch(getApiUrl('/api/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        const msg = data.error || 'Failed to send OTP';
        throw new Error(msg.startsWith('{') ? 'Failed to send OTP. Please try again.' : msg);
      }
      
      toast.success(data.message || 'Password reset OTP sent to your email!');
      setStep('otp');
    } catch (err: any) {
      const msg = err.message || 'An error occurred';
      toast.error(msg.startsWith('{') || msg.startsWith('[') ? 'An error occurred. Please try again.' : msg);
    } finally {
      setIsSending(false);
    }
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (value && index === 5) {
      const fullCode = [...newOtp].join('');
      if (fullCode.length === 6) {
        handleVerifyOTP(undefined, fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      handleVerifyOTP(undefined, pasted);
    }
  };

  const handleVerifyOTP = async (e?: FormEvent, code?: string) => {
    e?.preventDefault();
    const enteredCode = code || otp.join('');
    if (enteredCode.length < 6) {
      toast.error('Please enter the full 6-digit code');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch(getApiUrl('/api/auth/verify-reset-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: enteredCode }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Invalid or expired OTP');
      }
      
      toast.success('Verification successful! You can now set your new password.');
      // Navigate to Set New Password screen, passing the secure token
      navigate(`/reset-password?token=${data.token}&uid=${data.uid}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to verify OTP');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-navy-900 px-6 py-8 overflow-y-auto no-scrollbar relative">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 bg-brand-primary/10 rounded-full blur-[80px]" />
      
      <header className="absolute top-safe pt-4 left-6 z-20">
        <button data-testid='btn-forgotpassword-1' onClick={() => step === 'otp' ? setStep('email') : navigate(-1)} className="p-2 rounded-full bg-white/5 border border-white/5 text-content-secondary hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
      </header>

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-card rounded-3xl p-6 border border-white/5 shadow-2xl overflow-hidden"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 flex items-center justify-center relative mx-auto mb-3">
              <div className="absolute inset-0 bg-brand-primary/20 rounded-full blur-md animate-pulse" />
              <img src={logoImg} alt="Aavis Logo" className="w-16 h-16 object-contain relative z-10" />
            </div>
            <h1 className="text-2xl font-display font-black tracking-tight text-white mb-1">Reset Password</h1>
            <p className="text-content-secondary text-sm">
              We'll send you a recovery code to access your account.
            </p>
            <p className="text-content-secondary text-xs mt-2">
              If you don't see the email in your inbox, please <strong>check your spam folder</strong>.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {step === 'email' ? (
              <motion.form 
                key="email-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSendOTP} 
                className="space-y-4"
              >
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-content-secondary" />
                  <input data-testid='input-forgotpassword-1'
                    type="email"
                    required
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full glass-input rounded-2xl py-3.5 pl-11 pr-4 text-white text-sm placeholder:text-content-secondary"
                  />
                </div>

                <button data-testid='btn-forgotpassword-2'
                  type="submit"
                  disabled={isSending}
                  className="w-full bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-95 disabled:opacity-50 text-white rounded-2xl py-3.5 font-bold text-base flex items-center justify-center gap-2 transition-all mt-6 shadow-lg shadow-brand-primary/20"
                >
                  {isSending ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</>
                  ) : (
                    <>Send OTP <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.form 
                key="otp-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleVerifyOTP} 
                className="space-y-6"
              >
                <div className="flex justify-between max-w-[300px] mx-auto w-full gap-2" onPaste={handlePaste}>
                  {otp.map((digit, index) => (
                    <input data-testid={`input-forgotpassword-otp-${index}`}
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-11 h-14 text-center text-xl font-bold bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                    />
                  ))}
                </div>

                <button data-testid='btn-forgotpassword-verify'
                  type="submit"
                  disabled={isVerifying || otp.join('').length < 6}
                  className="w-full bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-50 text-white rounded-xl py-3.5 font-bold shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 transition-all mt-4"
                >
                  {isVerifying ? <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</> : 'Verify & Continue'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
