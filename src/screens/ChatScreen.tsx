import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ScreenContainer from '../components/ScreenContainer';
import { RootStackParamList } from '../navigation/RootNavigator';
import { subscribeToUserChats } from '../services/chatService';
import { ChatRoom } from '../types';
import { useUserStore } from '../store/userStore';
import Button from '../components/Button';
import { color, radius, typography, shadow } from '../theme/tokens';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const formatUpdatedAt = (updatedAt: string) => {
  const date = new Date(updatedAt);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return '방금 전';
  if (diffInMinutes < 60) return `${diffInMinutes}분 전`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}시간 전`;

  return `${date.getMonth() + 1}/${date.getDate()}`;
};

export default function ChatScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user, blockedUserIds, setUnreadChatCount } = useUserStore();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);

  useEffect(() => {
    if (!user) {
      setRooms([]);
      return;
    }

    const unsubscribe = subscribeToUserChats(user.id, (allRooms) => {
      const visible = blockedUserIds.length > 0
        ? allRooms.filter((room) =>
            room.participantIds.every((id) => id === user.id || !blockedUserIds.includes(id))
          )
        : allRooms;
      setRooms(visible);
      const total = visible.reduce((sum, room) => sum + (room.unreadCounts?.[user.id] ?? 0), 0);
      setUnreadChatCount(total);
    });
    return unsubscribe;
  }, [user, blockedUserIds]);

  if (!user) {
    return (
      <ScreenContainer>
        <Text style={styles.title}>채팅</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>로그인 후 대화를 시작할 수 있습니다.</Text>
          <Button title="로그인 / 회원가입" onPress={() => navigation.navigate('Auth')} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>채팅</Text>
      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const otherUser = item.participants[item.participantIds.find((participantId) => participantId !== user.id) || ''];

          const unreadCount = item.unreadCounts?.[user.id] ?? 0;

          return (
            <TouchableOpacity
              style={styles.chatCard}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('ChatDetail', { chatRoom: item })}
            >
              {otherUser?.photoUrl ? (
                <Image source={{ uri: otherUser.photoUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>
                    {(otherUser?.displayName || 'J').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}

              <View style={styles.chatMeta}>
                <View style={styles.chatHeader}>
                  <Text style={[styles.chatTitle, unreadCount > 0 && styles.chatTitleUnread]}>
                    {otherUser?.displayName || '상대방'}
                  </Text>
                  <View style={styles.chatHeaderRight}>
                    {unreadCount > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.chatDate}>{formatUpdatedAt(item.updatedAt)}</Text>
                  </View>
                </View>
                <Text style={styles.postTitle} numberOfLines={1}>
                  {item.postTitle}
                </Text>
                <Text style={[styles.lastMessage, unreadCount > 0 && styles.lastMessageUnread]} numberOfLines={1}>
                  {item.lastMessage || '아직 메시지가 없습니다.'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>아직 대화가 없습니다.</Text>
            <Text style={styles.emptySubtitle}>게시글 상세 화면에서 채팅을 시작해보세요.</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: typography.size.screenTitle,
    fontWeight: typography.weight.bold,
    color: color.text.primary,
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 24,
  },
  chatCard: {
    flexDirection: 'row',
    backgroundColor: color.bg.surface,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
    ...shadow.soft,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: color.line.default,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.brand.green,
  },
  avatarText: {
    color: color.text.inverse,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.sectionTitle,
  },
  chatMeta: {
    flex: 1,
    marginLeft: 12,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chatTitle: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.bold,
    color: color.text.primary,
  },
  chatTitleUnread: {
    color: color.brand.green,
  },
  chatDate: {
    fontSize: typography.size.caption,
    color: color.text.tertiary,
  },
  unreadBadge: {
    backgroundColor: color.state.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadBadgeText: {
    fontSize: typography.size.micro,
    fontWeight: typography.weight.bold,
    color: color.text.inverse,
  },
  postTitle: {
    fontSize: typography.size.bodySmall,
    color: color.brand.green,
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: typography.size.bodySmall,
    color: color.text.secondary,
  },
  lastMessageUnread: {
    fontWeight: typography.weight.semiBold,
    color: color.text.primary,
  },
  emptyState: {
    backgroundColor: color.bg.surface,
    borderRadius: radius.lg,
    padding: 20,
    alignItems: 'center',
    marginTop: 12,
  },
  emptyTitle: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semiBold,
    color: color.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: typography.size.bodySmall,
    color: color.text.secondary,
    textAlign: 'center',
  },
});
