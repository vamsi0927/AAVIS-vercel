import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';
import { getThemeColors } from '../lib/theme';

export default function LoginScreen({ navigation }: any) {
  const { theme } = useAppContext();
  const colors = getThemeColors(theme);
  const isDark = theme === 'dark';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    
    if (error) {
      let msg = error.message || 'Invalid email or password';
      if (msg === 'Invalid login credentials') {
        msg = "Account not found or incorrect password. If you don't have an account, please Sign Up first.";
      }
      Alert.alert('Login Failed', msg);
    } else if (data.user) {
      if (!data.user.email_confirmed_at) {
        await supabase.auth.signOut();
        Alert.alert('Verification Required', 'Please verify your email before logging in.');
        return;
      }
      navigation.replace('Home');
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]} keyboardShouldPersistTaps="handled">
      {/* Background glow effects */}
      {isDark && (
        <>
          <View style={styles.glowTop} />
          <View style={styles.glowBottom} />
        </>
      )}

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={[styles.logoBlur, { backgroundColor: colors.brandPrimary + '1A' }]} />
            <Image source={require('../../assets/logo.png')} style={{ width: 80, height: 80, resizeMode: 'contain', zIndex: 10 }} />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Welcome Back</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Sign in to continue your health journey</Text>
        </View>

        <View style={styles.form}>
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
              placeholder="Password"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity 
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <Eye color={colors.textSecondary} size={18} /> : <EyeOff color={colors.textSecondary} size={18} />}
            </TouchableOpacity>
          </View>

          <View style={styles.forgotWrapper}>
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={[styles.forgotText, { color: colors.brandPrimary }]}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.brandPrimary, shadowColor: colors.brandPrimary }, (!email || !password || loading) && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={!email || !password || loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>Continue </Text>
                <ArrowRight color="white" size={18} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={[styles.signUpText, { color: colors.brandPrimary }]}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#080914', // navy-900 (deep dark background)
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
    backgroundColor: '#8b5cf6', // primary brand color glow
    borderRadius: 125,
    opacity: 0.08,
    transform: [{ scale: 1.5 }],
  },
  glowBottom: {
    position: 'absolute',
    bottom: '15%',
    right: '10%',
    width: 200,
    height: 200,
    backgroundColor: '#06b6d4', // secondary brand color glow
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
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  logoBlur: {
    position: 'absolute',
    width: 80,
    height: 80,
    backgroundColor: 'rgba(20, 184, 166, 0.2)', // brand-primary/20
    borderRadius: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8', // content-secondary
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
    height: 54,
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
  forgotWrapper: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    fontSize: 12,
    color: '#14b8a6', // brand-primary
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#14b8a6', // brand-primary
    borderRadius: 16,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#14b8a6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
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
    fontSize: 16,
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
  signUpText: {
    color: '#14b8a6',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
