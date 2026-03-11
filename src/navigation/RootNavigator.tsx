import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import { BoardListScreen } from '../screens/BoardListScreen';
import { PostDetailScreen } from '../screens/PostDetailScreen';
import { CreatePostScreen } from '../screens/CreatePostScreen';
import ChatScreen from '../screens/ChatScreen';
import { Post } from '../types';

export type RootStackParamList = {
  MainTabs: undefined;
  News: undefined;
  Announcements: undefined;
  Chat: undefined;
  PostDetail: { post: Post };
  CreatePost: { category?: Post['category'] };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={TabNavigator} />

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
          options={{ headerShown: true, title: 'Chat' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
