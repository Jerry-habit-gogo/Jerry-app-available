import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { sendPushToUser } from './pushNotificationService';
import { AppNotification, NotificationData, NotificationType } from '../types';
import { isPermissionDeniedError } from './firestoreError';

const NOTIFICATIONS_ROOT = 'notifications';

const itemsRef = (userId: string) =>
  collection(db, NOTIFICATIONS_ROOT, userId, 'items');

const mapNotification = (id: string, data: Record<string, any>): AppNotification => ({
  id,
  type: data.type,
  title: data.title,
  body: data.body,
  read: data.read ?? false,
  createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
  data: data.data ?? {},
});

/**
 * Create a notification for a specific user (fire-and-forget safe).
 * Called client-side; will be migrated to Cloud Functions in production.
 */
export const createNotification = async (
  recipientId: string,
  type: NotificationType,
  title: string,
  body: string,
  data: NotificationData = {}
): Promise<void> => {
  if (!isFirebaseConfigured) return;

  await addDoc(itemsRef(recipientId), {
    type,
    title,
    body,
    read: false,
    createdAt: serverTimestamp(),
    data,
  });

  // Fire push in parallel (best-effort)
  sendPushToUser(recipientId, title, body, data as Record<string, unknown>).catch(() => {});
};

/**
 * Real-time subscription to a user's notifications (latest 50, newest first).
 * Returns an unsubscribe function.
 */
export const subscribeToNotifications = (
  userId: string,
  callback: (notifications: AppNotification[]) => void
): (() => void) => {
  if (!isFirebaseConfigured) {
    callback([]);
    return () => {};
  }

  const q = query(itemsRef(userId), orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.docs.map((d) => mapNotification(d.id, d.data())));
    },
    (error) => {
      if (isPermissionDeniedError(error)) {
        console.warn('Notifications subscription denied by Firestore rules.');
      } else {
        console.error('Notifications subscription failed', error);
      }
      callback([]);
    }
  );
};

/**
 * Real-time subscription to unread notification count.
 * Returns an unsubscribe function.
 */
export const subscribeToUnreadCount = (
  userId: string,
  callback: (count: number) => void
): (() => void) => {
  if (!isFirebaseConfigured) {
    callback(0);
    return () => {};
  }

  const q = query(itemsRef(userId), where('read', '==', false));
  return onSnapshot(
    q,
    (snapshot) => callback(snapshot.size),
    (error) => {
      if (isPermissionDeniedError(error)) {
        console.warn('Unread notifications subscription denied by Firestore rules.');
      } else {
        console.error('Unread notifications subscription failed', error);
      }
      callback(0);
    }
  );
};

/**
 * Mark a single notification as read.
 */
export const markNotificationRead = async (
  userId: string,
  notificationId: string
): Promise<void> => {
  if (!isFirebaseConfigured) return;

  await updateDoc(doc(db, NOTIFICATIONS_ROOT, userId, 'items', notificationId), {
    read: true,
  });
};

/**
 * Mark all unread notifications as read for a user (batched write).
 */
export const markAllNotificationsRead = async (userId: string): Promise<void> => {
  if (!isFirebaseConfigured) return;

  const q = query(itemsRef(userId), where('read', '==', false));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return;

  const batch = writeBatch(db);
  snapshot.docs.forEach((d) => batch.update(d.ref, { read: true }));
  await batch.commit();
};
