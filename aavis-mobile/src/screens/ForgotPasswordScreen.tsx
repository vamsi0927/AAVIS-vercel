import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Mail, ArrowRight } from 'lucide-react-native';
import { getApiUrl } from '../lib/apiConfig';
import { useAppContext } from '../context/AppContext';
import { getThemeColors } from '../lib/theme';

export default function ForgotPasswordScreen({ navigation }: any) {
  const { theme } = useAppContext();
  const colors = getThemeColors(theme);
  const isDark = theme === 'dark';

  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);

  const otpInputsRef = useRef<any[]>([]);

  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
    }
  }, [step]);

  const handleSendOTP = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
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
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      
      Alert.alert('Success', data.message || 'Verification code sent to your email!');
      setStep('otp');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setIsSending(false);
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
        handleVerifyOTP(fullCode);
      }
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (codeValue?: string) => {
    const enteredCode = codeValue || otp.join('');
    if (enteredCode.length < 6) {
      Alert.alert('Error', 'Please enter the full 6-digit code');
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
      if (!res.ok) throw new Error(data.error || 'Invalid or expired code');
      
      Alert.alert('Success', 'Verification successful! You can now set your new password.');
      navigation.navigate('ResetPassword', { token: data.token, uid: data.uid });
    } catch (err: any) {
      Alert.alert('Verification Failed', err.message || 'Failed to verify OTP');
      setOtp(['', '', '', '', '', '']);
      otpInputsRef.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]} keyboardShouldPersistTaps="handled">
      {isDark && <View style={styles.glowTop} />}

      <TouchableOpacity 
        style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', borderColor: colors.border }]}
        onPress={() => step === 'otp' ? setStep('email') : navigation.goBack()}
      >
        <ArrowLeft color={colors.textSecondary} size={20} />
      </TouchableOpacity>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={[styles.logoBlur, { backgroundColor: colors.brandPrimary + '1A' }]} />
            <Image source={require('../../assets/logo.png')} style={{ width: 80, height: 80, resizeMode: 'contain', zIndex: 10 }} />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Reset Password</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {step === 'email' 
              ? "We'll send you a recovery code to access your account." 
              : `We've sent a 6-digit code to ${email}`}
          </Text>
          <Text style={[styles.spamNotice, { color: colors.textSecondary }]}>
            If you don't see the email, please check your spam folder.
          </Text>
        </View>

        {step === 'email' ? (
          <View style={styles.form}>
            <View style={[styles.inputWrapper, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff', borderColor: colors.border }]}>
              <Mail style={styles.inputIcon} color={colors.textSecondary} size={18} />
              <TextInput 
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder="Enter your email address"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <TouchableOpacity 
              style={[styles.button, { backgroundColor: colors.brandPrimary, shadowColor: colors.brandPrimary }, (!email || isSending) && styles.buttonDisabled]}
              onPress={handleSendOTP}
              disabled={!email || isSending}
            >
              {isSending ? (
                <ActivityIndicator color="white" />
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>Send OTP </Text>
                  <ArrowRight color="white" size={18} />
                </View>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
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
              style={[styles.button, { backgroundColor: colors.brandPrimary, shadowColor: colors.brandPrimary }, (otp.join('').length < 6 || isVerifying) && styles.buttonDisabled]}
              onPress={() => handleVerifyOTP()}
              disabled={otp.join('').length < 6 || isVerifying}
            >
              {isVerifying ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Verify & Continue</Text>
              )}
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
    top: '15%',
    left: '20%',
    width: 250,
    height: 250,
    backgroundColor: '#8b5cf6',
    borderRadius: 125,
    opacity: 0.06,
    transform: [{ scale: 1.5 }],
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    padding: 24,
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
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 4,
  },
  spamNotice: {
    fontSize: 11,
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
  button: {
    backgroundColor: '#14b8a6',
    borderRadius: 16,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    width: '100%',
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
});
