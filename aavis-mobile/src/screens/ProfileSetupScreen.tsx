import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, SafeAreaView, Alert } from 'react-native';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react-native';
import { getThemeColors } from '../lib/theme';
import { useAppContext } from '../context/AppContext';

const DIET_OPTIONS = ['None', 'Vegetarian', 'Non-Vegetarian', 'Vegan', 'Keto', 'Paleo', 'Mediterranean'];
const ALLERGEN_OPTIONS = ['Peanuts', 'Tree Nuts', 'Dairy', 'Eggs', 'Soy', 'Wheat', 'Gluten', 'Fish', 'Shellfish'];

const getConditionOptions = (gender: string) => {
  const base = ['Diabetes', 'Hypertension', 'High Cholesterol', 'Heart Disease', 'Kidney Disease', 'Fatty Liver', 'IBS', 'Celiac Disease', 'Thyroid Issues'];
  if (gender === 'Female') return [...base, 'PCOS', 'Endometriosis'];
  if (gender === 'Male') return [...base, 'Prostate Issues'];
  return base;
};

export default function ProfileSetupScreen({ navigation }: any) {
  const { theme, profile, updateProfile, completeOnboarding } = useAppContext();
  const colors = getThemeColors(theme);
  const isDark = theme === 'dark';

  const [step, setStep] = useState(0);
  const [setupData, setSetupData] = useState({
    name: profile.name || '',
    age: profile.age ? String(profile.age) : '',
    gender: profile.gender || '',
    height: profile.height ? String(profile.height) : '',
    weight: profile.weight ? String(profile.weight) : '',
    activityLevel: profile.activityLevel || 'Moderately Active',
    diet: profile.diet || 'None',
    conditions: profile.conditions || [],
    allergens: profile.allergens || [],
    fitnessGoals: profile.fitnessGoals || [],
  });

  const TOTAL_STEPS = 4;

  const handleNext = async () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      try {
        const payload = {
          ...setupData,
          age: setupData.age ? parseInt(setupData.age) : '',
          height: setupData.height ? parseFloat(setupData.height) : '',
          weight: setupData.weight ? parseFloat(setupData.weight) : '',
        };
        await updateProfile(payload as any);
        completeOnboarding();
        navigation.replace('Home');
      } catch (err: any) {
        Alert.alert('Error', 'Failed to save profile. Please try again.');
      }
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  };

  const toggleArrayItem = (field: 'conditions' | 'allergens', item: string) => {
    const current = setupData[field] as string[];
    const updated = current.includes(item)
      ? current.filter((i) => i !== item)
      : [...current, item];

    setSetupData({ ...setupData, [field]: updated });
  };

  const isStepValid = () => {
    if (step === 0) {
      return (
        setupData.name.trim().length > 0 &&
        setupData.age !== '' &&
        parseInt(setupData.age) >= 13 &&
        setupData.gender !== ''
      );
    }
    return true;
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.heading, { color: colors.textPrimary }]}>Tell us about yourself</Text>
            <Text style={[styles.subheading, { color: colors.textSecondary }]}>This helps Aavis customize nutrition advice for your body profile.</Text>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>YOUR NAME</Text>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? '#0e0f21' : '#ffffff', color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="What should we call you?"
                placeholderTextColor="#94a3b8"
                value={setupData.name}
                onChangeText={(val) => setSetupData({ ...setupData, name: val })}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 12 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>AGE</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: isDark ? '#0e0f21' : '#ffffff', color: colors.textPrimary, borderColor: colors.border }]}
                  placeholder="e.g. 25"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={setupData.age}
                  onChangeText={(val) => setSetupData({ ...setupData, age: val })}
                />
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>GENDER</Text>
                <View style={styles.genderRow}>
                  {['Male', 'Female', 'Other'].map((g) => (
                    <TouchableOpacity
                      key={g}
                      onPress={() => setSetupData({ ...setupData, gender: g })}
                      style={[
                        styles.genderBtn,
                        {
                          backgroundColor: setupData.gender === g ? colors.brandPrimary : (isDark ? '#0e0f21' : '#ffffff'),
                          borderColor: setupData.gender === g ? colors.brandPrimary : colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.genderBtnText, { color: setupData.gender === g ? '#ffffff' : colors.textPrimary }]}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 12 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>HEIGHT (CM)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: isDark ? '#0e0f21' : '#ffffff', color: colors.textPrimary, borderColor: colors.border }]}
                  placeholder="e.g. 175"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={setupData.height}
                  onChangeText={(val) => setSetupData({ ...setupData, height: val })}
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>WEIGHT (KG)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: isDark ? '#0e0f21' : '#ffffff', color: colors.textPrimary, borderColor: colors.border }]}
                  placeholder="e.g. 70"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={setupData.weight}
                  onChangeText={(val) => setSetupData({ ...setupData, weight: val })}
                />
              </View>
            </View>
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.heading, { color: colors.textPrimary }]}>What is your diet type?</Text>
            <Text style={[styles.subheading, { color: colors.textSecondary }]}>Choose the option that aligns closest with your lifestyle.</Text>

            <ScrollView contentContainerStyle={styles.dietList} showsVerticalScrollIndicator={false}>
              {DIET_OPTIONS.map((d) => (
                <TouchableOpacity
                  key={d}
                  onPress={() => setSetupData({ ...setupData, diet: d })}
                  style={[
                    styles.dietCard,
                    {
                      backgroundColor: setupData.diet === d ? colors.brandPrimary + '15' : (isDark ? '#0e0f21' : '#ffffff'),
                      borderColor: setupData.diet === d ? colors.brandPrimary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.dietCardText, { color: colors.textPrimary }]}>{d}</Text>
                  {setupData.diet === d && <Check color={colors.brandPrimary} size={18} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.heading, { color: colors.textPrimary }]}>Any food allergies?</Text>
            <Text style={[styles.subheading, { color: colors.textSecondary }]}>Select ingredients you are allergic to. Aavis flags these immediately.</Text>

            <View style={styles.gridContainer}>
              {ALLERGEN_OPTIONS.map((allergen) => {
                const selected = setupData.allergens.includes(allergen);
                return (
                  <TouchableOpacity
                    key={allergen}
                    onPress={() => toggleArrayItem('allergens', allergen)}
                    style={[
                      styles.gridItem,
                      {
                        backgroundColor: selected ? colors.brandPrimary + '15' : (isDark ? '#0e0f21' : '#ffffff'),
                        borderColor: selected ? colors.brandPrimary : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.gridText, { color: selected ? colors.brandPrimary : colors.textPrimary }]}>{allergen}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

      case 3:
        const conditionOptions = getConditionOptions(setupData.gender);
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.heading, { color: colors.textPrimary }]}>Any health conditions?</Text>
            <Text style={[styles.subheading, { color: colors.textSecondary }]}>Select any active conditions so Aavis can adjust nutrition scoring limits.</Text>

            <ScrollView contentContainerStyle={styles.scrollGrid} showsVerticalScrollIndicator={false}>
              <View style={styles.gridContainer}>
                {conditionOptions.map((cond) => {
                  const selected = setupData.conditions.includes(cond);
                  return (
                    <TouchableOpacity
                      key={cond}
                      onPress={() => toggleArrayItem('conditions', cond)}
                      style={[
                        styles.gridItem,
                        {
                          backgroundColor: selected ? colors.brandPrimary + '15' : (isDark ? '#0e0f21' : '#ffffff'),
                          borderColor: selected ? colors.brandPrimary : colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.gridText, { color: selected ? colors.brandPrimary : colors.textPrimary }]}>{cond}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#080914' : '#f8f9fa' }]}>
      {/* Header with Back button and progress indicators */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <ChevronLeft color={colors.textPrimary} size={24} />
        </TouchableOpacity>

        <View style={styles.progressRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressBar,
                {
                  backgroundColor: i === step ? colors.brandPrimary : i < step ? colors.brandPrimary + '70' : (isDark ? '#1a1d36' : '#e2e8f0'),
                  width: i === step ? 28 : 8,
                },
              ]}
            />
          ))}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Main Form Area */}
      <View style={styles.mainContent}>{renderStepContent()}</View>

      {/* Bottom controls */}
      <View style={styles.footer}>
        <TouchableOpacity
          disabled={!isStepValid()}
          onPress={handleNext}
          style={[styles.btn, { backgroundColor: isStepValid() ? colors.brandPrimary : '#cbd5e1', opacity: isStepValid() ? 1 : 0.5 }]}
        >
          <Text style={styles.btnText}>{step === TOTAL_STEPS - 1 ? 'Complete Setup' : 'Continue'}</Text>
          <ChevronRight color="white" size={18} style={styles.btnIcon} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    height: 50,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  mainContent: {
    flex: 1,
    marginTop: 20,
  },
  stepContainer: {
    flex: 1,
  },
  heading: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: 13.5,
    lineHeight: 20,
    marginBottom: 28,
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1.2,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  genderBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  dietList: {
    gap: 12,
    paddingBottom: 20,
  },
  dietCard: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1.2,
    paddingHorizontal: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dietCardText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  scrollGrid: {
    paddingBottom: 20,
  },
  gridItem: {
    minWidth: '45%',
    flexGrow: 1,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  gridText: {
    fontSize: 13.5,
    fontWeight: 'bold',
  },
  footer: {
    paddingBottom: 42,
    alignItems: 'center',
  },
  btn: {
    width: '100%',
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  btnIcon: {
    marginLeft: 6,
  },
});
