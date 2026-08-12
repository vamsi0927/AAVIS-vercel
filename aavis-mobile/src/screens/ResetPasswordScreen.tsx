import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Lock, ArrowRight, Check, X, Eye, EyeOff, ShieldCheck } from 'lucide-react-native';
import { getApiUrl } from '../lib/apiConfig';
import { useAppContext } from '../context/AppContext';
import { getThemeColors } from '../lib/theme';

export default function ResetPasswordScreen({ route, navigation }: any) {
  const { theme } = useAppContext();
  const colors = getThemeColors(theme);
  const isDark = theme === 'dark';

  const { token, uid } = route.params || {};

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validations = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  const isValid = Object.values(validations).every(Boolean) && password === confirmPassword && password.length > 0;

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        navigation.replace('Login');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess]);

  const handleSubmit = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (!Object.values(validations).every(Boolean)) {
      Alert.alert('Error', 'Password does not meet requirements');
      return;
    }

    if (!token || !uid) {
      Alert.alert('Error', 'Invalid or missing reset token. Please request a new link.');
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch(getApiUrl('/api/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          uid,
          newPassword: password
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');
      
      setIsSuccess(true);
    } catch (err: any) {
      Alert.alert('Reset Failed', err.message || 'Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]} keyboardShouldPersistTaps="handled">
      {isDark && <View style={styles.glowTop} />}
      
      {!isSuccess && (
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', borderColor: colors.border }]}
          onPress={() => navigation.navigate('Login')}
        >
          <ArrowLeft color={colors.textSecondary} size={20} />
        </TouchableOpacity>
      )}

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {isSuccess ? (
          <View style={styles.successContainer}>
            <View style={styles.successBadge}>
              <ShieldCheck color="#10b981" size={40} />
            </View>
            <Text style={[styles.successTitle, { color: colors.textPrimary }]}>Password reset successfully</Text>
            <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
              Your password has been securely updated. You will be redirected to the sign in page shortly.
            </Text>
            <TouchableOpacity 
              style={[styles.successButton, { backgroundColor: colors.brandPrimary }]}
              onPress={() => navigation.replace('Login')}
            >
              <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>Go to Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <View style={[styles.logoBlur, { backgroundColor: colors.brandPrimary + '1A' }]} />
                <Image source={require('../../assets/logo.png')} style={{ width: 64, height: 64, resizeMode: 'contain', zIndex: 10 }} />
              </View>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Set New Password</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Create a new strong password for your account.</Text>
            </View>

            <View style={styles.form}>
              {/* New Password */}
              <View style={[styles.inputWrapper, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff', borderColor: colors.border }]}>
                <Lock style={styles.inputIcon} color={colors.textSecondary} size={18} />
                <TextInput 
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="New password"
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
                  placeholder="Confirm new password"
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

              {/* Validation Checklist */}
              <View style={[styles.checklist, { backgroundColor: isDark ? 'rgba(8, 9, 20, 0.4)' : '#ffffff', borderColor: colors.border }]}>
                <Text style={[styles.checklistTitle, { color: colors.textSecondary }]}>Requirements</Text>
                <ValidationItem satisfied={validations.minLength} label="At least 8 characters" colors={colors} />
                <ValidationItem satisfied={validations.hasUpper} label="Contains uppercase letter" colors={colors} />
                <ValidationItem satisfied={validations.hasLower} label="Contains lowercase letter" colors={colors} />
                <ValidationItem satisfied={validations.hasNumber} label="Contains number" colors={colors} />
                <ValidationItem satisfied={validations.hasSpecial} label="Contains special character" colors={colors} />
                <ValidationItem satisfied={password === confirmPassword && password.length > 0} label="Passwords match" colors={colors} />
              </View>

              <TouchableOpacity 
                style={[styles.button, { backgroundColor: colors.brandPrimary, shadowColor: colors.brandPrimary }, (!isValid || isUpdating) && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={!isValid || isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <View style={styles.buttonContent}>
                    <Text style={styles.buttonText}>Reset Password </Text>
                    <ArrowRight color="white" size={18} />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function ValidationItem({ satisfied, label, colors }: { satisfied: boolean; label: string; colors: any }) {
  return (
    <View style={styles.valItem}>
      {satisfied ? (
        <Check color="#10b981" size={14} />
      ) : (
        <X color={colors.textSecondary} size={14} />
      )}
      <Text style={[styles.valText, { color: satisfied ? colors.textPrimary : colors.textSecondary }]}>
        {label}
      </Text>
    </View>
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
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  logoBlur: {
    position: 'absolute',
    width: 60,
    height: 60,
    backgroundColor: 'rgba(20, 184, 166, 0.2)',
    borderRadius: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 4,
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
  checklist: {
    backgroundColor: 'rgba(8, 9, 20, 0.4)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(30, 41, 59, 0.5)',
    marginBottom: 16,
  },
  checklistTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
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
  valItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  valText: {
    fontSize: 12,
    marginLeft: 8,
  },
  valSatisfied: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  valUnsatisfied: {
    color: '#94a3b8',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  successBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  successButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    height: 52,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successButtonText: {
    color: '#080914',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
