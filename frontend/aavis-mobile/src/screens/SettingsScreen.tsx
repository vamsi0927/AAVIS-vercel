import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image, Alert, Switch } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Moon, Camera, Trash2, Shield, FileText, UserX, HelpCircle, Mail, Info, LogOut, ChevronRight } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';
import { getThemeColors } from '../lib/theme';
import FloatingAIBubble from '../components/FloatingAIBubble';

export function SettingsScreen({ navigation }: any) {
  const { theme, setTheme, clearHistory, logout } = useAppContext();

  const colors = getThemeColors(theme);
  const styles = getStyles(colors);

  const handleNotImplemented = (feature: string) => {
    Alert.alert("Coming Soon", `The ${feature} feature is not yet implemented on mobile.`);
  };

  const handleClearHistory = () => {
    Alert.alert(
      "Clear History",
      "Are you sure you want to delete all scan records? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: () => {
            clearHistory();
            Alert.alert("Success", "Scan history cleared.");
          } 
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account?",
      "Are you absolutely sure you want to delete your account? This action is permanent and will delete all your data.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => handleNotImplemented('Delete Account') }
      ]
    );
  };

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Sign Out", 
          style: "destructive", 
          onPress: async () => {
            await logout();
            navigation.replace('Login');
          } 
        }
      ]
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {theme === 'dark' && <View style={styles.glowTop} />}
        
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Settings</Text>
        </View>

      {/* App Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>App Settings</Text>
        <View style={styles.card}>
          
          <View style={styles.rowItem}>
            <View style={styles.rowLeft}>
              <Moon size={20} color="#818cf8" />
              <Text style={styles.rowText}>Dark Theme</Text>
            </View>
            <Switch 
              value={theme === 'dark'} 
              onValueChange={(val) => setTheme(val ? 'dark' : 'light')} 
              trackColor={{ false: '#3f3f46', true: '#14b8a6' }} 
            />
          </View>

          <TouchableOpacity 
            style={styles.rowItem} 
            onPress={() => handleNotImplemented('Camera Permissions')}
          >
            <View style={styles.rowLeft}>
              <Camera size={20} color="#34d399" />
              <Text style={styles.rowText}>Camera Permissions</Text>
            </View>
            <ChevronRight size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.rowItem, styles.lastRow]} 
            onPress={handleClearHistory}
          >
            <View style={styles.rowLeft}>
              <Trash2 size={20} color="#f87171" />
              <View>
                <Text style={styles.rowText}>Clear Scan History</Text>
                <Text style={styles.rowSubText}>Remove all saved scans</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Data & Privacy */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Data & Privacy</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.rowItem} onPress={() => navigation.navigate('Privacy')}>
            <View style={styles.rowLeft}>
              <Shield size={20} color={colors.textSecondary} />
              <Text style={styles.rowText}>Privacy Policy</Text>
            </View>
            <ChevronRight size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.rowItem} onPress={() => navigation.navigate('Terms')}>
            <View style={styles.rowLeft}>
              <FileText size={20} color={colors.textSecondary} />
              <Text style={styles.rowText}>Terms & Conditions</Text>
            </View>
            <ChevronRight size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.rowItem, styles.lastRow]} onPress={handleDeleteAccount}>
            <View style={styles.rowLeft}>
              <UserX size={20} color="#ef4444" />
              <Text style={[styles.rowText, { color: '#ef4444' }]}>Delete Account</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Support & Guides */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Support & Guides</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.rowItem} onPress={() => navigation.navigate('Help')}>
            <View style={styles.rowLeft}>
              <HelpCircle size={20} color="#00e5ff" />
              <Text style={styles.rowText}>Help & FAQ</Text>
            </View>
            <ChevronRight size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.rowItem} onPress={() => navigation.navigate('Contact')}>
            <View style={styles.rowLeft}>
              <Mail size={20} color="#00e5ff" />
              <Text style={styles.rowText}>Contact Support</Text>
            </View>
            <ChevronRight size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.rowItem, styles.lastRow]} onPress={() => navigation.navigate('About')}>
            <View style={styles.rowLeft}>
              <Info size={20} color={colors.textSecondary} />
              <Text style={styles.rowText}>About Aavis</Text>
            </View>
            <ChevronRight size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Account */}
      <View style={[styles.section, { marginBottom: 40 }]}>
        <Text style={styles.sectionHeader}>Account</Text>
        <View style={styles.card}>
          <TouchableOpacity style={[styles.rowItem, styles.lastRow]} onPress={handleSignOut}>
            <View style={styles.rowLeft}>
              <LogOut size={20} color="#ef4444" />
              <Text style={[styles.rowText, { color: '#ef4444' }]}>Sign Out</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Version */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Aavis Mobile 1.0.0</Text>
      </View>
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
    paddingBottom: 60,
  },
  glowTop: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 250,
    height: 250,
    backgroundColor: '#8b5cf6',
    borderRadius: 125,
    opacity: 0.04,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    marginRight: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  backButtonText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    paddingLeft: 4,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    overflow: 'hidden',
  },
  aiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  aiIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  aiTextContainer: {
    flex: 1,
  },
  aiTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: 'bold',
  },
  aiSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  providerButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  providerButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  activeProvider: {
    backgroundColor: 'rgba(20, 184, 166, 0.1)',
    borderColor: '#14b8a6',
  },
  inactiveProvider: {
    backgroundColor: colors.isDark ? '#080914' : '#f5f6fa',
    borderColor: colors.border,
  },
  providerButtonText: {
    fontWeight: 'bold',
    fontSize: 13,
  },
  providerSubText: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  textTeal: {
    color: '#14b8a6',
  },
  textWhite: {
    color: colors.textPrimary,
  },
  noticeBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: 16,
    padding: 12,
    margin: 16,
    marginTop: 0,
  },
  noticeTitle: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  noticeDesc: {
    color: colors.textPrimary,
    fontSize: 10,
    lineHeight: 14,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rowText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: 'bold',
  },
  rowSubText: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  versionText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.25)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
