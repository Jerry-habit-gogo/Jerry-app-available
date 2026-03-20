import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ScreenContainer from '../components/ScreenContainer';
import { RootStackParamList } from '../navigation/RootNavigator';
import { leaveChatRoom, subscribeToUserChats } from '../services/chatService';
import { ChatRoom } from '../types';
import { useUserStore } from '../store/userStore';
import Button from '../components/Button';
import { color, radius, typography, shadow } from '../theme/tokens';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
const SWIPE_ACTION_WIDTH = 92;

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

interface ChatListItemProps {
  room: ChatRoom;
  userId: string;
  isLeaving: boolean;
  onEnter: (room: ChatRoom) => void;
  onLeave: (room: ChatRoom) => void;
}

function ChatListItem({ room, userId, isLeaving, onEnter, onLeave }: ChatListItemProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const offsetX = useRef(0);
  const isOpen = useRef(false);

  useEffect(() => {
    const listener = translateX.addListener(({ value }) => {
      offsetX.current = value;
      isOpen.current = value < -8;
    });

    return () => {
      translateX.removeListener(listener);
    };
  }, [translateX]);

  const animateTo = useCallback((value: number) => {
    Animated.spring(translateX, {
      toValue: value,
      useNativeDriver: true,
      damping: 18,
      stiffness: 260,
      mass: 0.9,
    }).start();
  }, [translateX]);

  const closeSwipe = useCallback(() => {
    animateTo(0);
  }, [animateTo]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 8 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
        onPanResponderGrant: () => {
          translateX.stopAnimation((value) => {
            offsetX.current = value;
          });
        },
        onPanResponderMove: (_, gestureState) => {
          const nextX = Math.max(-SWIPE_ACTION_WIDTH, Math.min(0, offsetX.current + gestureState.dx));
          translateX.setValue(nextX);
        },
        onPanResponderRelease: (_, gestureState) => {
          const shouldOpen =
            gestureState.dx < -SWIPE_ACTION_WIDTH * 0.4 || gestureState.vx < -0.5;
          animateTo(shouldOpen ? -SWIPE_ACTION_WIDTH : 0);
        },
        onPanResponderTerminate: () => {
          animateTo(isOpen.current ? -SWIPE_ACTION_WIDTH : 0);
        },
      }),
    [animateTo, translateX]
  );

  const otherUser =
    room.participants[room.participantIds.find((participantId) => participantId !== userId) || ''];
  const unreadCount = room.unreadCounts?.[userId] ?? 0;

  const handlePressCard = () => {
    if (isOpen.current) {
      closeSwipe();
      return;
    }
    onEnter(room);
  };

  return (
    <View style={styles.swipeRow}>
      <View style={styles.swipeActionArea}>
        <TouchableOpacity
          style={styles.leaveActionButton}
          activeOpacity={0.85}
          onPress={() => onLeave(room)}
          disabled={isLeaving}
        >
          <Text style={styles.leaveActionText}>{isLeaving ? '처리 중' : '나가기'}</Text>
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.swipeCardWrap, { transform: [{ translateX }] }]} {...panResponder.panHandlers}>
        <TouchableOpacity style={styles.chatCard} activeOpacity={0.85} onPress={handlePressCard}>
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
                <Text style={styles.chatDate}>{formatUpdatedAt(room.updatedAt)}</Text>
              </View>
            </View>
            <Text style={styles.postTitle} numberOfLines={1}>
              {room.postTitle}
            </Text>
            <Text style={[styles.lastMessage, unreadCount > 0 && styles.lastMessageUnread]} numberOfLines={1}>
              {room.lastMessage || '아직 메시지가 없습니다.'}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

export default function ChatScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user, blockedUserIds, setUnreadChatCount } = useUserStore();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [leavingRoomId, setLeavingRoomId] = useState<string | null>(null);

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

  const handleLeaveFromList = useCallback((room: ChatRoom) => {
    if (!user?.id || leavingRoomId) return;

    Alert.alert('채팅방 나가기', '이 채팅방에서 나가시겠습니까? 나가면 목록에서 사라집니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '나가기',
        style: 'destructive',
        onPress: async () => {
          setLeavingRoomId(room.id);
          try {
            await leaveChatRoom(room.id, user.id);
          } catch (error) {
            console.error('Failed to leave chat room from list', error);
            Alert.alert('오류', '채팅방 나가기에 실패했습니다.');
          } finally {
            setLeavingRoomId(null);
          }
        },
      },
    ]);
  }, [leavingRoomId, user?.id]);

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
        renderItem={({ item }) => (
          <ChatListItem
            room={item}
            userId={user.id}
            isLeaving={leavingRoomId === item.id}
            onEnter={(room) => navigation.navigate('ChatDetail', { chatRoom: room })}
            onLeave={handleLeaveFromList}
          />
        )}
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
    ...shadow.soft,
  },
  swipeRow: {
    marginBottom: 12,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  swipeActionArea: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: SWIPE_ACTION_WIDTH,
    backgroundColor: color.state.error,
  },
  leaveActionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  leaveActionText: {
    color: color.text.inverse,
    fontSize: typography.size.bodySmall,
    fontWeight: typography.weight.bold,
  },
  swipeCardWrap: {
    backgroundColor: color.bg.surface,
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
