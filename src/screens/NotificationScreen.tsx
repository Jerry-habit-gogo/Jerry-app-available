import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SectionList,
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
import { fetchChatRoomById } from '../services/chatService';
import { useUserStore } from '../store/userStore';
import { AppNotification } from '../types';
import { RootStackParamList } from '../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Group notifications into sections by relative date
const groupByDate = (
  notifications: AppNotification[]
): { title: string; data: AppNotification[] }[] => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfWeek = startOfToday - (now.getDay() || 7) * 86400000 + 86400000; // Mon

  const today: AppNotification[] = [];
  const thisWeek: AppNotification[] = [];
  const earlier: AppNotification[] = [];

  for (const n of notifications) {
    const t = new Date(n.createdAt).getTime();
    if (t >= startOfToday) {
      today.push(n);
    } else if (t >= startOfWeek) {
      thisWeek.push(n);
    } else {
      earlier.push(n);
    }
  }

  const sections: { title: string; data: AppNotification[] }[] = [];
  if (today.length > 0) sections.push({ title: '오늘', data: today });
  if (thisWeek.length > 0) sections.push({ title: '이번 주', data: thisWeek });
  if (earlier.length > 0) sections.push({ title: '이전', data: earlier });
  return sections;
};

export default function NotificationScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user, blockedUserIds } = useUserStore();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToNotifications(user.id, (items) => {
      const filtered =
        blockedUserIds.length > 0
          ? items.filter((n) => !n.data.actorId || !blockedUserIds.includes(n.data.actorId))
          : items;
      setNotifications(filtered);
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
        if (type === 'chat_message' && data.chatRoomId) {
          const chatRoom = await fetchChatRoomById(data.chatRoomId);
          if (chatRoom) {
            navigation.navigate('ChatDetail', { chatRoom });
          } else {
            navigation.navigate('Chat');
          }
        } else if (type === 'chat_message') {
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
          <Text style={styles.emptyTitle}>로그인이 필요합니다</Text>
          <Text style={styles.emptySubtitle}>로그인 후 알림을 확인할 수 있습니다.</Text>
        </View>
      </ScreenContainer>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;
  const sections = useMemo(() => groupByDate(notifications), [notifications]);

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
        <ActivityIndicator size="large" color="#2563EB" style={styles.loader} />
      ) : sections.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyTitle}>새 알림이 없습니다</Text>
          <Text style={styles.emptySubtitle}>새 메시지, 댓글, 좋아요가 오면 여기서 확인하세요.</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <NotificationItem notification={item} onPress={handleNotificationPress} />
          )}
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
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
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
    paddingBottom: 32,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 8,
    marginLeft: 2,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 100,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 52,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});
