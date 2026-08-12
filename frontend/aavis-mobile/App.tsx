import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import React, { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { WifiOff, Home, Activity, Clock, BookOpen, User, Scan } from 'lucide-react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';


import SplashScreen from './src/screens/SplashScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import HomeScreen from './src/screens/HomeScreen';
import ScanScreen from './src/screens/ScanScreen';
import ResultScreen from './src/screens/ResultScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { EducationScreen } from './src/screens/EducationScreen';
import FoodMythsScreen from './src/screens/FoodMythsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import NutritionChatScreen from './src/screens/NutritionChatScreen';
import WaterTrackerScreen from './src/screens/WaterTrackerScreen';
import AchievementsScreen from './src/screens/AchievementsScreen';
import PrivacyScreen from './src/screens/PrivacyScreen';
import TermsScreen from './src/screens/TermsScreen';
import HelpScreen from './src/screens/HelpScreen';
import ContactScreen from './src/screens/ContactScreen';
import AboutScreen from './src/screens/AboutScreen';
import HealthScreen from './src/screens/HealthScreen';
import { AppProvider, useAppContext } from './src/context/AppContext';
import { getThemeColors } from './src/lib/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
export const navigationRef = createNavigationContainerRef();

function TabNavigator() {
  const { theme } = useAppContext();
  const colors = getThemeColors(theme);
  const isDark = theme === 'dark';
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#080914' : '#ffffff',
          borderTopColor: colors.border,
          paddingBottom: insets.bottom > 0 ? insets.bottom + 4 : 8,
          paddingTop: 8,
          height: 60 + (insets.bottom > 0 ? insets.bottom : 8),
        },
        tabBarActiveTintColor: colors.brandPrimary,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={HomeScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="Health" 
        component={HealthScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Activity color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="History" 
        component={HistoryScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Clock color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="Education" 
        component={EducationScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />
        }}
      />
    </Tab.Navigator>
  );
}

function OfflineIndicator() {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });
    return unsubscribe;
  }, []);

  if (isConnected !== false) return null;

  return (
    <SafeAreaView style={styles.offlineContainer}>
      <View style={styles.offlineContent}>
        <WifiOff color="white" size={16} />
        <Text style={styles.offlineText}>
          No Internet Connection
        </Text>
      </View>
    </SafeAreaView>
  );
}

function MainApp() {
  const { theme } = useAppContext();
  const colors = getThemeColors(theme);
  const isDark = theme === 'dark';
  const [currentRoute, setCurrentRoute] = useState<string>('Splash');
  const insets = useSafeAreaInsets();

  // Show center floating scan button only on main tabs
  const showScanButton = ['Dashboard', 'Health', 'History', 'Education', 'Profile'].includes(currentRoute);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <OfflineIndicator />
      <NavigationContainer 
        ref={navigationRef}
        onStateChange={() => {
          const routeName = (navigationRef.getCurrentRoute() as any)?.name;
          if (routeName) {
            setCurrentRoute(routeName);
          }
        }}
      >
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack.Navigator 
          initialRouteName="Splash"
          screenOptions={{
            headerShown: false,
            animation: 'fade',
          }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          <Stack.Screen name="Home" component={TabNavigator} />
          <Stack.Screen name="Scan" component={ScanScreen} />
          <Stack.Screen name="Result" component={ResultScreen} />
          <Stack.Screen name="FoodMyths" component={FoodMythsScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="NutritionChat" component={NutritionChatScreen} />
          <Stack.Screen name="WaterTracker" component={WaterTrackerScreen} />
          <Stack.Screen name="Achievements" component={AchievementsScreen} />
          <Stack.Screen name="Privacy" component={PrivacyScreen} />
          <Stack.Screen name="Terms" component={TermsScreen} />
          <Stack.Screen name="Help" component={HelpScreen} />
          <Stack.Screen name="Contact" component={ContactScreen} />
          <Stack.Screen name="About" component={AboutScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      
      {/* Center Floating Scan Button */}
      {showScanButton && (
        <View style={[styles.scanButtonWrapper, { bottom: 42 + insets.bottom }]} pointerEvents="box-none">
          <TouchableOpacity 
            style={[
              styles.scanButton,
              {
                backgroundColor: colors.brandPrimary,
                borderColor: isDark ? '#080914' : '#ffffff', // cutout border matching the tab bar background
                shadowColor: colors.brandPrimary,
              }
            ]}
            onPress={() => {
              if (navigationRef.isReady()) {
                navigationRef.navigate('Scan' as never);
              }
            }}
          >
            <Scan color="white" size={28} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <AppProvider>
        <MainApp />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  offlineContainer: {
    backgroundColor: '#ef4444', // red-500
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 50,
  },
  offlineContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    paddingTop: 40,
    paddingBottom: 8,
  },
  offlineText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 8,
    textAlign: 'center',
  },
  scanButtonWrapper: {
    position: 'absolute',
    bottom: 42,
    alignSelf: 'center',
    zIndex: 100,
  },
  scanButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 4,
  },
});
