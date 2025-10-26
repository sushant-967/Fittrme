import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import WorkoutsScreen from '../screens/WorkoutsScreen';
import NutritionScreen from '../screens/NutritionScreen';
import EventsScreen from '../screens/EventsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { Text } from 'react-native';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: { backgroundColor: '#071022' },
        headerTintColor: '#E6EEF3',
        tabBarStyle: { backgroundColor: '#071022', borderTopColor: '#122033' },
        tabBarActiveTintColor: '#7EE7C8',
        tabBarInactiveTintColor: '#9FB3C8',
        headerTitleStyle: { fontWeight: '800' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Home', tabBarIcon: () => <Text>🏠</Text> }}
      />
      <Tab.Screen
        name="Workouts"
        component={WorkoutsScreen}
        options={{ tabBarLabel: 'Workouts', tabBarIcon: () => <Text>🏋️</Text> }}
      />
      <Tab.Screen
        name="Nutrition"
        component={NutritionScreen}
        options={{ tabBarLabel: 'Nutrition', tabBarIcon: () => <Text>🍎</Text> }}
      />
      <Tab.Screen
        name="Events"
        component={EventsScreen}
        options={{ tabBarLabel: 'Events', tabBarIcon: () => <Text>📅</Text> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile', tabBarIcon: () => <Text>👤</Text> }}
      />
    </Tab.Navigator>
  );
}