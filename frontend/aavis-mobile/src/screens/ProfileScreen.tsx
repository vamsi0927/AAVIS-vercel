import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Edit3,
  Save,
  X,
  Activity,
  User,
  Settings,
  Camera,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAppContext } from '../context/AppContext';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { getThemeColors } from '../lib/theme';
import FloatingAIBubble from '../components/FloatingAIBubble';

const DIET_OPTIONS = ['None', 'Vegetarian', 'Non-Vegetarian', 'Vegan', 'Keto', 'Paleo', 'Mediterranean'];
const ALLERGEN_OPTIONS = ['Peanuts', 'Tree Nuts', 'Dairy', 'Eggs', 'Soy', 'Wheat', 'Gluten', 'Fish', 'Shellfish'];

const getConditionOptions = (gender: string) => {
  const base = ['Diabetes', 'Hypertension', 'High Cholesterol', 'Heart Disease', 'Kidney Disease', 'Fatty Liver', 'IBS', 'Celiac Disease', 'Thyroid Issues'];
  if (gender === 'Female') return [...base, 'PCOS', 'Endometriosis'];
  if (gender === 'Male') return [...base, 'Prostate Issues'];
  return base;
};

const getDietEmoji = (diet?: string) => {
  if (diet === 'Vegetarian' || diet === 'Vegan') return '🥗';
  if (diet === 'Keto' || diet === 'Paleo' || diet === 'Non-Vegetarian') return '🥩';
  return '🍽️';
};

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { theme, profile, updateProfile, scans } = useAppContext();
  const colors = getThemeColors(theme);
  const isDark = theme === 'dark';
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Edit state mirrors the profile
  const [editData, setEditData] = useState<any>(profile || {});

  useEffect(() => {
    if (profile) setEditData(profile);
  }, [profile]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.email) setUserEmail(data.user.email);
    });
  }, []);

  const bmi = useMemo(() => {
    const h = Number(editData?.height);
    const w = Number(editData?.weight);
    if (h && w) return (w / ((h / 100) ** 2)).toFixed(1);
    return '--';
  }, [editData?.height, editData?.weight]);

  const viewBmi = useMemo(() => {
    const h = Number(profile?.height);
    const w = Number(profile?.weight);
    if (h && w) return (w / ((h / 100) ** 2)).toFixed(1);
    return '--';
  }, [profile?.height, profile?.weight]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile(editData);
      setIsEditing(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData(profile || {});
    setIsEditing(false);
  };

  const toggleArrayItem = (field: 'allergens' | 'conditions', item: string) => {
    const current: string[] = editData[field] || [];
    const norm = item.toLowerCase();
    const isIn = current.some(i => i.toLowerCase() === norm);
    setEditData({
      ...editData,
      [field]: isIn ? current.filter(i => i.toLowerCase() !== norm) : [...current, item],
    });
  };

  const handlePickAvatar = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permission Denied', 'Permission to access photos is required to update profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      const asset = result.assets[0];
      const base64Image = `data:image/jpeg;base64,${asset.base64}`;
      setEditData({
        ...editData,
        avatarUrl: base64Image,
      });
    }
  };

  const activeAllergens: string[] = profile?.allergens || [];
  const activeConditions: string[] = profile?.conditions || [];

  const getPersonalizedInsights = () => {
    const insights = [];
    const activeConditionsList = editData.conditions || profile?.conditions || [];
    const activeAllergensList = editData.allergens || profile?.allergens || [];
    const diet = editData.diet || profile?.diet || 'None';

    if (activeConditionsList.some((c: string) => c.toLowerCase() === 'diabetes' || c.toLowerCase() === 'diabetic')) {
      insights.push({
        id: 'diabetes',
        icon: '⚠️',
        title: 'Diabetic Precaution',
        desc: 'Keep an eye on "hidden sugars" like Maltodextrin and High Fructose Corn Syrup in packaged snacks.',
        color: colors.brandHazardous,
      });
    }

    if (activeAllergensList.length > 0) {
      insights.push({
        id: 'allergens',
        icon: '🛡️',
        title: 'Active Allergen Filters',
        desc: `We are scanning all ingredients for ${activeAllergensList.join(', ')}.`,
        color: colors.brandPrimary,
      });
    }

    if (diet === 'Vegan') {
      insights.push({
        id: 'vegan',
        icon: '💡',
        title: 'Vegan Tip',
        desc: 'Watch out for E120 (Carmine), which is derived from insects and is not vegan.',
        color: colors.brandSafe,
      });
    } else if (diet === 'Vegetarian') {
      insights.push({
        id: 'veg',
        icon: 'ℹ️',
        title: 'Vegetarian Check',
        desc: 'We automatically flag hidden animal-derived additives like gelatin or certain emulsifiers.',
        color: '#60a5fa',
      });
    } else if (diet === 'Non-Vegetarian') {
      insights.push({
        id: 'nonveg',
        icon: 'ℹ️',
        title: 'Non-Vegetarian Profile',
        desc: 'We will focus on flagging harmful additives, artificial colors, and your specific allergens.',
        color: '#f87171',
      });
    }

    if (insights.length === 0) {
      insights.push({
        id: 'general',
        icon: '💡',
        title: 'Smart Scanning',
        desc: 'Update your health conditions or allergies in settings to get personalized warnings and tips.',
        color: colors.brandPrimary,
      });
    }

    return insights;
  };

  const totalScans = scans.length;
  const avgScore = totalScans > 0
    ? Math.round(scans.reduce((a, s) => a + s.score, 0) / totalScans)
    : 0;

  const styles = getStyles(colors, isDark);

  // ─── Local Components accessing local styles & colors ─────────────────────────
  function GlassCard({ children, style }: { children: React.ReactNode; style?: object }) {
    return (
      <View style={[styles.card, style]}>
        {children}
      </View>
    );
  }

  function FieldInput({ label, value, onChangeText, placeholder, keyboardType }: any) {
    return (
      <View style={styles.fieldWrapper}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <TextInput
          style={styles.fieldInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder || label}
          placeholderTextColor={colors.textSecondary}
          keyboardType={keyboardType || 'default'}
        />
      </View>
    );
  }

  function Chip({ label, active, color, onPress }: {
    label: string; active: boolean; color?: string; onPress: () => void;
  }) {
    const activeBg = color || colors.brandPrimary;
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.chip,
          active
            ? { backgroundColor: activeBg, borderColor: activeBg }
            : { backgroundColor: styles.chipInactive.backgroundColor, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.chipText, { color: active ? '#fff' : colors.textSecondary }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.root}>
      {/* Ambient glow */}
      {isDark && <View style={styles.glowTop} />}
      {isDark && <View style={styles.glowBottom} />}

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerActions}>
          {isEditing ? (
            <>
              <TouchableOpacity
                onPress={handleCancel}
                disabled={isSaving}
                style={styles.iconBtn}
              >
                <X color={colors.textSecondary} size={20} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                disabled={isSaving}
                style={[styles.iconBtn, styles.iconBtnPrimary, { backgroundColor: colors.brandPrimary }]}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" size={16} />
                ) : (
                  <Save color="#fff" size={20} />
                )}
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              style={styles.iconBtn}
            >
              <Settings color={colors.textSecondary} size={20} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── ID Card ──────────────────────────────────────────────────── */}
        <GlassCard style={styles.idCard}>
          {/* Avatar (Clickable in edit mode) */}
          <TouchableOpacity 
            style={styles.avatarWrapper}
            onPress={handlePickAvatar}
            disabled={!isEditing}
            activeOpacity={0.8}
          >
            {isEditing ? (
              editData.avatarUrl ? (
                <Image source={{ uri: editData.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <User color={colors.brandPrimary} size={48} />
                </View>
              )
            ) : (
              profile?.avatarUrl ? (
                <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitial}>
                    {profile?.name ? profile.name.charAt(0).toUpperCase() : <User color={colors.brandPrimary} size={48} />}
                  </Text>
                </View>
              )
            )}
            {isEditing && (
              <View style={styles.cameraOverlay}>
                <Camera color="#fff" size={20} />
              </View>
            )}
          </TouchableOpacity>

          {/* Name + Email */}
          {isEditing ? (
            <TextInput
              style={styles.nameInput}
              value={editData.name || ''}
              onChangeText={v => setEditData({ ...editData, name: v })}
              placeholder="Your Name"
              placeholderTextColor={colors.textSecondary}
              textAlign="center"
            />
          ) : (
            <>
              <Text style={styles.profileName}>{profile?.name || 'Set your name'}</Text>
              {userEmail && <Text style={styles.profileEmail}>{userEmail}</Text>}
            </>
          )}

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: avgScore >= 75 ? colors.brandSafe : avgScore >= 50 ? colors.brandCaution : colors.brandHazardous }]}>
                {avgScore}
              </Text>
              <Text style={styles.statLabel}>Avg Score</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalScans}</Text>
              <Text style={styles.statLabel}>Total Scans</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{viewBmi}</Text>
              <Text style={styles.statLabel}>BMI</Text>
            </View>
          </View>

          {/* Edit button */}
          {!isEditing && (
            <TouchableOpacity style={[styles.editBtn, { backgroundColor: colors.brandPrimary }]} onPress={() => setIsEditing(true)}>
              <Edit3 color="#fff" size={16} />
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </GlassCard>

        {/* ── Body Profile ──────────────────────────────────────────────── */}
        <GlassCard>
          <View style={styles.cardHeader}>
            <Activity color={colors.brandPrimary} size={16} />
            <Text style={styles.cardTitle}>BODY PROFILE</Text>
          </View>

          {isEditing ? (
            <View style={styles.editGrid}>
              <View style={styles.editRow}>
                <FieldInput
                  label="Age (yrs)"
                  value={editData.age ? String(editData.age) : ''}
                  onChangeText={(v: string) => setEditData({ ...editData, age: v })}
                  keyboardType="numeric"
                />
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Gender</Text>
                  <View style={styles.pickerRow}>
                    {['Male', 'Female', 'Other'].map(g => (
                      <TouchableOpacity
                        key={g}
                        onPress={() => setEditData({ ...editData, gender: g })}
                        style={[styles.pickerChip, editData.gender === g && styles.pickerChipActive]}
                      >
                        <Text style={[styles.pickerChipText, editData.gender === g && { color: '#fff' }]}>
                          {g}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
              <View style={styles.editRow}>
                <FieldInput
                  label="Height (cm)"
                  value={editData.height ? String(editData.height) : ''}
                  onChangeText={(v: string) => setEditData({ ...editData, height: v })}
                  keyboardType="numeric"
                />
                <View style={{ width: 12 }} />
                <FieldInput
                  label="Weight (kg)"
                  value={editData.weight ? String(editData.weight) : ''}
                  onChangeText={(v: string) => setEditData({ ...editData, weight: v })}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>Activity Level</Text>
                <View style={styles.pickerRow}>
                  {['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active'].map(a => (
                    <TouchableOpacity
                      key={a}
                      onPress={() => setEditData({ ...editData, activityLevel: a })}
                      style={[styles.pickerChip, editData.activityLevel === a && styles.pickerChipActive]}
                    >
                      <Text style={[styles.pickerChipText, editData.activityLevel === a && { color: '#fff' }]}>
                        {a}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <Text style={styles.bmiPreview}>BMI Preview: {bmi}</Text>
            </View>
          ) : (
            <View style={styles.viewGrid}>
              <View style={styles.viewItem}>
                <Text style={styles.viewLabel}>Age & Gender</Text>
                <Text style={styles.viewValue}>
                  {profile?.age ? `${profile.age} yrs` : '--'}, {profile?.gender || '--'}
                </Text>
              </View>
              <View style={styles.viewItem}>
                <Text style={styles.viewLabel}>BMI</Text>
                <Text style={styles.viewValue}>{viewBmi}</Text>
              </View>
              <View style={styles.viewItem}>
                <Text style={styles.viewLabel}>Height & Weight</Text>
                <Text style={styles.viewValue}>
                  {profile?.height ? `${profile.height} cm` : '--'} / {profile?.weight ? `${profile.weight} kg` : '--'}
                </Text>
              </View>
              <View style={styles.viewItem}>
                <Text style={styles.viewLabel}>Activity</Text>
                <Text style={styles.viewValue}>{profile?.activityLevel || '--'}</Text>
              </View>
            </View>
          )}
        </GlassCard>

        {/* ── Dietary Preference ────────────────────────────────────────── */}
        <GlassCard>
          <Text style={styles.cardTitle}>DIETARY PREFERENCE</Text>
          {isEditing ? (
            <View style={styles.chipWrap}>
              {DIET_OPTIONS.map(d => (
                <Chip
                  key={d}
                  label={d}
                  active={editData.diet === d}
                  onPress={() => setEditData({ ...editData, diet: d })}
                />
              ))}
            </View>
          ) : (
            <View style={styles.dietView}>
              <Text style={styles.dietEmoji}>{getDietEmoji(profile?.diet)}</Text>
              <Text style={styles.dietName}>{profile?.diet || 'None'}</Text>
              <Text style={styles.dietLabel}>ACTIVE DIET</Text>
            </View>
          )}
        </GlassCard>

        {/* ── Conditions & Allergies ───────────────────────────────────── */}
        <GlassCard>
          <Text style={styles.cardTitle}>CONDITIONS & ALLERGIES</Text>
          {isEditing ? (
            <>
              <Text style={styles.chipSectionLabel}>ALLERGIES</Text>
              <View style={styles.chipWrap}>
                {ALLERGEN_OPTIONS.map(a => (
                  <Chip
                    key={a}
                    label={a}
                    active={(editData.allergens || []).some((i: string) => i.toLowerCase() === a.toLowerCase())}
                    color={colors.brandHazardous}
                    onPress={() => toggleArrayItem('allergens', a)}
                  />
                ))}
              </View>
              <Text style={[styles.chipSectionLabel, { marginTop: 16 }]}>HEALTH CONDITIONS</Text>
              <View style={styles.chipWrap}>
                {getConditionOptions(editData.gender || '').map(c => (
                  <Chip
                    key={c}
                    label={c}
                    active={(editData.conditions || []).some((i: string) => i.toLowerCase() === c.toLowerCase())}
                    color={colors.brandCaution}
                    onPress={() => toggleArrayItem('conditions', c)}
                  />
                ))}
              </View>
            </>
          ) : (
            <View style={styles.chipWrap}>
              {activeAllergens.length === 0 && activeConditions.length === 0 ? (
                <Text style={styles.emptyChipsText}>No specific conditions or allergies set.</Text>
              ) : null}
              {activeAllergens.map(a => (
                <View key={a} style={[styles.badgeChip, { backgroundColor: colors.brandHazardous + '15', borderColor: colors.brandHazardous + '30' }]}>
                  <Text style={[styles.badgeChipText, { color: colors.brandHazardous }]}>{a}</Text>
                </View>
              ))}
              {activeConditions.map(c => (
                <View key={c} style={[styles.badgeChip, { backgroundColor: colors.brandCaution + '15', borderColor: colors.brandCaution + '30' }]}>
                  <Text style={[styles.badgeChipText, { color: colors.brandCaution }]}>{c}</Text>
                </View>
              ))}
            </View>
          )}
        </GlassCard>

        {/* ── Personalized Insights ────────────────────────────────────── */}
        {!isEditing && (
          <View style={{ marginTop: 16 }}>
            <Text style={[styles.cardTitle, { marginLeft: 4, marginBottom: 12 }]}>PERSONALIZED INSIGHTS</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingHorizontal: 4 }}
            >
              {getPersonalizedInsights().map((insight) => (
                <View 
                  key={insight.id} 
                  style={[
                    styles.insightCard, 
                    { 
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                    }
                  ]}
                >
                  <View style={styles.insightHeader}>
                    <Text style={styles.insightIcon}>{insight.icon}</Text>
                    <Text style={styles.insightTitle}>{insight.title}</Text>
                  </View>
                  <Text style={styles.insightDesc}>{insight.desc}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Spacer for floating button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      <FloatingAIBubble />
    </View>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  glowTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: colors.brandPrimary + '0f',
    opacity: 0.7,
  },
  glowBottom: {
    position: 'absolute',
    bottom: 80,
    right: -40,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.brandSecondary + '0a',
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: 24,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnPrimary: {
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 110,
    gap: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  idCard: {
    alignItems: 'center',
  },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  cameraOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  nameInput: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.brandPrimary,
    width: '80%',
    padding: 2,
    textAlign: 'center',
  },
  profileEmail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    marginTop: 20,
    gap: 8,
  },
  editBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  viewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  viewItem: {
    width: '47%',
  },
  viewLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  viewValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  editGrid: {
    gap: 12,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  fieldWrapper: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pickerChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 4,
  },
  pickerChipActive: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  pickerChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  bmiPreview: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.brandPrimary,
    marginTop: 8,
  },
  dietView: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: isDark ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.02)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dietEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  dietName: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  dietLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  chipSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  badgeChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeChipText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyChipsText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    paddingVertical: 8,
  },
  insightCard: {
    width: 265,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  insightDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  chipInactive: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
  },
});
