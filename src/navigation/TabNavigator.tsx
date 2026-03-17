import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BoardListScreen } from '../screens/BoardListScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NotificationScreen from '../screens/NotificationScreen';
import HomeDashboardScreen from '../screens/HomeDashboardScreen';
import { useUserStore } from '../store/userStore';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const { unreadNotificationCount, unreadChatCount } = useUserStore();

  return (
    <Tab.Navigator screenOptions={{ headerShown: true }}>
      <Tab.Screen name="Home" component={HomeDashboardScreen} options={{ title: '홈', headerShown: false }} />
      <Tab.Screen name="Jobs" options={{ title: '구인구직' }}>
        {() => <BoardListScreen category="jobs" />}
      </Tab.Screen>
      <Tab.Screen name="RealEstate" options={{ title: '부동산' }}>
        {() => <BoardListScreen category="real_estate" />}
      </Tab.Screen>
      <Tab.Screen name="Marketplace" options={{ title: '중고장터' }}>
        {() => <BoardListScreen category="marketplace" />}
      </Tab.Screen>
      <Tab.Screen
        name="Chats"
        component={ChatScreen}
        options={{
          title: '채팅',
          tabBarBadge: unreadChatCount > 0 ? unreadChatCount : undefined,
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationScreen}
        options={{
          title: '알림',
          tabBarBadge: unreadNotificationCount > 0 ? unreadNotificationCount : undefined,
        }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: '내 정보' }} />
    </Tab.Navigator>
  );
}
