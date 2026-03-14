import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import { BoardListScreen } from '../screens/BoardListScreen';
import { PostDetailScreen } from '../screens/PostDetailScreen';
import { CreatePostScreen } from '../screens/CreatePostScreen';
import ChatScreen from '../screens/ChatScreen';
import AuthScreen from '../screens/AuthScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ChatDetailScreen from '../screens/ChatDetailScreen';
import NotificationScreen from '../screens/NotificationScreen';
import { ChatRoom, Post } from '../types';

export type RootStackParamList = {
  MainTabs: undefined;
  Auth: undefined;
  EditProfile: undefined;
  News: undefined;
  Announcements: undefined;
  Chat: undefined;
  ChatDetail: { chatRoom: ChatRoom };
  PostDetail: { post: Post };
  CreatePost: { category?: Post['category'] };
  Notifications: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={TabNavigator} />

        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={{ headerShown: true, title: '계정', headerBackTitle: '뒤로가기' }}
        />

        <Stack.Screen
          name="EditProfile"
          component={EditProfileScreen}
          options={{ headerShown: true, title: '프로필 수정', headerBackTitle: '뒤로가기' }}
        />

        {/* Reusing BoardListScreen for News and Announcements */}
        <Stack.Screen
          name="News"
          options={{ headerShown: true, title: 'Local News' }}
        >
          {() => <BoardListScreen category="news" />}
        </Stack.Screen>

        <Stack.Screen
          name="Announcements"
          options={{ headerShown: true, title: 'Announcements' }}
        >
          {() => <BoardListScreen category="announcements" />}
        </Stack.Screen>

        {/* New Screens */}
        <Stack.Screen
          name="PostDetail"
          component={PostDetailScreen}
          options={{ headerShown: true, title: '게시글 상세', headerBackTitle: '뒤로가기' }}
        />

        <Stack.Screen
          name="CreatePost"
          component={CreatePostScreen}
          options={{ headerShown: true, title: '글쓰기', headerBackTitle: '취소' }}
        />

        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          options={{ headerShown: true, title: '채팅' }}
        />

        <Stack.Screen
          name="ChatDetail"
          component={ChatDetailScreen}
          options={{ headerShown: true, title: '대화' }}
        />

        <Stack.Screen
          name="Notifications"
          component={NotificationScreen}
          options={{ headerShown: true, title: '알림', headerBackTitle: '뒤로가기' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
