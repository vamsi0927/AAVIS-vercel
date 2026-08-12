import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, User, ArrowRight, Clock, Eye, EyeOff } from 'lucide-react-native';
import { getApiUrl } from '../lib/apiConfig';
import { useAppContext } from '../context/AppContext';
import { getThemeColors } from '../lib/theme';

export default function RegisterScreen({ navigation }: any) {
  const { theme } = useAppContext();
  const colors = getThemeColors(theme);
  const isDark = theme === 'dark';

  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const otpInputsRef = useRef<any[]>([]);

  useEffect(() => {
    if (step === 'verify') {
      setResendTimer(60);
      setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
    }
  }, [step]);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) return;

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/auth/send-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password, name, source: 'app' })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      setStep('verify');
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    if (value && index === 5) {
      const fullCode = [...newOtp].join('');
      if (fullCode.length === 6) {
        handleVerify(fullCode);
      }
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || !email) return;
    setOtp(['', '', '', '', '', '']);
    setIsLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/auth/send-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password, name, source: 'app' })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Resend failed');

      setResendTimer(60);
      Alert.alert('Code Sent', 'A new 6-digit verification code has been sent.');
    } catch (err: any) {
      Alert.alert('Resend Failed', err.message || 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (codeToSubmit?: string) => {
    const code = codeToSubmit || otp.join('');
    if (code.length < 6) return;

    setIsLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/auth/verify-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), token: code, type: 'signup' })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');

      const { session, error: authError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      if (authError || !session) {
        throw new Error(authError?.message || 'Failed to authenticate after verification.');
      }

      Alert.alert('Success', 'Account created successfully!');
      navigation.replace('Onboarding');
    } catch (err: any) {
      Alert.alert('Error', 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]} keyboardShouldPersistTaps="handled">
      {isDark && (
        <>
          <View style={styles.glowTop} />
          <View style={styles.glowBottom} />
        </>
      )}

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {step === 'register' ? (
          <View>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <View style={[styles.logoBlur, { backgroundColor: colors.brandPrimary + '1A' }]} />
                <Image source={require('../../assets/logo.png')} style={{ width: 80, height: 80, resizeMode: 'contain', zIndex: 10 }} />
              </View>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Create Account</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Join Aavis to eat healthier</Text>
            </View>

            <View style={styles.form}>
              {/* Full Name */}
              <View style={[styles.inputWrapper, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff', borderColor: colors.border }]}>
                <User style={styles.inputIcon} color={colors.textSecondary} size={18} />
                <TextInput 
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="Full Name"
                  placeholderTextColor={colors.textSecondary}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              {/* Email */}
              <View style={[styles.inputWrapper, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff', borderColor: colors.border }]}>
                <Mail style={styles.inputIcon} color={colors.textSecondary} size={18} />
                <TextInput 
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="Email address"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              {/* Password */}
              <View style={[styles.inputWrapper, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff', borderColor: colors.border }]}>
                <Lock style={styles.inputIcon} color={colors.textSecondary} size={18} />
                <TextInput 
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="Password (min. 6 characters)"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  {showPassword ? <Eye color={colors.textSecondary} size={18} /> : <EyeOff color={colors.textSecondary} size={18} />}
                </TouchableOpacity>
              </View>

              {/* Confirm Password */}
              <View style={[styles.inputWrapper, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff', borderColor: colors.border }]}>
                <Lock style={styles.inputIcon} color={colors.textSecondary} size={18} />
                <TextInput 
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="Confirm password"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton}>
                  {showConfirmPassword ? <Eye color={colors.textSecondary} size={18} /> : <EyeOff color={colors.textSecondary} size={18} />}
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={[styles.button, { backgroundColor: colors.brandPrimary, shadowColor: colors.brandPrimary }, (!name || !email || !password || !confirmPassword || isLoading) && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={!name || !email || !password || !confirmPassword || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <View style={styles.buttonContent}>
                    <Text style={styles.buttonText}>Sign Up </Text>
                    <ArrowRight color="white" size={18} />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.linkText, { color: colors.brandPrimary }]}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.verifyContainer}>
            <Text style={[styles.verifyTitle, { color: colors.textPrimary }]}>Verify your email</Text>
            <Text style={[styles.verifySubtitle, { color: colors.textSecondary }]}>
              We've sent a 6-digit code to <Text style={[styles.boldText, { color: colors.textPrimary }]}>{email}</Text>.
            </Text>
            <Text style={[styles.spamNotice, { color: colors.textSecondary }]}>
              If you don't see the email, please check your spam folder.
            </Text>

            <View style={styles.otpWrapper}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(el) => (otpInputsRef.current[index] = el)}
                  style={[styles.otpInput, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff', borderColor: colors.border, color: colors.textPrimary }]}
                  keyboardType="numeric"
                  maxLength={1}
                  value={digit}
                  onChangeText={(val) => handleOtpChange(index, val)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                />
              ))}
            </View>

            <TouchableOpacity 
              style={[styles.button, { backgroundColor: colors.brandPrimary, shadowColor: colors.brandPrimary }, (otp.join('').length < 6 || isLoading) && styles.buttonDisabled]}
              onPress={() => handleVerify()}
              disabled={otp.join('').length < 6 || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Verify & Continue</Text>
              )}
            </TouchableOpacity>

            <View style={styles.resendWrapper}>
              {resendTimer > 0 ? (
                <View style={styles.timerRow}>
                  <Clock color={colors.textSecondary} size={14} />
                  <Text style={[styles.timerText, { color: colors.textSecondary }]}>Resend in {resendTimer}s</Text>
                </View>
              ) : (
                <TouchableOpacity onPress={handleResend}>
                  <Text style={[styles.linkText, { color: colors.brandPrimary }]}>Resend Code</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity 
              onPress={() => setStep('register')}
              style={styles.editEmailButton}
            >
              <Text style={[styles.editEmailText, { color: colors.textSecondary }]}>Edit email address</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#080914',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  glowTop: {
    position: 'absolute',
    top: '10%',
    left: '15%',
    width: 250,
    height: 250,
    backgroundColor: '#8b5cf6',
    borderRadius: 125,
    opacity: 0.08,
    transform: [{ scale: 1.5 }],
  },
  glowBottom: {
    position: 'absolute',
    bottom: '10%',
    right: '10%',
    width: 200,
    height: 200,
    backgroundColor: '#06b6d4',
    borderRadius: 100,
    opacity: 0.04,
    transform: [{ scale: 1.5 }],
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  logoBlur: {
    position: 'absolute',
    width: 70,
    height: 70,
    backgroundColor: 'rgba(20, 184, 166, 0.2)',
    borderRadius: 35,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
  },
  eyeButton: {
    padding: 8,
  },
  button: {
    backgroundColor: '#14b8a6',
    borderRadius: 16,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  linkText: {
    color: '#14b8a6',
    fontSize: 13,
    fontWeight: 'bold',
  },
  verifyContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  verifyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  verifySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 4,
  },
  boldText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  spamNotice: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
  },
  otpWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
  },
  otpInput: {
    width: 44,
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  resendWrapper: {
    marginTop: 24,
    alignItems: 'center',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    color: '#94a3b8',
    fontSize: 13,
    marginLeft: 6,
  },
  editEmailButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  editEmailText: {
    color: '#94a3b8',
    fontSize: 13,
  },
});
