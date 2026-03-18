import React from 'react';
import { createNavigationContainerRef, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import { BoardListScreen } from '../screens/BoardListScreen';
import { PostDetailScreen } from '../screens/PostDetailScreen';
import { CreatePostScreen } from '../screens/CreatePostScreen';
import ChatScreen from '../screens/ChatScreen';
import AuthScreen from '../screens/AuthScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ProfileSettingsScreen from '../screens/ProfileSettingsScreen';
import ChatDetailScreen from '../screens/ChatDetailScreen';
import NotificationScreen from '../screens/NotificationScreen';
import SavedPostsScreen from '../screens/SavedPostsScreen';
import RecentlyViewedScreen from '../screens/RecentlyViewedScreen';
import BrowseScreen from '../screens/BrowseScreen';
import BlockedUsersScreen from '../screens/BlockedUsersScreen';
import DesignPreviewScreen from '../screens/DesignPreviewScreen';
import { ChatRoom, Post, PostFilterOptions } from '../types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export type RootStackParamList = {
  MainTabs: undefined;
  Auth: undefined;
  EditProfile: undefined;
  ProfileSettings: undefined;
  News: undefined;
  Announcements: undefined;
  Chat: undefined;
  ChatDetail: { chatRoom: ChatRoom };
  PostDetail: { post: Post };
  Browse: { title: string; category?: Post['category']; initialFilters?: Partial<PostFilterOptions>; hideCreateButton?: boolean };
  CreatePost: { category?: Post['category']; post?: Post } | undefined;
  Notifications: undefined;
  SavedPosts: undefined;
  RecentlyViewed: undefined;
  BlockedUsers: undefined;
  DesignPreview: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer ref={navigationRef}>
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

        <Stack.Screen
          name="ProfileSettings"
          component={ProfileSettingsScreen}
          options={{ headerShown: true, title: '설정', headerBackTitle: '뒤로가기' }}
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
          name="Browse"
          component={BrowseScreen}
          options={({ route }) => ({
            headerShown: true,
            title: route.params.title,
            headerBackTitle: '뒤로가기',
          })}
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

        <Stack.Screen
          name="SavedPosts"
          component={SavedPostsScreen}
          options={{ headerShown: true, title: '저장한 게시글', headerBackTitle: '뒤로가기' }}
        />

        <Stack.Screen
          name="RecentlyViewed"
          component={RecentlyViewedScreen}
          options={{ headerShown: true, title: '최근 본 게시글', headerBackTitle: '뒤로가기' }}
        />

        <Stack.Screen
          name="BlockedUsers"
          component={BlockedUsersScreen}
          options={{ headerShown: true, title: '차단 목록', headerBackTitle: '뒤로가기' }}
        />

        <Stack.Screen
          name="DesignPreview"
          component={DesignPreviewScreen}
          options={{ headerShown: true, title: '디자인', headerBackTitle: '뒤로가기' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
