import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import React, { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';
import Svg, { Text as SvgText, LinearGradient as SvgGradient, Defs, Stop, TSpan } from 'react-native-svg';

export default function SplashScreen({ navigation }: any) {
  const { hasCompletedOnboarding } = useAppContext();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Simulate splash loading time
      setTimeout(() => {
        if (session) {
          if (!hasCompletedOnboarding) {
            navigation.replace('Onboarding');
          } else {
            navigation.replace('Home');
          }
        } else {
          navigation.replace('Login');
        }
      }, 2000);
    };
    checkAuth();
  }, [hasCompletedOnboarding]);

  return (
    <View style={styles.container}>
      <Image 
        source={require('../../assets/logo.png')} 
        style={styles.logoImage} 
      />
      
      <Svg height={55} width={220} style={styles.gradientSvg}>
        <Defs>
          <SvgGradient id="logoGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#8b5cf6" />
            <Stop offset="1" stopColor="#06b6d4" />
          </SvgGradient>
        </Defs>
        <SvgText
          fill="url(#logoGrad)"
          fontSize="42"
          fontWeight="900"
          y="42"
          textAnchor="middle"
          fontFamily="Space Grotesk"
        >
          <TSpan x="50">A</TSpan>
          <TSpan x="80">A</TSpan>
          <TSpan x="110">V</TSpan>
          <TSpan x="135">I</TSpan>
          <TSpan x="160">S</TSpan>
        </SvgText>
      </Svg>

      <Text style={styles.caption}>KNOW YOUR FOOD</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa', // clean light grey-white background
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 130,
    height: 130,
    resizeMode: 'contain',
    zIndex: 10,
    marginBottom: 8,
  },
  gradientSvg: {
    marginVertical: 4,
  },
  caption: {
    fontSize: 12,
    color: '#0f172a', // dark gray-black
    fontWeight: 'bold',
    letterSpacing: 3.5, // spaced uppercase caption
    marginTop: 8,
  },
});
