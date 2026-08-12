import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { getThemeColors } from '../lib/theme';
import { useAppContext } from '../context/AppContext';

export default function TermsScreen({ navigation }: any) {
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
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.lastUpdated}>Last updated: June 2026</Text>
        
        <Text style={styles.paragraph}>
          By accessing or using Aavis, you agree to these Terms and Conditions. If you do not agree with any part of these terms, please discontinue use of the application.
        </Text>

        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerTitle}>⚠️ Important Health Disclaimer</Text>
          <Text style={styles.disclaimerText}>
            Aavis does not provide medical advice, diagnosis, or treatment. Health scores, AI analyses, dietary recommendations, and ingredient interpretations are generated using artificial intelligence and should not be considered a substitute for professional medical advice. Always consult a qualified physician or dietitian.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>1. Purpose of Aavis</Text>
        <Text style={styles.paragraph}>
          Aavis is an AI-powered food label analysis platform designed to help users understand ingredients, nutritional values, additives, allergens, and general health information.
        </Text>

        <Text style={styles.sectionTitle}>2. OCR & AI Accuracy</Text>
        <Text style={styles.paragraph}>
          Aavis uses Optical Character Recognition (OCR) and artificial intelligence to extract and analyze information from product labels. Results may vary depending on image quality, lighting, and packaging curvature.
        </Text>

        <Text style={styles.sectionTitle}>3. User Conduct</Text>
        <Text style={styles.paragraph}>
          Users agree not to upload malicious content, abuse backend APIs, attempt unauthorized access, circumvent security, or use Aavis for unlawful purposes.
        </Text>

        <Text style={styles.sectionTitle}>4. Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          To the maximum extent permitted by law, Aavis and its developers shall not be liable for health-related decisions made using the application, allergic reactions, OCR inaccuracies, AI errors, or data loss.
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
    backgroundColor: '#0ea5e9',
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
    color: '#0ea5e9',
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
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
  disclaimerBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  disclaimerTitle: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 6,
  },
  disclaimerText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 20,
    marginBottom: 8,
  },
});
