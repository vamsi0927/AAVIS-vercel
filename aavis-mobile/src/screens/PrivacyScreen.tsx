import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { getThemeColors } from '../lib/theme';
import { useAppContext } from '../context/AppContext';

export default function PrivacyScreen({ navigation }: any) {
  const { theme } = useAppContext();
  const colors = getThemeColors(theme);
  const styles = getStyles(colors);

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {theme === 'dark' && <View style={styles.glowTop} />}

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.textPrimary} size={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.lastUpdated}>Last updated: June 2026</Text>
        
        <Text style={styles.paragraph}>
          Welcome to Aavis! This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application (the "Service"). Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the application.
        </Text>

        <Text style={styles.sectionTitle}>1. Information We Collect</Text>
        <Text style={styles.paragraph}>
          We collect information that you voluntarily provide to us when you register on the Service, express an interest in obtaining information about us or our products, or otherwise contact us.
        </Text>

        <Text style={styles.subSectionTitle}>A. Personal Information</Text>
        <Text style={styles.bulletItem}>• <Text style={styles.bold}>Account Data:</Text> When you create an account, we collect your email address and credentials managed via Supabase.</Text>
        <Text style={styles.bulletItem}>• <Text style={styles.bold}>Health and Dietary Profile:</Text> To provide personalized nutrition advice, you may voluntarily provide your name, age, height, weight, dietary preferences (e.g., Vegetarian, Vegan), specific allergies, and health conditions (e.g., Diabetes, Gout).</Text>

        <Text style={styles.subSectionTitle}>B. Usage and Application Data</Text>
        <Text style={styles.bulletItem}>• <Text style={styles.bold}>Scanned Products:</Text> We collect data regarding the food products you scan, including barcodes, product names, and nutritional information, to build your scan history.</Text>
        <Text style={styles.bulletItem}>• <Text style={styles.bold}>Images:</Text> Images used for food label scanning are temporarily processed via OCR. Users can clear their history at any time.</Text>
        <Text style={styles.bulletItem}>• <Text style={styles.bold}>Chat History:</Text> Conversations you have with the "Aavis AI" nutritionist are collected to provide contextual responses.</Text>

        <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
        <Text style={styles.paragraph}>
          Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we use information to:
        </Text>
        <Text style={styles.bulletItem}>• Create and manage your account.</Text>
        <Text style={styles.bulletItem}>• Analyze food labels against your specific dietary restrictions and medical conditions to generate personalized health verdicts.</Text>
        <Text style={styles.bulletItem}>• Compile your scanning history, calculate health streaks, and generate insights.</Text>

        <Text style={styles.sectionTitle}>3. Third-Party Data Processing</Text>
        <Text style={styles.paragraph}>
          To provide core features, we share necessary data with trusted service providers:
        </Text>
        <Text style={styles.bulletItem}>• <Text style={styles.bold}>Supabase:</Text> For database management, user authentication, and profile synchronization.</Text>
        <Text style={styles.bulletItem}>• <Text style={styles.bold}>Local AI (Ollama):</Text> To analyze complex ingredient lists, extract text from your photos via OCR, and power the AI chatbot on your own device.</Text>

        <Text style={styles.sectionTitle}>4. Medical Disclaimer</Text>
        <Text style={styles.paragraph}>
          Aavis is intended for informational and educational purposes only. Health scores, AI-generated nutritional insights, allergen warnings, and recommendations provided by the Service do not constitute professional medical advice, diagnosis, or treatment. Users should consult qualified healthcare professionals regarding dietary restrictions or medical conditions.
        </Text>
      </View>
    </ScrollView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  glowTop: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 280,
    height: 280,
    backgroundColor: '#8b5cf6',
    borderRadius: 140,
    opacity: 0.04,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 10,
    backgroundColor: colors.isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  content: {
    marginTop: 8,
  },
  lastUpdated: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#8b5cf6',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 20,
    marginBottom: 8,
  },
  subSectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 12,
    marginBottom: 6,
  },
  bulletItem: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    marginBottom: 8,
    paddingLeft: 8,
  },
  bold: {
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
});
