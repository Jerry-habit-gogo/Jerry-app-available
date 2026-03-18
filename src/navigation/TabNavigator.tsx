import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

import { BoardListScreen } from '../screens/BoardListScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import HomeDashboardScreen from '../screens/HomeDashboardScreen';
import { useUserStore } from '../store/userStore';
import { color, typography, shadow } from '../theme/tokens';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const { unreadChatCount } = useUserStore();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarActiveTintColor: color.brand.green,
        tabBarInactiveTintColor: color.text.tertiary,
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 88 : 64,
          backgroundColor: Platform.OS === 'android' ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
          ...shadow.soft,
        },
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView tint="light" intensity={80} style={StyleSheet.absoluteFill} />
          ) : null,
        tabBarLabelStyle: {
          fontSize: typography.size.micro,
          fontFamily: typography.family.base,
          fontWeight: typography.weight.medium,
          paddingBottom: Platform.OS === 'ios' ? 0 : 8,
        },
        headerStyle: {
          backgroundColor: color.bg.surface,
          borderBottomColor: color.line.default,
          borderBottomWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: color.text.primary,
        headerTitleStyle: {
          fontWeight: typography.weight.bold,
          fontSize: typography.size.body,
          fontFamily: typography.family.base,
        },
        // 컨셉에 어울리는 미니멀 아이콘 지정
        tabBarIcon: ({ focused, color: iconColor, size }) => {
          let iconName: any = 'ellipse';

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Search':
              iconName = focused ? 'search' : 'search-outline';
              break;
            case 'Chats':
              iconName = focused ? 'chatbubble' : 'chatbubble-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
          }

          return <Ionicons name={iconName} size={size} color={iconColor} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeDashboardScreen} options={{ title: '홈', headerShown: false }} />
      <Tab.Screen name="Search" options={{ title: '검색' }}>
        {() => <BoardListScreen hideCreateButton />}
      </Tab.Screen>
      <Tab.Screen
        name="Chats"
        component={ChatScreen}
        options={{
          title: '채팅',
          tabBarBadge: unreadChatCount > 0 ? unreadChatCount : undefined,
          tabBarBadgeStyle: { backgroundColor: color.state.error, color: color.text.inverse },
        }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: '내 정보' }} />
    </Tab.Navigator>
  );
}
