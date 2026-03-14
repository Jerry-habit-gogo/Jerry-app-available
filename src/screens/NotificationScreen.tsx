import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ScreenContainer from '../components/ScreenContainer';
import { NotificationItem } from '../components/NotificationItem';
import {
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToNotifications,
} from '../services/notificationService';
import { fetchPostById } from '../services/boardService';
import { useUserStore } from '../store/userStore';
import { AppNotification } from '../types';
import { RootStackParamList } from '../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function NotificationScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useUserStore();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToNotifications(user.id, (items) => {
      setNotifications(items);
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  const handleNotificationPress = useCallback(
    async (notification: AppNotification) => {
      if (!user) return;

      if (!notification.read) {
        markNotificationRead(user.id, notification.id).catch(() => {});
      }

      const { type, data } = notification;

      try {
        if (type === 'chat_message') {
          navigation.navigate('Chat');
        } else if ((type === 'comment' || type === 'like') && data.postId) {
          const post = await fetchPostById(data.postId);
          if (post) {
            navigation.navigate('PostDetail', { post });
          } else {
            Alert.alert('알림', '게시글을 찾을 수 없습니다.');
          }
        } else if (type === 'announcement') {
          navigation.navigate('Announcements');
        }
      } catch {
        Alert.alert('오류', '페이지 이동에 실패했습니다.');
      }
    },
    [navigation, user]
  );

  const handleMarkAllRead = () => {
    if (!user) return;
    markAllNotificationsRead(user.id).catch(() => {});
  };

  if (!user) {
    return (
      <ScreenContainer>
        <Text style={styles.pageTitle}>알림</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyText}>로그인 후 알림을 확인할 수 있습니다.</Text>
        </View>
      </ScreenContainer>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>알림</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllButton}>
            <Text style={styles.markAllText}>모두 읽음</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={styles.loader} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <NotificationItem notification={item} onPress={handleNotificationPress} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyText}>새 알림이 없습니다.</Text>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  markAllText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '600',
  },
  loader: {
    marginTop: 60,
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
});
