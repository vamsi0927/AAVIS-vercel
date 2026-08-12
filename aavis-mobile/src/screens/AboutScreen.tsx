import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { ArrowLeft, Heart, Shield, Leaf, Activity } from 'lucide-react-native';
import { getThemeColors } from '../lib/theme';
import { useAppContext } from '../context/AppContext';

export default function AboutScreen({ navigation }: any) {
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
        <Text style={styles.headerTitle}>About Aavis</Text>
      </View>

      <View style={styles.heroSection}>
        <Image source={require('../../assets/logo.png')} style={{ width: 100, height: 100, resizeMode: 'contain', zIndex: 10, marginBottom: 16 }} />
        <Text style={styles.appName}>Aavis</Text>
        <Text style={styles.versionText}>Version 1.0.0 (Build 42)</Text>
        
        <Text style={styles.heroDescription}>
          Aavis is your intelligent companion for navigating the complex world of food labels. 
          In India, reading and understanding ingredient labels isn't yet a common habit—but it needs to be. 
          We created Aavis to change this by making label reading effortless, so everyone can know exactly what they are putting into their bodies.
        </Text>
      </View>

      {/* Our Mission */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Our Mission</Text>
        <View style={styles.missionCard}>
          
          <View style={styles.missionRow}>
            <View style={[styles.missionIconWrapper, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
              <Heart color="#8b5cf6" size={20} />
            </View>
            <View style={styles.missionDetails}>
              <Text style={styles.missionTitle}>Empower Health</Text>
              <Text style={styles.missionDesc}>We translate confusing chemical names and deceptive marketing into clear, actionable health insights.</Text>
            </View>
          </View>

          <View style={styles.missionRow}>
            <View style={[styles.missionIconWrapper, { backgroundColor: 'rgba(20, 184, 166, 0.15)' }]}>
              <Leaf color="#14b8a6" size={20} />
            </View>
            <View style={styles.missionDetails}>
              <Text style={styles.missionTitle}>Promote Transparency</Text>
              <Text style={styles.missionDesc}>By leveraging advanced AI, we expose hidden sugars, dangerous additives, and processed ingredients.</Text>
            </View>
          </View>

          <View style={[styles.missionRow, styles.lastRow]}>
            <View style={[styles.missionIconWrapper, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
              <Activity color="#6366f1" size={20} />
            </View>
            <View style={styles.missionDetails}>
              <Text style={styles.missionTitle}>Personalized Guidance</Text>
              <Text style={styles.missionDesc}>Aavis adapts to your unique dietary needs, allergies, and health conditions for tailored recommendations.</Text>
            </View>
          </View>

        </View>
      </View>

      {/* Footer Credits */}
      <View style={styles.creditsContainer}>
        <Text style={styles.creditsText}>Made with ❤️ for a healthier tomorrow.</Text>
        <Text style={styles.copyrightText}>&copy; {new Date().getFullYear()} Aavis Health. All rights reserved.</Text>
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
  heroSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#14b8a6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#14b8a6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  logoText: {
    color: 'white',
    fontSize: 40,
    fontWeight: '900',
  },
  appName: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  versionText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  heroDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 12,
    paddingLeft: 4,
  },
  missionCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    padding: 20,
  },
  missionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 16,
  },
  lastRow: {
    marginBottom: 0,
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  missionIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missionDetails: {
    flex: 1,
  },
  missionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  missionDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  creditsContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
    gap: 4,
  },
  creditsText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  copyrightText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});
