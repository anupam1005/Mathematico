import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import * as Font from 'expo-font';

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

// Import ErrorBoundary
import ErrorBoundary from './src/components/ErrorBoundary';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const { user } = useAuth();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
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
  const [fontError, setFontError] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        // Try to load custom fonts, but don't crash if they fail
        await Font.loadAsync({
          MaterialIcons: require('./src/assets/fonts/MaterialIcons.ttf'),
        });
        console.log('✅ Custom fonts loaded successfully');
        setFontsLoaded(true);
      } catch (error) {
        console.warn('⚠️ Custom font loading failed, using system fonts:', error);
        setFontError(true);
        setFontsLoaded(true); // Continue without custom fonts
      }
    }
    
    // Add a timeout to prevent hanging
    const timeout = setTimeout(() => {
      console.warn('⚠️ Font loading timeout, continuing with system fonts');
      setFontsLoaded(true);
    }, 5000);
    
    loadFonts().finally(() => {
      clearTimeout(timeout);
    });
  }, []);

  if (!fontsLoaded) {
    return null; // Show loading screen
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <PaperProvider theme={theme as any}>
          <AuthProvider>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </AuthProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppContent />
    </GestureHandlerRootView>
  );
}