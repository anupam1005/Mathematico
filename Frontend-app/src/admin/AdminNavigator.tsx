// @ts-nocheck
import React, { Suspense } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from '../components/Icon';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AdminDashboard = React.lazy(() => import('./screens/AdminDashboard'));
const AdminBooks = React.lazy(() => import('./screens/AdminBooks'));
const AdminCourses = React.lazy(() => import('./screens/AdminCourses'));
const AdminLiveClasses = React.lazy(() => import('./screens/AdminLiveClasses'));
const AdminUsers = React.lazy(() => import('./screens/AdminUsers'));
const AdminPayments = React.lazy(() => import('./screens/AdminPayments'));
const AdminSettings = React.lazy(() => import('./screens/AdminSettings'));

const BookForm = React.lazy(() => import('./screens/BookForm'));
const CourseForm = React.lazy(() => import('./screens/CourseForm'));
const LiveClassForm = React.lazy(() => import('./screens/LiveClassForm'));

const AdminLoading = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#3b82f6" />
  </View>
);

function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;
          if (route.name === 'Dashboard') {
            iconName = 'dashboard';
          } else if (route.name === 'Books') {
            iconName = 'book';
          } else if (route.name === 'Courses') {
            iconName = 'school';
          } else if (route.name === 'LiveClasses') {
            iconName = 'videocam';
          } else if (route.name === 'Users') {
            iconName = 'people';
          } else if (route.name === 'Payments') {
            iconName = 'payment';
          } else if (route.name === 'Settings') {
            iconName = 'settings';
          } else {
            iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={AdminDashboard}
        options={{
          tabBarLabel: 'Dashboard',
        }}
      />
      <Tab.Screen 
        name="Books" 
        component={AdminBooks}
        options={{
          tabBarLabel: 'Books',
        }}
      />
      <Tab.Screen 
        name="Courses" 
        component={AdminCourses}
        options={{
          tabBarLabel: 'Courses',
        }}
      />
      <Tab.Screen 
        name="LiveClasses" 
        component={AdminLiveClasses}
        options={{
          tabBarLabel: 'Live Classes',
        }}
      />
      <Tab.Screen 
        name="Users" 
        component={AdminUsers}
        options={{
          tabBarLabel: 'Users',
        }}
      />
      <Tab.Screen 
        name="Payments" 
        component={AdminPayments}
        options={{
          tabBarLabel: 'Payments',
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={AdminSettings}
        options={{
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
}

export default function AdminNavigator() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="AdminTabs" component={AdminTabs} />

        {/* Form Screens */}
        <Stack.Screen
          name="BookForm"
          component={BookForm}
          options={{
            headerShown: true,
            title: 'Book Form',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="CourseForm"
          component={CourseForm}
          options={{
            headerShown: true,
            title: 'Course Form',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="LiveClassForm"
          component={LiveClassForm}
          options={{
            headerShown: true,
            title: 'Live Class Form',
            headerBackTitle: 'Back',
          }}
        />
      </Stack.Navigator>
    </Suspense>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
});
