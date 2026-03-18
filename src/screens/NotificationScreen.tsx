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
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../components/ScreenContainer';
import { NotificationItem } from '../components/NotificationItem';
import {
  deleteAllNotifications,
  deleteNotification,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToNotifications,
} from '../services/notificationService';
import { fetchPostById } from '../services/boardService';
import { fetchChatRoomById } from '../services/chatService';
import { useUserStore } from '../store/userStore';
import { AppNotification } from '../types';
import { RootStackParamList } from '../navigation/RootNavigator';
import { color, radius, typography } from '../theme/tokens';

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

  const handleDeleteNotification = (notification: AppNotification) => {
    if (!user) return;

    Alert.alert('알림 삭제', '이 알림을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          deleteNotification(user.id, notification.id).catch(() => {
            Alert.alert('오류', '알림 삭제에 실패했습니다.');
          });
        },
      },
    ]);
  };

  const handleDeleteAll = () => {
    if (!user || notifications.length === 0) return;

    Alert.alert('전체 삭제', '모든 알림을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          deleteAllNotifications(user.id).catch(() => {
            Alert.alert('오류', '알림 전체 삭제에 실패했습니다.');
          });
        },
      },
    ]);
  };

  if (!user) {
    return (
      <ScreenContainer>
        <Text style={styles.pageTitle}>알림</Text>
        <View style={styles.emptyState}>
          <Ionicons name="notifications-outline" size={52} color={color.text.tertiary} style={styles.emptyIcon} />
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
        <View style={styles.headerActions}>
          {notifications.length > 0 && (
            <TouchableOpacity onPress={handleDeleteAll} style={styles.secondaryAction}>
              <Text style={styles.secondaryActionText}>전체 삭제</Text>
            </TouchableOpacity>
          )}
          {unreadCount > 0 && (
            <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllButton}>
              <Text style={styles.markAllText}>모두 읽음</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={color.brand.green} style={styles.loader} />
      ) : sections.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-outline" size={52} color={color.text.tertiary} style={styles.emptyIcon} />
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
            <NotificationItem
              notification={item}
              onPress={handleNotificationPress}
              onDelete={handleDeleteNotification}
            />
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pageTitle: {
    fontSize: typography.size.screenTitle,
    fontWeight: typography.weight.bold,
    color: color.text.primary,
  },
  secondaryAction: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.xs,
    backgroundColor: color.bg.subtle,
  },
  secondaryActionText: {
    fontSize: typography.size.bodySmall,
    color: color.text.secondary,
    fontWeight: typography.weight.medium,
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.xs,
    backgroundColor: color.brand.greenLight,
  },
  markAllText: {
    fontSize: typography.size.bodySmall,
    color: color.brand.green,
    fontWeight: typography.weight.semiBold,
  },
  loader: {
    marginTop: 60,
  },
  listContent: {
    paddingBottom: 32,
  },
  sectionHeader: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.semiBold,
    color: color.text.tertiary,
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
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: typography.size.sectionTitle,
    fontWeight: typography.weight.semiBold,
    color: color.text.secondary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: typography.size.bodySmall,
    color: color.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
