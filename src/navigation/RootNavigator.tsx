import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import NewsScreen from '../screens/NewsScreen';
import AnnouncementsScreen from '../screens/AnnouncementsScreen';
import ChatScreen from '../screens/ChatScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen 
          name="News" 
          component={NewsScreen} 
          options={{ headerShown: true, title: 'Local News' }}
        />
        <Stack.Screen 
          name="Announcements" 
          component={AnnouncementsScreen} 
          options={{ headerShown: true, title: 'Announcements' }}
        />
        <Stack.Screen 
          name="Chat" 
          component={ChatScreen} 
          options={{ headerShown: true, title: 'Chat' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
