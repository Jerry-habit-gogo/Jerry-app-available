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
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 24,
  },
  chatCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E5E7EB',
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 20,
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
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  chatTitleUnread: {
    color: '#1D4ED8',
  },
  chatDate: {
    fontSize: 12,
    color: '#888',
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  postTitle: {
    fontSize: 13,
    color: '#2563EB',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#555',
  },
  lastMessageUnread: {
    fontWeight: '600',
    color: '#111',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginTop: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
