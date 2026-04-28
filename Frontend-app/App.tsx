import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Icon } from './src/components/Icon';
import ErrorBoundary from './src/components/ErrorBoundary';
import { safeCatch } from './src/utils/safeCatch';
import * as SplashScreen from 'expo-splash-screen';

// Import theme
import { theme } from './src/styles/theme';
import type { RazorpayWebCheckoutPayload } from './src/services/razorpayService';

// Import Auth Context
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

// Define the param list for the root stack
type RootStackParamList = {
  MainTabs: undefined;
  BookDetail: { bookId: string };
  CourseDetail: { courseId: string };
  LiveClassDetail: { classId: string };
  Checkout: { itemId: string; itemData: any; type: 'book' | 'course' | 'liveClass' };
  RazorpayCheckout: {
    webOptions: RazorpayWebCheckoutPayload;
    itemContext: {
      itemId: string;
      itemData: any;
      type: 'book' | 'course' | 'liveClass';
    };
  };
  SecurePdf: { bookId: string; bookTitle?: string };
  About: undefined;
  PrivacyPolicy: undefined;
  TermsOfUse: undefined;
  Settings: undefined;
  Login: undefined;
  Register: undefined;
  Admin: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

import HomeScreen from './src/screens/HomeScreen';
import BooksScreen from './src/screens/BooksScreen';
import CoursesScreen from './src/screens/CoursesScreen';
import LiveClassesScreen from './src/screens/LiveClassesScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';

import BookDetailScreen from './src/screens/BookDetailScreen';
import CourseDetailScreen from './src/screens/CourseDetailScreen';
import LiveClassDetailScreen from './src/screens/LiveClassDetailScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import RazorpayCheckoutScreen from './src/screens/RazorpayCheckoutScreen';

import SecurePdfScreen from './src/screens/SecurePdfScreen';

import AboutScreen from './src/screens/AboutScreen';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';
import TermsOfUseScreen from './src/screens/TermsOfUseScreen';
import SettingsScreen from './src/screens/SettingsScreen';

import AdminNavigator from './src/admin/AdminNavigator';

const AppLoading = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={theme.colors.primary} />
  </View>
);

function MainTabs() {
  const { user } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={({ route }: any) => ({
        tabBarIcon: ({ color, size }: any) => {
          let iconName: any;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Books') {
            iconName = 'book';
          } else if (route.name === 'Courses') {
            iconName = 'school';
          } else if (route.name === 'LiveClasses') {
            iconName = 'video';
          } else if (route.name === 'Admin') {
            iconName = 'shield-account';
          } else if (route.name === 'Profile') {
            iconName = 'account';
          } else {
            iconName = 'help-circle';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Books"
        component={BooksScreen}
        options={{
          tabBarLabel: 'Books',
        }}
      />
      <Tab.Screen
        name="Courses"
        component={CoursesScreen}
        options={{
          tabBarLabel: 'Courses',
        }}
      />
      <Tab.Screen
        name="LiveClasses"
        component={LiveClassesScreen}
        options={{
          tabBarLabel: 'Live Classes',
        }}
      />
      {user?.isAdmin && (
        <Tab.Screen
          name="Admin"
          component={AdminNavigator}
          options={{
            tabBarLabel: 'Admin',
          }}
        />
      )}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <AppLoading />;
  }

  if (!isAuthenticated) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />

      {/* Detail Screens */}
      <Stack.Screen
        name="BookDetail"
        component={BookDetailScreen}
        options={{
          headerShown: true,
          title: 'Book Details',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="CourseDetail"
        component={CourseDetailScreen}
        options={{
          headerShown: true,
          title: 'Course Details',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="LiveClassDetail"
        component={LiveClassDetailScreen}
        options={{
          headerShown: true,
          title: 'Live Class Details',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{
          headerShown: true,
          title: 'Checkout',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="RazorpayCheckout"
        component={RazorpayCheckoutScreen}
        options={{
          headerShown: true,
          title: 'Pay securely',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="SecurePdf"
        component={SecurePdfScreen}
        options={{
          headerShown: false,
        }}
      />

      {/* Legal & Info Screens */}
      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={{
          headerShown: true,
          title: 'About Us',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{
          headerShown: true,
          title: 'Privacy Policy',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="TermsOfUse"
        component={TermsOfUseScreen}
        options={{
          headerShown: true,
          title: 'Terms of Use',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

function AppContent() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let settingsSyncCleanup: (() => void) | null = null;

    const prepareApp = async () => {
      try {
        try {
          await SplashScreen.preventAutoHideAsync();
        } catch (error) {
          safeCatch('AppContent.SplashScreen.preventAutoHideAsync')(error);
        }
        // Skip custom font loading to avoid ExpoFontLoader issues
      } catch (error) {
        safeCatch('AppContent.prepareFonts')(error);
      } finally {
        if (isMounted) {
          setFontsLoaded(true);
        }
        try {
          await SplashScreen.hideAsync();
        } catch (error) {
          safeCatch('AppContent.SplashScreen.hideAsync')(error);
        }
      }
    };

    const startSettingsSync = async () => {
      try {
        const { startSettingsSyncListener } = await import('./src/services/settingsService');
        settingsSyncCleanup = startSettingsSyncListener();
      } catch (error) {
        safeCatch('AppContent.startSettingsSyncListener')(error);
      }
    };

    prepareApp();
    startSettingsSync();

    return () => {
      isMounted = false;
      if (settingsSyncCleanup) {
        try {
          settingsSyncCleanup();
        } catch (error) {
          safeCatch('AppContent.settingsSyncCleanup')(error);
        }
      }
    };
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme as any}>
        <AuthProvider>
          <NavigationContainer>
              <AppNavigator />
          </NavigationContainer>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
});

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppContent />
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}