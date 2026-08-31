import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { colors } from './src/theme';
import { ensureAndroidChannel } from './src/utils/notifications';
import ErrorBoundary from './src/components/ErrorBoundary';

import SignupScreen from './src/screens/SignupScreen';
import VerifyScreen from './src/screens/VerifyScreen';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import ActivityScreen from './src/screens/ActivityScreen';
import FoodScreen from './src/screens/FoodScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import MoreScreen from './src/screens/MoreScreen';
import RoutineScreen from './src/screens/RoutineScreen';
import WaterScreen from './src/screens/WaterScreen';
import WeightScreen from './src/screens/WeightScreen';
import GoalsScreen from './src/screens/GoalsScreen';
import CaloriesScreen from './src/screens/CaloriesScreen';
import WeeklyScreen from './src/screens/WeeklyScreen';
import MonthlyScreen from './src/screens/MonthlyScreen';
import NotificationSettingsScreen from './src/screens/NotificationSettingsScreen';

const AuthStack = createNativeStackNavigator();
const MoreStack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.bg, card: colors.surface, text: colors.text, border: colors.line, primary: colors.gold }
};

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
      <AuthStack.Screen name="Verify" component={VerifyScreen} />
    </AuthStack.Navigator>
  );
}

function MoreNavigator() {
  return (
    <MoreStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerShadowVisible: false
      }}>
      <MoreStack.Screen name="MoreHub" component={MoreScreen} options={{ title: 'More' }} />
      <MoreStack.Screen name="Goals" component={GoalsScreen} options={{ title: 'Goals' }} />
      <MoreStack.Screen name="Routine" component={RoutineScreen} options={{ title: 'Daily Routine' }} />
      <MoreStack.Screen name="Water" component={WaterScreen} options={{ title: 'Water Tracker' }} />
      <MoreStack.Screen name="Weight" component={WeightScreen} options={{ title: 'Weight Tracker' }} />
      <MoreStack.Screen name="Calories" component={CaloriesScreen} options={{ title: 'Calorie Calculator' }} />
      <MoreStack.Screen name="Weekly" component={WeeklyScreen} options={{ title: 'Weekly Summary' }} />
      <MoreStack.Screen name="Monthly" component={MonthlyScreen} options={{ title: 'Monthly Analysis' }} />
      <MoreStack.Screen name="Notifications" component={NotificationSettingsScreen} options={{ title: 'Notifications' }} />
    </MoreStack.Navigator>
  );
}

const TAB_ICONS = { Home: '🏆', Activity: '🏋', Food: '🍴', Leaderboard: '📊', Calendar: '📅', More: '⋮' };

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line },
        tabBarIcon: () => <Text style={{ fontSize: 16 }}>{TAB_ICONS[route.name]}</Text>,
        tabBarLabelStyle: { fontSize: 9, textTransform: 'uppercase', fontWeight: '700' }
      })}>
      <Tabs.Screen name="Home" component={HomeScreen} />
      <Tabs.Screen name="Activity" component={ActivityScreen} />
      <Tabs.Screen name="Food" component={FoodScreen} />
      <Tabs.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Tabs.Screen name="Calendar" component={CalendarScreen} />
      <Tabs.Screen name="More" component={MoreNavigator} />
    </Tabs.Navigator>
  );
}

function Root() {
  const { user, booting } = useAuth();

  if (booting) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.gold} size="large" />
        <Text style={styles.loadingText}>Loading FitForge…</Text>
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style="light" />
      {user ? <MainTabs /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

export default function App() {
  React.useEffect(() => { ensureAndroidChannel(); }, []);
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <Root />
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: colors.muted, fontSize: 13 }
});
