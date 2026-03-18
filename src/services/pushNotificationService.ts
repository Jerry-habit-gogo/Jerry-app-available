import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebase';

const PUSH_TOKENS_COLLECTION = 'pushTokens';
const isExpoGo = Constants.executionEnvironment === 'storeClient';

/**
 * Request push permission, get the Expo push token, and persist it to Firestore.
 * Call this once after the user signs in.
 */
export const registerPushToken = async (): Promise<void> => {
  if (!isFirebaseConfigured || !auth.currentUser || isExpoGo) return;

  const Notifications = await import('expo-notifications');

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return;

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    await setDoc(
      doc(db, PUSH_TOKENS_COLLECTION, auth.currentUser.uid),
      { token: tokenData.data, updatedAt: serverTimestamp() },
      { merge: true }
    );
  } catch {
    // Not available on simulators or when EAS projectId is missing — fail silently
  }
};

/**
 * Send an Expo push notification to another user via their stored token.
 * Fire-and-forget; never throws.
 */
export const sendPushToUser = async (
  recipientId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> => {
  if (!isFirebaseConfigured || !auth.currentUser) return;
  if (recipientId === auth.currentUser.uid) return;

  try {
    const snap = await getDoc(doc(db, PUSH_TOKENS_COLLECTION, recipientId));
    if (!snap.exists()) return;

    const token = snap.data().token as string | undefined;
    if (!token?.startsWith('ExponentPushToken')) return;

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: token, title, body, data: data ?? {}, sound: 'default' }),
    });
  } catch {
    // Push is best-effort
  }
};
