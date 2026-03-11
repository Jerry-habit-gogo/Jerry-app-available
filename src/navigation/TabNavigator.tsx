import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BoardListScreen } from '../screens/BoardListScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: true }}>
      <Tab.Screen name="Home" options={{ title: '홈' }}>
        {() => <BoardListScreen />}
      </Tab.Screen>
      <Tab.Screen name="Jobs" options={{ title: '구인구직' }}>
        {() => <BoardListScreen category="jobs" />}
      </Tab.Screen>
      <Tab.Screen name="RealEstate" options={{ title: '부동산' }}>
        {() => <BoardListScreen category="real_estate" />}
      </Tab.Screen>
      <Tab.Screen name="Marketplace" options={{ title: '중고장터' }}>
        {() => <BoardListScreen category="marketplace" />}
      </Tab.Screen>
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: '내 정보' }} />
    </Tab.Navigator>
  );
}
