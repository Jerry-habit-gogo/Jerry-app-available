import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebase';
import { ChatMessage, ChatParticipant, ChatRoom, Post } from '../types';
import { createNotification } from './notificationService';

const CHATS_COLLECTION = 'chats';
const MESSAGES_COLLECTION = 'messages';

const ensureConfigured = () => {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase is not configured.');
  }
};

const requireCurrentUser = () => {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error('Authentication required.');
  }

  return currentUser;
};

const mapChatRoom = (id: string, data: Record<string, any>): ChatRoom => ({
  id,
  postId: data.postId,
  postTitle: data.postTitle,
  participantIds: data.participantIds || [],
  participants: data.participants || {},
  lastMessage: data.lastMessage || '',
  lastMessageSenderId: data.lastMessageSenderId,
  updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
  createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
});

const mapChatMessage = (chatId: string, id: string, data: Record<string, any>): ChatMessage => ({
  id,
  chatId,
  senderId: data.senderId,
  text: data.text || '',
  createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
});

const buildChatId = (postId: string, participantIds: string[]) =>
  [postId, ...participantIds.sort()].join('__');

export const createOrOpenChatForPost = async (post: Post) => {
  ensureConfigured();
  const currentUser = requireCurrentUser();

  if (currentUser.uid === post.authorId) {
    throw new Error('Cannot create a chat with your own post.');
  }

  const chatId = buildChatId(post.id, [currentUser.uid, post.authorId]);
  const chatRef = doc(db, CHATS_COLLECTION, chatId);
  const snapshot = await getDoc(chatRef);

  if (!snapshot.exists()) {
    const currentParticipant: ChatParticipant = {
      id: currentUser.uid,
      displayName: currentUser.displayName,
      photoUrl: currentUser.photoURL,
    };
    const otherParticipant: ChatParticipant = {
      id: post.authorId,
      displayName: post.authorName,
      photoUrl: post.authorAvatar || null,
    };

    await setDoc(chatRef, {
      postId: post.id,
      postTitle: post.title,
      participantIds: [currentUser.uid, post.authorId],
      participants: {
        [currentUser.uid]: currentParticipant,
        [post.authorId]: otherParticipant,
      },
      lastMessage: '',
      lastMessageSenderId: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  const chatSnapshot = await getDoc(chatRef);
  return mapChatRoom(chatSnapshot.id, chatSnapshot.data() as Record<string, any>);
};

export const subscribeToUserChats = (
  userId: string,
  callback: (rooms: ChatRoom[]) => void
) => {
  ensureConfigured();

  const chatsQuery = query(
    collection(db, CHATS_COLLECTION),
    where('participantIds', 'array-contains', userId)
  );

  return onSnapshot(chatsQuery, (snapshot) => {
    const rooms = snapshot.docs
      .map((chatDoc) => mapChatRoom(chatDoc.id, chatDoc.data()))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    callback(rooms);
  });
};

export const subscribeToChatMessages = (
  chatId: string,
  callback: (messages: ChatMessage[]) => void
) => {
  ensureConfigured();

  const messagesQuery = query(
    collection(db, CHATS_COLLECTION, chatId, MESSAGES_COLLECTION),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(messagesQuery, (snapshot) => {
    callback(
      snapshot.docs.map((messageDoc) => mapChatMessage(chatId, messageDoc.id, messageDoc.data()))
    );
  });
};

export const sendChatMessage = async (
  chatId: string,
  text: string,
  context?: { recipientId: string; senderName: string; postTitle: string }
) => {
  ensureConfigured();
  const currentUser = requireCurrentUser();
  const trimmedText = text.trim();

  if (!trimmedText) {
    throw new Error('Message text is empty.');
  }

  const chatRef = doc(db, CHATS_COLLECTION, chatId);
  const messagesRef = collection(db, CHATS_COLLECTION, chatId, MESSAGES_COLLECTION);

  await addDoc(messagesRef, {
    senderId: currentUser.uid,
    text: trimmedText,
    createdAt: serverTimestamp(),
  });

  await updateDoc(chatRef, {
    lastMessage: trimmedText,
    lastMessageSenderId: currentUser.uid,
    updatedAt: serverTimestamp(),
  });

  // Notify the other participant (fire-and-forget)
  if (context && context.recipientId !== currentUser.uid) {
    createNotification(
      context.recipientId,
      'chat_message',
      `${context.senderName}님의 메시지`,
      `"${context.postTitle}" — ${trimmedText.slice(0, 60)}`,
      { chatRoomId: chatId, actorId: currentUser.uid, actorName: context.senderName, postTitle: context.postTitle }
    ).catch(() => {});
  }
};
