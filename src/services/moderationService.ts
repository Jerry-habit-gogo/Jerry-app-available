import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebase';
import { Block, ReportReason } from '../types';

const REPORTS_COLLECTION = 'reports';
const BLOCKS_COLLECTION = 'blocks';

const requireAuth = () => {
  const user = auth.currentUser;
  if (!user) throw new Error('Authentication required.');
  return user;
};

const requireFirebase = () => {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured.');
};

// Block document ID is deterministic: blockerId_blockedId
const buildBlockId = (blockerId: string, blockedId: string) =>
  `${blockerId}_${blockedId}`;

/**
 * Submit a report for a post, user, or comment.
 * postId is optional context (e.g., the post that contains a reported comment).
 */
export const reportContent = async (
  targetType: 'post' | 'user' | 'comment',
  targetId: string,
  reason: ReportReason,
  description?: string,
  postId?: string
): Promise<void> => {
  requireFirebase();
  const user = requireAuth();

  await addDoc(collection(db, REPORTS_COLLECTION), {
    reporterId: user.uid,
    targetType,
    targetId,
    postId: postId ?? null,
    reason,
    description: description?.trim() || null,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
};

/**
 * Block a user. Creates a deterministic block document.
 * Pass displayInfo to store the user's name/avatar at block time (shown in blocked list).
 * Idempotent — safe to call multiple times.
 */
export const blockUser = async (
  blockedId: string,
  displayInfo?: { displayName?: string | null; photoUrl?: string | null }
): Promise<void> => {
  requireFirebase();
  const user = requireAuth();
  if (user.uid === blockedId) throw new Error('Cannot block yourself.');

  const blockId = buildBlockId(user.uid, blockedId);
  await setDoc(doc(db, BLOCKS_COLLECTION, blockId), {
    blockerId: user.uid,
    blockedId,
    blockedDisplayName: displayInfo?.displayName ?? null,
    blockedPhotoUrl: displayInfo?.photoUrl ?? null,
    createdAt: serverTimestamp(),
  });
};

/**
 * Unblock a previously blocked user.
 */
export const unblockUser = async (blockedId: string): Promise<void> => {
  requireFirebase();
  const user = requireAuth();

  const blockId = buildBlockId(user.uid, blockedId);
  await deleteDoc(doc(db, BLOCKS_COLLECTION, blockId));
};

/**
 * Returns an array of user IDs that the current user has blocked.
 */
export const fetchBlockedUserIds = async (): Promise<string[]> => {
  if (!isFirebaseConfigured || !auth.currentUser) return [];

  const q = query(
    collection(db, BLOCKS_COLLECTION),
    where('blockerId', '==', auth.currentUser.uid)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data().blockedId as string);
};

/**
 * Check whether the current user has blocked a specific user.
 */
export const isUserBlocked = async (targetId: string): Promise<boolean> => {
  if (!isFirebaseConfigured || !auth.currentUser) return false;

  const blockId = buildBlockId(auth.currentUser.uid, targetId);
  const snapshot = await getDoc(doc(db, BLOCKS_COLLECTION, blockId));
  return snapshot.exists();
};

/**
 * Returns full Block objects (with stored display info) for all users blocked by current user.
 */
export const fetchBlockedUsers = async (): Promise<Block[]> => {
  if (!isFirebaseConfigured || !auth.currentUser) return [];

  const q = query(
    collection(db, BLOCKS_COLLECTION),
    where('blockerId', '==', auth.currentUser.uid)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      blockerId: data.blockerId,
      blockedId: data.blockedId,
      blockedDisplayName: data.blockedDisplayName ?? null,
      blockedPhotoUrl: data.blockedPhotoUrl ?? null,
      createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
    } as Block;
  });
};
