import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image, Modal } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Search, Settings, ChevronRight, Clock, Image as ImageIcon, MessageSquare, Droplet, Camera, Image as GalleryIcon } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { getThemeColors } from '../lib/theme';
import FloatingAIBubble from '../components/FloatingAIBubble';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Camera as ExpoCamera } from 'expo-camera';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { profile, scans, theme } = useAppContext();

  const colors = getThemeColors(theme);
  const styles = getStyles(colors);
  const isDark = theme === 'dark';

  const [showPermModal, setShowPermModal] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const key = profile?.email ? `aavis_perms_requested_${profile.email}` : 'aavis_perms_requested';
        const seen = await AsyncStorage.getItem(key);
        if (!seen) {
          // Small delay so the home screen fully renders first
          setTimeout(() => setShowPermModal(true), 800);
        }
      } catch (_) {}
    };
    checkPermissions();
  }, [profile?.email]);

  const handleGrantPermissions = async () => {
    setShowPermModal(false);
    const key = profile?.email ? `aavis_perms_requested_${profile.email}` : 'aavis_perms_requested';
    await AsyncStorage.setItem(key, '1');
    // Ask camera permission
    await ExpoCamera.requestCameraPermissionsAsync();
    // Ask media library / gallery permission
    await ImagePicker.requestMediaLibraryPermissionsAsync();
  };

  const handleSkipPermissions = async () => {
    setShowPermModal(false);
    const key = profile?.email ? `aavis_perms_requested_${profile.email}` : 'aavis_perms_requested';
    await AsyncStorage.setItem(key, '1');
  };

  const recentScans = scans.slice(0, 2);
  const totalScans = scans.length;
  
  // Calculate average health score
  const avgScore = totalScans > 0
    ? Math.round(scans.reduce((acc, s) => acc + s.score, 0) / totalScans)
    : 0;

  // Calculate daily streak
  let streak = 0;
  if (scans.length > 0) {
    const dates = scans.map(s => new Date(s.date).toDateString());
    const uniqueDates = Array.from(new Set(dates)).map(d => new Date(d));
    uniqueDates.sort((a, b) => b.getTime() - a.getTime());
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (dates.includes(today) || dates.includes(yesterday)) {
      streak = 1;
      let current = uniqueDates[0];
      for (let i = 1; i < uniqueDates.length; i++) {
        const diffDays = Math.ceil(Math.abs(current.getTime() - uniqueDates[i].getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          streak++;
          current = uniqueDates[i];
        } else {
          break;
        }
      }
    }
  }

  const hazardousCount = scans.filter(s => s.verdict === 'hazardous').length;

  // Determine overall status based on recent verdicts
  let overallVerdict: 'safe' | 'caution' | 'hazardous' = 'safe';
  if (scans.length > 0) {
    const cautionCount = scans.filter(s => s.verdict === 'caution').length;
    if (hazardousCount > 0 || cautionCount > scans.length / 2) {
      overallVerdict = 'hazardous';
    } else if (cautionCount > 0) {
      overallVerdict = 'caution';
    }
  }

  const greeting = profile?.name ? `Hello, ${profile.name}` : 'Hello there';

  return (
    <View style={{ flex: 1 }}>
      {/* ── First-time Permissions Modal ── */}
      <Modal visible={showPermModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: isDark ? '#0f1023' : '#fff' }]}>
            {/* Gradient header bar */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalEmoji}>📸</Text>
            </View>

            <Text style={styles.modalTitle}>Allow Access</Text>
            <Text style={styles.modalSubtitle}>
              AAVIS needs access to your camera and photo library to scan food labels.
            </Text>

            <View style={styles.permRow}>
              <View style={styles.permIcon}>
                <Camera size={24} color="#14b8a6" />
              </View>
              <View style={styles.permText}>
                <Text style={[styles.permTitle, { color: isDark ? '#fff' : '#111' }]}>Camera</Text>
                <Text style={styles.permDesc}>Scan food labels in real time</Text>
              </View>
            </View>

            <View style={[styles.permRow, { marginBottom: 28 }]}>
              <View style={styles.permIcon}>
                <GalleryIcon size={24} color="#818cf8" />
              </View>
              <View style={styles.permText}>
                <Text style={[styles.permTitle, { color: isDark ? '#fff' : '#111' }]}>Photo Library</Text>
                <Text style={styles.permDesc}>Upload existing label photos</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.allowBtn} onPress={handleGrantPermissions}>
              <Text style={styles.allowBtnText}>Allow Access</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipBtn} onPress={handleSkipPermissions}>
              <Text style={styles.skipBtnText}>Deny</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Background glow effect */}
      {theme === 'dark' && <View style={styles.glowTop} />}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Image source={require('../../assets/logo.png')} style={{ width: 44, height: 44, resizeMode: 'contain' }} />
          <Text style={[styles.brandName, { marginLeft: 8 }]}>AAVIS</Text>
        </View>
        
        <View style={styles.actionRow}>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.iconButton}>
            <Settings color={colors.textSecondary} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>{greeting} 👋</Text>
        <Text style={styles.welcomeSubtitle}>Scan, analyze, and make healthier choices today.</Text>
      </View>

      {/* SaaS Stats Cards */}
      <View style={styles.statsGrid}>
        <View style={styles.statsCard}>
          <Text style={styles.statsLabel}>Average Score</Text>
          <View style={styles.statsValueRow}>
            <Text style={[styles.statsValue, { color: avgScore >= 75 ? '#10b981' : avgScore >= 40 ? '#f59e0b' : '#ef4444' }]}>{avgScore}</Text>
            <Text style={styles.statsUnit}>/ 100</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Achievements')} style={styles.statsCard}>
          <Text style={styles.statsLabel}>Daily Streak</Text>
          <View style={styles.statsValueRow}>
            <Text style={[styles.statsValue, { color: '#fb923c' }]}>{streak}</Text>
            <Text style={styles.statsUnit}>days 🔥</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.statsCard}>
          <Text style={styles.statsLabel}>Total Scans</Text>
          <View style={styles.statsValueRow}>
            <Text style={[styles.statsValue, { color: '#8b5cf6' }]}>{totalScans}</Text>
            <Text style={styles.statsUnit}>products</Text>
          </View>
        </View>
        <View style={styles.statsCard}>
          <Text style={styles.statsLabel}>Hazardous Avoided</Text>
          <View style={styles.statsValueRow}>
            <Text style={[styles.statsValue, { color: '#ef4444' }]}>{hazardousCount}</Text>
            <Text style={styles.statsUnit}>avoided ⚠️</Text>
          </View>
        </View>
      </View>

      {/* Daily Status Card */}
      <View style={[styles.statusCard, overallVerdict === 'safe' ? styles.statusSafe : overallVerdict === 'caution' ? styles.statusCaution : styles.statusHazardous]}>
        <Text style={styles.statusLabel}>Is this right for me?</Text>
        <View style={styles.statusContent}>
          <View style={styles.statusIconWrapper}>
            {scans[0]?.product?.imageUrl ? (
              <Image source={{ uri: scans[0].product.imageUrl }} style={styles.productImage} />
            ) : (
              <ImageIcon color={colors.textSecondary} size={24} />
            )}
          </View>
          <View style={styles.statusDetails}>
            <Text style={styles.statusProductName}>
              {scans[0]?.product?.name || 'Scan to Start'}
            </Text>
            <Text style={styles.statusDietAdvice}>
              {scans[0]?.dietAdvice || 'Check hidden ingredients & food score customized for your profile.'}
            </Text>
          </View>
        </View>
        {scans.length > 0 && (
          <TouchableOpacity 
            onPress={() => navigation.navigate('Result', { data: scans[0] })}
            style={styles.statusFooter}
          >
            <Text style={styles.statusFooterLabel}>Based on recent scan</Text>
            <Text style={styles.statusFooterLink}>View Report</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Quick Tools */}
      <Text style={styles.sectionTitle}>Quick Tools</Text>
      
      <TouchableOpacity 
        onPress={() => navigation.navigate('WaterTracker')}
        style={styles.toolCard}
      >
        <View style={[styles.toolIconWrapper, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
          <Text style={styles.toolEmoji}>💧</Text>
        </View>
        <View style={styles.toolTextWrapper}>
          <Text style={styles.toolTitle}>Hydration Tracker</Text>
          <Text style={styles.toolSubtitle}>Track and log daily water glasses</Text>
        </View>
        <ChevronRight color={colors.textSecondary} size={20} />
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => navigation.navigate('FoodMyths')}
        style={styles.toolCard}
      >
        <View style={[styles.toolIconWrapper, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
          <Text style={styles.toolEmoji}>🤔</Text>
        </View>
        <View style={styles.toolTextWrapper}>
          <Text style={styles.toolTitle}>Discover Food Myths</Text>
          <Text style={styles.toolSubtitle}>Learn what's hidden on standard labels</Text>
        </View>
        <ChevronRight color={colors.textSecondary} size={20} />
      </TouchableOpacity>

      {/* Recent Scans */}
      <View style={styles.recentHeader}>
        <Text style={styles.sectionTitle}>Recent Scans</Text>
        {scans.length > 0 && (
          <TouchableOpacity onPress={() => navigation.navigate('History')} style={styles.seeAllRow}>
            <Text style={styles.seeAllText}>See all</Text>
            <ChevronRight color="#8b5cf6" size={16} />
          </TouchableOpacity>
        )}
      </View>

      {scans.length === 0 ? (
        <View style={styles.emptyScansCard}>
          <Clock color={colors.textSecondary} size={32} />
          <Text style={styles.emptyScansText}>No recent scans.</Text>
        </View>
      ) : (
        <View style={styles.recentList}>
          {recentScans.map(scan => (
            <TouchableOpacity 
              key={scan.id}
              onPress={() => navigation.navigate('Result', { data: scan })}
              style={styles.recentItem}
            >
              <View style={styles.recentImageWrapper}>
                {scan.product?.imageUrl ? (
                  <Image source={{ uri: scan.product.imageUrl }} style={styles.recentProductImage} />
                ) : (
                  <Text style={styles.recentEmoji}>{scan.product?.imageEmoji || '🤖'}</Text>
                )}
              </View>
              <View style={styles.recentTextWrapper}>
                <Text style={styles.recentProductName}>{scan.product?.name}</Text>
                <Text style={styles.recentProductBrand}>{scan.product?.brand || 'Unknown Brand'}</Text>
              </View>
              <View style={[styles.badge, scan.verdict === 'safe' ? styles.badgeSafe : scan.verdict === 'caution' ? styles.badgeCaution : styles.badgeHazardous]}>
                <Text style={[styles.badgeText, scan.verdict === 'safe' ? styles.badgeTextSafe : scan.verdict === 'caution' ? styles.badgeTextCaution : styles.badgeTextHazardous]}>
                  {scan.verdict}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
    <FloatingAIBubble />
  </View>
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
    paddingBottom: 110,
  },
  glowTop: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 320,
    height: 320,
    backgroundColor: '#8b5cf6',
    borderRadius: 160,
    opacity: 0.08,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    width: '100%',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#14b8a6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  brandName: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    backgroundColor: colors.isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statsCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 16,
  },
  statsLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  statsValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
    gap: 4,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: '900',
  },
  statsUnit: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  statusCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginBottom: 28,
  },
  statusSafe: {
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
    borderColor: 'rgba(16, 185, 129, 0.15)',
  },
  statusCaution: {
    backgroundColor: 'rgba(245, 158, 11, 0.04)',
    borderColor: 'rgba(245, 158, 11, 0.15)',
  },
  statusHazardous: {
    backgroundColor: 'rgba(239, 68, 68, 0.04)',
    borderColor: 'rgba(239, 68, 68, 0.15)',
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  statusContent: {
    flexDirection: 'row',
    gap: 16,
  },
  statusIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.isDark ? '#080914' : '#f5f6fa',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  statusDetails: {
    flex: 1,
  },
  statusProductName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  statusDietAdvice: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  statusFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  statusFooterLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  statusFooterLink: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#8b5cf6',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  toolIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  toolEmoji: {
    fontSize: 20,
  },
  toolTextWrapper: {
    flex: 1,
  },
  toolTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  toolSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  seeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8b5cf6',
  },
  emptyScansCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyScansText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  recentList: {
    gap: 10,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 14,
  },
  recentImageWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.isDark ? '#080914' : '#f5f6fa',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recentProductImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  recentEmoji: {
    fontSize: 22,
  },
  recentTextWrapper: {
    flex: 1,
  },
  recentProductName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  recentProductBrand: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeSafe: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  badgeCaution: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  badgeHazardous: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  badgeTextSafe: {
    color: '#10b981',
  },
  badgeTextCaution: {
    color: '#f59e0b',
  },
  badgeTextHazardous: {
    color: '#ef4444',
  },
  // ── Permissions Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 32,
  },
  modalCard: {
    width: '92%',
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  modalHeader: {
    backgroundColor: '#14b8a6',
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalEmoji: {
    fontSize: 44,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
    paddingHorizontal: 24,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  permIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  permText: {
    flex: 1,
  },
  permTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  permDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  allowBtn: {
    marginHorizontal: 24,
    marginBottom: 12,
    backgroundColor: '#14b8a6',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  allowBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  skipBtn: {
    marginHorizontal: 24,
    marginBottom: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipBtnText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
