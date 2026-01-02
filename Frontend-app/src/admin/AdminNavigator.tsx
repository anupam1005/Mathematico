// @ts-nocheck
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
<<<<<<< HEAD
import { Icon } from '../components/Icon';
=======
import { MaterialIcons as Icon } from '@expo/vector-icons';
// import { MaterialCommunityIcons } from '@expo/vector-icons';
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686

// Import Admin Screens
import AdminDashboard from './screens/AdminDashboard';
import AdminBooks from './screens/AdminBooks';
import AdminCourses from './screens/AdminCourses';
import AdminLiveClasses from './screens/AdminLiveClasses';
import AdminUsers from './screens/AdminUsers';
import AdminPayments from './screens/AdminPayments';
import AdminSettings from './screens/AdminSettings';

// Import Form Screens
import BookForm from './screens/BookForm';
import CourseForm from './screens/CourseForm';
import LiveClassForm from './screens/LiveClassForm';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;
<<<<<<< HEAD
=======
          let IconComponent = Icon;

>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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

<<<<<<< HEAD
          return <Icon name={iconName} size={size} color={color} />;
=======
          return <IconComponent name={iconName} size={size} color={color} />;
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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
  );
}
