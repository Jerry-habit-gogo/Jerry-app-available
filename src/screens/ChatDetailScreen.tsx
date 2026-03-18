import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../components/Button';
import { RootStackParamList } from '../navigation/RootNavigator';
import { leaveChatRoom, sendChatMessage, subscribeToChatMessages, resetUnreadCount } from '../services/chatService';
import { ChatMessage } from '../types';
import { useUserStore } from '../store/userStore';
import { color, radius, typography } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatDetail'>;

const formatMessageTime = (value: string) => {
  const date = new Date(value);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

export default function ChatDetailScreen({ route, navigation }: Props) {
  const { chatRoom } = route.params;
  const { user } = useUserStore();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const otherUser = useMemo(() => {
    const otherUserId = chatRoom.participantIds.find((participantId) => participantId !== user?.id) || '';
    return chatRoom.participants[otherUserId];
  }, [chatRoom.participantIds, chatRoom.participants, user?.id]);

  useEffect(() => {
    const unsubscribe = subscribeToChatMessages(chatRoom.id, setMessages);
    return unsubscribe;
  }, [chatRoom.id]);

  useEffect(() => {
    if (user?.id) {
      resetUnreadCount(chatRoom.id, user.id);
    }
  }, [chatRoom.id, user?.id]);

  const handleLeaveChat = useCallback(() => {
    if (!user?.id || isLeaving) return;

    Alert.alert('채팅방 나가기', '이 채팅방에서 나가시겠습니까? 나가면 목록에서 사라집니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '나가기',
        style: 'destructive',
        onPress: async () => {
          setIsLeaving(true);
          try {
            await leaveChatRoom(chatRoom.id, user.id);
            navigation.goBack();
          } catch (error) {
            console.error('Failed to leave chat room', error);
            Alert.alert('오류', '채팅방 나가기에 실패했습니다.');
          } finally {
            setIsLeaving(false);
          }
        },
      },
    ]);
  }, [chatRoom.id, isLeaving, navigation, user?.id]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleLeaveChat} disabled={isLeaving} style={styles.leaveButton}>
          <Text style={styles.leaveButtonText}>{isLeaving ? '처리 중' : '나가기'}</Text>
        </TouchableOpacity>
      ),
    });
  }, [handleLeaveChat, isLeaving, navigation]);

  const handleSend = async () => {
    if (!messageText.trim() || isSending) {
      return;
    }

    setIsSending(true);
    try {
      await sendChatMessage(chatRoom.id, messageText, {
        recipientId: otherUser?.id || '',
        senderName: user?.displayName || '알 수 없음',
        postTitle: chatRoom.postTitle,
      });
      setMessageText('');
    } catch (error) {
      console.error('Failed to send message', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
    >
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <Text style={styles.title}>{otherUser?.displayName || '상대방'}</Text>
        <Text style={styles.subtitle}>{chatRoom.postTitle}</Text>
      </View>

      {/* 메시지 목록 */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        style={styles.messagesListView}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        renderItem={({ item }) => {
          const isMine = item.senderId === user?.id;
          return (
            <View style={[styles.messageRow, isMine && styles.messageRowMine]}>
              <View style={[styles.messageBubble, isMine ? styles.messageBubbleMine : styles.messageBubbleOther]}>
                <Text style={[styles.messageText, isMine && styles.messageTextMine]}>{item.text}</Text>
              </View>
              <Text style={styles.messageTime}>{formatMessageTime(item.createdAt)}</Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>첫 메시지를 보내 대화를 시작해보세요.</Text>
          </View>
        }
      />

      {/* 입력 바 — FlatList와 형제 요소로 분리 */}
      <View style={[styles.inputRow, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 8 : 12) }]}>
        <TextInput
          style={styles.input}
          placeholder="메시지를 입력하세요"
          placeholderTextColor={color.text.placeholder}
          value={messageText}
          onChangeText={setMessageText}
          multiline
          textAlignVertical="top"
        />
        <View style={styles.sendButton}>
          <Button title={isSending ? '전송 중...' : '전송'} onPress={handleSend} isLoading={isSending} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: color.bg.subtle,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: color.bg.surface,
    borderBottomWidth: 1,
    borderBottomColor: color.line.default,
  },
  title: {
    fontSize: typography.size.sectionTitle,
    fontWeight: typography.weight.bold,
    color: color.text.primary,
  },
  subtitle: {
    fontSize: typography.size.bodySmall,
    color: color.brand.green,
    marginTop: 4,
  },
  messagesListView: {
    flex: 1,
  },
  messagesList: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'flex-end',
  },
  messageRow: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  messageRowMine: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  messageBubbleMine: {
    backgroundColor: color.brand.green,
  },
  messageBubbleOther: {
    backgroundColor: color.bg.surface,
  },
  messageText: {
    fontSize: typography.size.body,
    color: color.text.primary,
    lineHeight: 20,
  },
  messageTextMine: {
    color: color.text.inverse,
  },
  messageTime: {
    fontSize: typography.size.micro,
    color: color.text.tertiary,
    marginTop: 4,
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.size.bodySmall,
    color: color.text.secondary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: color.line.default,
    backgroundColor: color.bg.surface,
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: color.line.default,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: typography.size.body,
    color: color.text.primary,
    backgroundColor: color.bg.subtle,
  },
  sendButton: {
    width: 80,
    marginLeft: 8,
    justifyContent: 'center',
  },
  leaveButton: {
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  leaveButtonText: {
    fontSize: typography.size.bodySmall,
    color: color.state.error,
    fontWeight: typography.weight.semiBold,
  },
});
