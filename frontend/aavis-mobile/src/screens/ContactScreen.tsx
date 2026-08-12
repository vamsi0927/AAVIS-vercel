import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, Linking, ActivityIndicator } from 'react-native';
import { ArrowLeft, Mail, Send } from 'lucide-react-native';
import { getThemeColors } from '../lib/theme';
import { useAppContext } from '../context/AppContext';

export default function ContactScreen({ navigation }: any) {
  const { theme } = useAppContext();
  const colors = getThemeColors(theme);
  const styles = getStyles(colors);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate support email dispatch trigger
    setTimeout(() => {
      setIsSubmitting(false);
      
      const mailUrl = `mailto:aavis.support@gmail.com?subject=${encodeURIComponent(`[Aavis Support] ${subject}`)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`)}`;
      
      Linking.openURL(mailUrl).catch(() => {
        Alert.alert('Support Alert', 'Could not launch your email app. Please write directly to aavis.support@gmail.com');
      });

      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    }, 1000);
  };

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {theme === 'dark' && <View style={styles.glowTop} />}

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.textPrimary} size={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Us</Text>
      </View>

      <View style={styles.supportBadgeCard}>
        <View style={styles.mailIconCircle}>
          <Mail color="#8b5cf6" size={24} />
        </View>
        <View style={styles.badgeTextDetails}>
          <Text style={styles.badgeLabel}>Need Help?</Text>
          <TouchableOpacity onPress={() => Linking.openURL('mailto:aavis.support@gmail.com')}>
            <Text style={styles.badgeLink}>📧 aavis.support@gmail.com</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.form}>
        <TextInput 
          style={styles.input}
          placeholder="Your name"
          placeholderTextColor={colors.textSecondary}
          value={name}
          onChangeText={setName}
        />
        
        <TextInput 
          style={styles.input}
          placeholder="Your email"
          placeholderTextColor={colors.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput 
          style={styles.input}
          placeholder="Subject"
          placeholderTextColor={colors.textSecondary}
          value={subject}
          onChangeText={setSubject}
        />

        <TextInput 
          style={[styles.input, styles.textArea]}
          placeholder="Your message..."
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={6}
          value={message}
          onChangeText={setMessage}
        />

        <TouchableOpacity 
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <View style={styles.buttonContent}>
              <Send color="white" size={16} style={{ marginRight: 8 }} />
              <Text style={styles.submitButtonText}>Send Message</Text>
            </View>
          )}
        </TouchableOpacity>
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
  supportBadgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    padding: 16,
    marginBottom: 24,
    gap: 16,
  },
  mailIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTextDetails: {
    flex: 1,
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  badgeLink: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8b5cf6',
    textDecorationLine: 'underline',
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    height: 52,
    paddingHorizontal: 16,
    color: colors.textPrimary,
    fontSize: 14,
  },
  textArea: {
    height: 120,
    paddingTop: 16,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 16,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
