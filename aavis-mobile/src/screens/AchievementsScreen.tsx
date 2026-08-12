import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ArrowLeft, Medal, Flame, Camera, ShieldAlert, Award, Star, Trophy, Target } from 'lucide-react-native';
import { getThemeColors } from '../lib/theme';
import { useAppContext } from '../context/AppContext';

export default function AchievementsScreen({ navigation }: any) {
  const { theme, scans } = useAppContext();
  const colors = getThemeColors(theme);
  const styles = getStyles(colors);

  const totalScans = scans.length;
  
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

  const healthyChoiceUnlocked = scans.some(s => s.score >= 80);
  const streakMasterUnlocked = streak >= 7;
  const labelExpertUnlocked = totalScans >= 10;
  const healthGuruUnlocked = scans.some(s => s.score >= 95);
  const centurionUnlocked = totalScans >= 100;

  const achievements = [
    { 
      id: 1, 
      title: "First Scan", 
      desc: "Scanned your very first product.", 
      icon: Camera, 
      iconColor: "#60a5fa", // blue-400
      bg: "rgba(96, 165, 250, 0.15)",
      border: "rgba(96, 165, 250, 0.3)",
      unlocked: totalScans > 0, 
      date: totalScans > 0 ? "Unlocked" : "Locked"
    },
    { 
      id: 2, 
      title: "Healthy Choice", 
      desc: "Scanned a product with a score of 80+.", 
      icon: ShieldAlert, 
      iconColor: "#10b981", // brand-safe
      bg: "rgba(16, 185, 129, 0.15)",
      border: "rgba(16, 185, 129, 0.3)",
      unlocked: healthyChoiceUnlocked,
      date: healthyChoiceUnlocked ? "Unlocked" : "Locked"
    },
    { 
      id: 3, 
      title: "Streak Master", 
      desc: "Maintained a 7-day scanning streak.", 
      icon: Flame, 
      iconColor: "#fb923c", // orange-400
      bg: "rgba(251, 146, 60, 0.15)",
      border: "rgba(251, 146, 60, 0.3)",
      unlocked: streakMasterUnlocked,
      progress: streak,
      total: 7
    },
    { 
      id: 4, 
      title: "Label Expert", 
      desc: "Scan at least 10 products.", 
      icon: Star, 
      iconColor: "#fbbf24", // yellow-400
      bg: "rgba(251, 191, 36, 0.15)",
      border: "rgba(251, 191, 36, 0.3)",
      unlocked: labelExpertUnlocked,
      progress: Math.min(totalScans, 10),
      total: 10
    },
    { 
      id: 5, 
      title: "Health Guru", 
      desc: "Scan a product with a perfect 95+ score.", 
      icon: Award, 
      iconColor: "#c084fc", // purple-400
      bg: "rgba(192, 132, 252, 0.15)",
      border: "rgba(192, 132, 252, 0.3)",
      unlocked: healthGuruUnlocked,
      date: healthGuruUnlocked ? "Unlocked" : "Locked"
    },
    { 
      id: 6, 
      title: "Centurion", 
      desc: "Scan 100 products.", 
      icon: Target, 
      iconColor: "#8b5cf6", // brand-primary
      bg: "rgba(139, 92, 246, 0.15)",
      border: "rgba(139, 92, 246, 0.3)",
      unlocked: centurionUnlocked,
      progress: Math.min(totalScans, 100),
      total: 100
    },
  ];

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Glow */}
      {theme === 'dark' && <View style={styles.glowTop} />}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.textPrimary} size={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Achievements</Text>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Medal color="#fbbf24" size={28} />
          <Text style={styles.statValue}>{unlockedCount}<Text style={styles.statUnit}>/6</Text></Text>
          <Text style={styles.statLabel}>Unlocked</Text>
        </View>
        <View style={styles.statCard}>
          <Flame color="#fb923c" size={28} />
          <Text style={styles.statValue}>{streak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Your Journey</Text>

      {/* Journey List */}
      <View style={styles.list}>
        {achievements.map((item) => {
          const Icon = item.icon;
          return (
            <View key={item.id} style={[styles.achievementCard, !item.unlocked && styles.lockedCard]}>
              <View style={[styles.iconWrapper, { backgroundColor: item.bg, borderColor: item.border }]}>
                <Icon color={item.iconColor} size={24} />
              </View>
              
              <View style={styles.details}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  {item.unlocked && item.date && (
                    <View style={styles.dateBadge}>
                      <Text style={styles.dateBadgeText}>{item.date}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardDesc}>{item.desc}</Text>

                {!item.unlocked && item.progress !== undefined && item.total && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressLabelRow}>
                      <Text style={styles.progressLabel}>Progress</Text>
                      <Text style={styles.progressValue}>{item.progress}/{item.total}</Text>
                    </View>
                    <View style={styles.track}>
                      <View 
                        style={[
                          styles.bar, 
                          { 
                            backgroundColor: item.iconColor, 
                            width: `${(item.progress / item.total) * 100}%` 
                          }
                        ]} 
                      />
                    </View>
                  </View>
                )}
              </View>
            </View>
          );
        })}
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
    backgroundColor: '#eab308',
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
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.textPrimary,
    marginTop: 8,
    marginBottom: 2,
  },
  statUnit: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  list: {
    gap: 12,
  },
  achievementCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    padding: 16,
    gap: 16,
  },
  lockedCard: {
    opacity: 0.6,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    flex: 1,
    justifyContent: 'center',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  dateBadge: {
    backgroundColor: 'rgba(20, 184, 166, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  dateBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#14b8a6',
    textTransform: 'uppercase',
  },
  cardDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  progressContainer: {
    marginTop: 12,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 9,
    color: colors.textSecondary,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  progressValue: {
    fontSize: 9,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.isDark ? '#080914' : '#e2e8f0',
    width: '100%',
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 3,
  },
});
