import Constants from 'expo-constants';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { navigationRef } from './src/navigation/RootNavigator';
import RootNavigator from './src/navigation/RootNavigator';
import { subscribeToAuthState } from './src/services/authService';
import { fetchPostById } from './src/services/boardService';
import { subscribeToUnreadChatCount } from './src/services/chatService';
import { fetchBlockedUserIds } from './src/services/moderationService';
import { subscribeToUnreadCount } from './src/services/notificationService';
import { registerPushToken } from './src/services/pushNotificationService';
import { useUserStore } from './src/store/userStore';

const isExpoGo = Constants.executionEnvironment === 'storeClient';

function AuthBootstrap() {
  const {
    isLoading,
    setLoading,
    setUser,
    setAuthError,
    setBlockedUserIds,
    setUnreadNotificationCount,
    setUnreadChatCount,
  } = useUserStore();

  // Auth + per-user subscriptions
  useEffect(() => {
    let unsubNotifications: (() => void) | null = null;
    let unsubChats: (() => void) | null = null;

    const unsubAuth = subscribeToAuthState(async (user) => {
      setUser(user);
      setLoading(false);
      setAuthError(null);

      unsubNotifications?.();
      unsubChats?.();
      unsubNotifications = null;
      unsubChats = null;

      if (user) {
        fetchBlockedUserIds().then(setBlockedUserIds).catch(() => {});
        unsubNotifications = subscribeToUnreadCount(user.id, setUnreadNotificationCount);
        unsubChats = subscribeToUnreadChatCount(user.id, setUnreadChatCount);
        if (!isExpoGo) {
          registerPushToken().catch(() => {});
        }
      } else {
        setBlockedUserIds([]);
        setUnreadNotificationCount(0);
        setUnreadChatCount(0);
      }
    });

    return () => {
      unsubAuth();
      unsubNotifications?.();
      unsubChats?.();
    };
  }, [setAuthError, setBlockedUserIds, setLoading, setUnreadChatCount, setUnreadNotificationCount, setUser]);

  // Deep-link handler: navigate when user taps a push notification
  useEffect(() => {
    if (isExpoGo) {
      return;
    }

    let isActive = true;
    let removeSubscription: (() => void) | null = null;

    void (async () => {
      const Notifications = await import('expo-notifications');

      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      if (!isActive) return;

      const subscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
        if (!navigationRef.isReady()) return;

        const data = response.notification.request.content.data as Record<string, unknown>;
        const type = data.type as string | undefined;

        if (type === 'chat_message') {
          navigationRef.navigate('Chat');
        } else if ((type === 'comment' || type === 'like') && data.postId) {
          try {
            const post = await fetchPostById(data.postId as string);
            if (post) {
              navigationRef.navigate('PostDetail', { post });
            }
          } catch {
            // Fallback: user can check notifications tab
          }
        } else if (type === 'announcement') {
          navigationRef.navigate('Announcements');
        }
      });

      removeSubscription = () => subscription.remove();
    })();

    return () => {
      isActive = false;
      removeSubscription?.();
    };
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return <RootNavigator />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthBootstrap />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
});
