import React from 'react';
import { StyleSheet, TouchableOpacity, View, Image } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppContext } from '../context/AppContext';
import { getThemeColors } from '../lib/theme';

export default function FloatingAIBubble() {
  const navigation = useNavigation<any>();
  const { theme } = useAppContext();
  const colors = getThemeColors(theme);
  const isDark = theme === 'dark';

  return (
    <TouchableOpacity 
      style={[
        styles.floatingButton, 
        { 
          borderColor: isDark ? '#080914' : '#ffffff', 
          backgroundColor: isDark ? '#080914' : '#ffffff', 
        }
      ]} 
      onPress={() => navigation.navigate('NutritionChat')}
      activeOpacity={0.85}
    >
      <View style={styles.gradient}>
        <Image 
          source={require('../../assets/ai-assistant.jpg')} 
          style={styles.avatarImage} 
        />
        <View style={styles.sparkleDot}>
          <Sparkles color="#67e8f9" size={8} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2.5,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  gradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  sparkleDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#1e1b4b',
    borderRadius: 6,
    padding: 2,
    borderWidth: 1,
    borderColor: '#67e8f9',
  },
});
