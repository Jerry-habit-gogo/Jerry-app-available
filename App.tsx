import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { subscribeToAuthState } from './src/services/authService';
import { fetchBlockedUserIds } from './src/services/moderationService';
import { subscribeToUnreadCount } from './src/services/notificationService';
import { useUserStore } from './src/store/userStore';

function AuthBootstrap() {
  const {
    isLoading,
    setLoading,
    setUser,
    setAuthError,
    setBlockedUserIds,
    setUnreadNotificationCount,
  } = useUserStore();

  useEffect(() => {
    let unsubscribeNotifications: (() => void) | null = null;

    const unsubscribeAuth = subscribeToAuthState(async (user) => {
      setUser(user);
      setLoading(false);
      setAuthError(null);

      unsubscribeNotifications?.();
      unsubscribeNotifications = null;

      if (user) {
        fetchBlockedUserIds().then(setBlockedUserIds).catch(() => {});
        unsubscribeNotifications = subscribeToUnreadCount(user.id, setUnreadNotificationCount);
      } else {
        setBlockedUserIds([]);
        setUnreadNotificationCount(0);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeNotifications?.();
    };
  }, [setAuthError, setBlockedUserIds, setLoading, setUnreadNotificationCount, setUser]);

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
