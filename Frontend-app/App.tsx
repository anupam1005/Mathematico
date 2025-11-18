import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { NavigationContainer, ParamListBase } from '@react-navigation/native';
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RouteProp } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';


import { Icon } from './src/components/Icon';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import BooksScreen from './src/screens/BooksScreen';
import CoursesScreen from './src/screens/CoursesScreen';
import LiveClassesScreen from './src/screens/LiveClassesScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';

// Import detail screens
import BookDetailScreen from './src/screens/BookDetailScreen';
import CourseDetailScreen from './src/screens/CourseDetailScreen';
import LiveClassDetailScreen from './src/screens/LiveClassDetailScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import SecurePdfScreen from './src/screens/SecurePdfScreen';
import AboutScreen from './src/screens/AboutScreen';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';
import TermsOfUseScreen from './src/screens/TermsOfUseScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Import admin navigator
import AdminNavigator from './src/admin/AdminNavigator';

// Import theme
import { theme } from './src/styles/theme';

// Import Auth Context
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

// Define the param list for the root stack
type RootStackParamList = {
  MainTabs: undefined;
  BookDetail: { bookId: string };
  CourseDetail: { courseId: string };
  LiveClassDetail: { classId: string };
  Checkout: { item: any; type: 'book' | 'course' | 'liveClass' };
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

function MainTabs() {
  const { user } = useAuth();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }: any) => ({
        tabBarIcon: ({ focused, color, size }: any) => {
          let iconName: any;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Books') {
            iconName = 'book';
          } else if (route.name === 'Courses') {
            iconName = 'school';
          } else if (route.name === 'LiveClasses') {
            iconName = 'videocam';
          } else if (route.name === 'Admin') {
            iconName = 'admin-panel-settings';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          } else {
            iconName = 'help';
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
  const { isAuthenticated, user } = useAuth();

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
        name="SecurePdf" 
        component={SecurePdfScreen as React.ComponentType<any>}
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
  const [fontError, setFontError] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Skip custom font loading to avoid ExpoFontLoader issues
        console.log('✅ Using system fonts for compatibility');
        setFontsLoaded(true);
      } catch (error) {
        console.warn('⚠️ Font preparation failed:', error);
        setFontsLoaded(true);
      } finally {
        // Hide splash screen
        await SplashScreen.hideAsync();
      }
    }
    
    prepare();
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


export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppContent />
    </GestureHandlerRootView>
  );
}