import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Shield, Loader2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { verifyOTP, clearOTP, sendOTP } from '../../lib/otpService';

export function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as any)?.email || '';
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

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
        handleSubmit(undefined, fullCode);
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
      handleSubmit(undefined, pasted);
    }
  };

  const handleSubmit = (e?: React.FormEvent, code?: string) => {
    e?.preventDefault();
    const enteredCode = code || otp.join('');
    if (enteredCode.length < 6) {
      toast.error('Please enter the full 6-digit code');
      return;
    }

    setIsLoading(true);
    const result = verifyOTP(enteredCode);

    if (result.success) {
      toast.success('Verification successful! You can now reset your password.');
      clearOTP();
      navigate('/login');
    } else {
      toast.error(result.message);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || !email) return;
    setOtp(['', '', '', '', '', '']);
    const result = await sendOTP(email, 'email');
    if (result.success) {
      if (result.isDemoMode && result.demoOTP) {
        toast.info(result.message, { duration: 8000 });
      } else {
        toast.success('New OTP sent!');
      }
      setResendTimer(60);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="flex flex-col h-full bg-navy-900 pb-24">
      <header className="pt-safe pt-8 px-6 pb-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-navy-800 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pt-4 pb-8 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-brand-primary to-purple-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)] mx-auto mb-6">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold mb-2">Verify OTP</h1>
          <p className="text-content-secondary">
            {email
              ? `We sent a 6-digit code to ${email}. Enter it below to verify.`
              : 'Enter the 6-digit code sent to your email to verify your account.'
            }
          </p>
        </motion.div>

        <form onSubmit={(e) => handleSubmit(e)} className="space-y-8 flex-1 flex flex-col">
          <div className="flex justify-between max-w-[320px] mx-auto w-full gap-2" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-bold bg-navy-800 border border-navy-700 rounded-xl text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
              />
            ))}
          </div>

          <div className="text-center mt-6">
            {resendTimer > 0 ? (
              <p className="text-sm text-content-secondary flex items-center justify-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Resend in {resendTimer}s
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="text-sm text-brand-primary font-medium hover:underline"
              >
                Resend Code
              </button>
            )}
          </div>

          <div className="mt-auto pt-8">
            <button
              type="submit"
              disabled={isLoading || otp.join('').length < 6}
              className="w-full bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-50 text-white rounded-xl py-4 font-bold text-lg shadow-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Verifying...
                </>
              ) : (
                'Verify & Continue'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
