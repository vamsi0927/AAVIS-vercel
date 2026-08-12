import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Svg, Circle } from 'react-native-svg';
import { ArrowLeft, Plus, Minus, Trophy } from 'lucide-react-native';
import { getThemeColors } from '../lib/theme';
import { useAppContext } from '../context/AppContext';

export default function WaterTrackerScreen({ navigation }: any) {
  const { theme } = useAppContext();
  const [glasses, setGlasses] = useState(3);
  const goal = 8;
  const percentage = Math.min(100, (glasses / goal) * 100);

  const colors = getThemeColors(theme);
  const styles = getStyles(colors);

  // SVG ring configuration
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const handleAdd = () => {
    setGlasses(prev => prev + 1);
  };

  const handleRemove = () => {
    setGlasses(prev => Math.max(0, prev - 1));
  };

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      {/* Glow */}
      {theme === 'dark' && <View style={styles.glowTop} />}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.textPrimary} size={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hydration Tracker</Text>
      </View>

      {/* Progress Ring */}
      <View style={styles.ringCard}>
        <View style={styles.ringContainer}>
          <Svg width="220" height="220" viewBox="0 0 220 220">
            <Circle
              cx="110"
              cy="110"
              r={radius}
              fill="none"
              stroke={colors.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}
              strokeWidth="12"
            />
            <Circle
              cx="110"
              cy="110"
              r={radius}
              fill="none"
              stroke="#3b82f6" // blue-500
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 110 110)"
            />
          </Svg>
          
          <View style={styles.ringLabelWrapper}>
            <Text style={styles.dropletText}>💧</Text>
            <View style={styles.glassesCountRow}>
              <Text style={styles.glassesText}>{glasses}</Text>
              <Text style={styles.goalText}>/ {goal}</Text>
            </View>
            <Text style={styles.glassesLabel}>GLASSES</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity 
            style={[styles.controlBtn, glasses === 0 && styles.controlBtnDisabled]} 
            onPress={handleRemove}
            disabled={glasses === 0}
          >
            <Minus color={colors.textPrimary} size={24} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.plusBtn} onPress={handleAdd}>
            <Plus color="#ffffff" size={32} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlBtn} onPress={() => setGlasses(goal)}>
            <Trophy color="#60a5fa" size={22} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Today's Log */}
      <View style={styles.logCard}>
        <Text style={styles.logHeader}>Today's Log</Text>
        {glasses === 0 ? (
          <Text style={styles.emptyLogText}>No water logged yet today.</Text>
        ) : (
          <View style={styles.glassGrid}>
            {Array.from({ length: glasses }).map((_, idx) => (
              <View key={idx} style={styles.glassIconWrapper}>
                <Text style={styles.glassEmoji}>🥛</Text>
              </View>
            ))}
          </View>
        )}
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
    alignItems: 'center',
  },
  glowTop: {
    position: 'absolute',
    top: -50,
    width: 280,
    height: 280,
    backgroundColor: '#3b82f6',
    borderRadius: 140,
    opacity: 0.04,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginBottom: 32,
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
  ringCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    alignSelf: 'stretch',
    marginBottom: 24,
  },
  ringContainer: {
    position: 'relative',
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  ringLabelWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropletText: {
    fontSize: 28,
    marginBottom: 4,
  },
  glassesCountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  glassesText: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  goalText: {
    fontSize: 18,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  glassesLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  controlBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.isDark ? '#080914' : '#f5f6fa',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnDisabled: {
    opacity: 0.4,
  },
  plusBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#3b82f6',
    borderWidth: 4,
    borderColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    padding: 20,
    alignSelf: 'stretch',
  },
  logHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 16,
  },
  emptyLogText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  glassGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  glassIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassEmoji: {
    fontSize: 20,
  },
});
