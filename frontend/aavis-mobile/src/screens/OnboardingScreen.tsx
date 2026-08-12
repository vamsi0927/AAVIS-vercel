import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, SafeAreaView } from 'react-native';
import { ChevronRight, Droplet, Skull, Activity, ShieldAlert } from 'lucide-react-native';
import { getThemeColors } from '../lib/theme';
import { useAppContext } from '../context/AppContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  {
    id: 'intro',
    icon: Activity,
    title: 'Your Food Has Secrets',
    description: 'Most people consume harmful additives, hidden sugars, and excessive sodium every single day without even realizing it.',
    color: '#0284c7', // sky-600
    bgGlow: 'rgba(2, 132, 199, 0.08)'
  },
  {
    id: 'chemicals',
    icon: Skull,
    title: 'The Hidden Chemicals',
    description: 'Food labels are designed to be confusing. Preservatives, artificial colors, and trans fats hide behind complex names.',
    color: '#a855f7', // purple-500
    bgGlow: 'rgba(168, 85, 247, 0.08)'
  },
  {
    id: 'risks',
    icon: Droplet,
    title: 'Long-term Health Risks',
    description: 'Excess sodium spikes blood pressure. Hidden sugars cause metabolic diseases. You deserve to know exactly what fuels you.',
    color: '#f43f5e', // rose-500
    bgGlow: 'rgba(244, 63, 94, 0.08)'
  },
  {
    id: 'solution',
    icon: ShieldAlert,
    title: 'Aavis Decodes It All',
    description: 'Instantly scan any label. Aavis AI translates confusing chemicals into clear, personalized health warnings.',
    color: '#14b8a6', // teal-500
    bgGlow: 'rgba(20, 184, 166, 0.08)'
  }
];

export default function OnboardingScreen({ navigation }: any) {
  const { theme } = useAppContext();
  const colors = getThemeColors(theme);
  const isDark = theme === 'dark';
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      finishOnboarding();
    }
  };

  const finishOnboarding = () => {
    navigation.replace('ProfileSetup');
  };

  const activeSlide = SLIDES[currentSlide];
  const IconComponent = activeSlide.icon;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#080914' : '#f8f9fa' }]}>
      {/* Background Glow */}
      <View style={[styles.glow, { backgroundColor: activeSlide.bgGlow }]} />

      {/* Skip Button */}
      <View style={styles.header}>
        <View />
        <TouchableOpacity onPress={finishOnboarding} style={styles.skipBtn}>
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slide Content */}
      <View style={styles.content}>
        <View style={[styles.iconWrapper, { backgroundColor: isDark ? '#0e0f21' : '#ffffff', borderColor: activeSlide.color + '20' }]}>
          <View style={[styles.iconGlow, { backgroundColor: activeSlide.color + '15' }]} />
          <IconComponent color={activeSlide.color} size={48} />
        </View>

        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {activeSlide.title}
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {activeSlide.description}
        </Text>
      </View>

      {/* Footer Controls */}
      <View style={styles.footer}>
        {/* Progress dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                {
                  backgroundColor: idx === currentSlide ? activeSlide.color : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                  width: idx === currentSlide ? 24 : 8
                }
              ]}
            />
          ))}
        </View>

        {/* Action Button */}
        <TouchableOpacity
          onPress={handleNext}
          style={[styles.btn, { backgroundColor: activeSlide.color }]}
        >
          <Text style={styles.btnText}>
            {currentSlide === SLIDES.length - 1 ? 'Build Your Profile' : 'Continue'}
          </Text>
          <ChevronRight color="white" size={18} style={styles.btnIcon} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 380,
    borderBottomLeftRadius: 150,
    borderBottomRightRadius: 150,
    opacity: 0.8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    height: 50,
  },
  skipBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  iconWrapper: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 36,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  iconGlow: {
    position: 'absolute',
    inset: 0,
    borderRadius: 55,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
    maxWidth: 320,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 42,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 32,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  btn: {
    width: '100%',
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  btnIcon: {
    marginLeft: 6,
  },
});
