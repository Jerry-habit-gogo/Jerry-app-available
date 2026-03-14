import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Button from '../components/Button';
import ScreenContainer from '../components/ScreenContainer';
import { RootStackParamList } from '../navigation/RootNavigator';
import { sendChatMessage, subscribeToChatMessages } from '../services/chatService';
import { ChatMessage } from '../types';
import { useUserStore } from '../store/userStore';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatDetail'>;

const formatMessageTime = (value: string) => {
  const date = new Date(value);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

export default function ChatDetailScreen({ route }: Props) {
  const { chatRoom } = route.params;
  const { user } = useUserStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const otherUser = useMemo(() => {
    const otherUserId = chatRoom.participantIds.find((participantId) => participantId !== user?.id) || '';
    return chatRoom.participants[otherUserId];
  }, [chatRoom.participantIds, chatRoom.participants, user?.id]);

  useEffect(() => {
    const unsubscribe = subscribeToChatMessages(chatRoom.id, setMessages);
    return unsubscribe;
  }, [chatRoom.id]);

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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenContainer>
        <View style={styles.header}>
          <Text style={styles.title}>{otherUser?.displayName || '상대방'}</Text>
          <Text style={styles.subtitle}>{chatRoom.postTitle}</Text>
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messagesList}
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

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="메시지를 입력하세요"
            value={messageText}
            onChangeText={setMessageText}
            multiline
          />
          <View style={styles.sendButton}>
            <Button title={isSending ? '전송 중...' : '전송'} onPress={handleSend} isLoading={isSending} />
          </View>
        </View>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
  },
  subtitle: {
    fontSize: 13,
    color: '#2563EB',
    marginTop: 4,
  },
  messagesList: {
    flexGrow: 1,
    paddingVertical: 12,
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
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  messageBubbleMine: {
    backgroundColor: '#2563EB',
  },
  messageBubbleOther: {
    backgroundColor: '#F3F4F6',
  },
  messageText: {
    fontSize: 15,
    color: '#222',
    lineHeight: 20,
  },
  messageTextMine: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  sendButton: {
    width: 110,
    marginLeft: 8,
  },
});
