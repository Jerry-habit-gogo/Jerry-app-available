import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebase';
import { Post, PostStatus } from '../types';
import { isPostDeleted } from '../constants/postStatus';

// --- Firestore paths ---

const savedPostsRef = (userId: string) =>
  collection(db, 'users', userId, 'savedPosts');

const recentlyViewedRef = (userId: string) =>
  collection(db, 'users', userId, 'recentlyViewed');

// --- Types ---

export interface PostSnapshot {
  title: string;
  category: string;
  status: PostStatus;
  price?: number;
  region?: string;
  imageUrl?: string;
}

export interface PostWithMeta {
  postId: string;
  post: Post | null; // null when the post has been deleted
  snapshot: PostSnapshot;
  timestamp: string;
  deleted: boolean;
}

// --- Helpers ---

const toSnapshot = (post: Post): PostSnapshot => ({
  title: post.title,
  category: post.category,
  status: post.status ?? 'active',
  ...(post.price != null && { price: post.price }),
  ...(post.region != null && { region: post.region }),
  ...(post.images?.[0] != null && { imageUrl: post.images[0] }),
});

/**
 * Fetch a post's current data without incrementing its viewCount.
 * Returns null if the document doesn't exist (deleted post).
 */
const fetchPostRaw = async (postId: string): Promise<Post | null> => {
  const snap = await getDoc(doc(db, 'posts', postId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    ...data,
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
  } as Post;
};

const mapEntry = async (
  postId: string,
  data: Record<string, any>,
  timestampField: 'savedAt' | 'viewedAt'
): Promise<PostWithMeta> => {
  const post = await fetchPostRaw(postId).catch(() => null);
  return {
    postId,
    post,
    snapshot: data.postSnapshot as PostSnapshot,
    timestamp: data[timestampField]?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
    deleted: !post || isPostDeleted(post),
  };
};

// --- Saved Posts ---

/**
 * Save or unsave a post.
 * `save = true` → saves; `save = false` → removes the save.
 * A snapshot of the post is stored so deleted posts can still be shown gracefully.
 */
export const toggleSavedPost = async (
  postId: string,
  save: boolean,
  post: Post
): Promise<void> => {
  if (!isFirebaseConfigured) return;
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Authentication required.');

  const ref = doc(savedPostsRef(currentUser.uid), postId);
  if (save) {
    await setDoc(ref, {
      postId,
      savedAt: serverTimestamp(),
      postSnapshot: toSnapshot(post),
    });
  } else {
    await deleteDoc(ref);
  }
};

/**
 * Returns true if the current user has saved the given post.
 */
export const isPostSaved = async (postId: string): Promise<boolean> => {
  if (!isFirebaseConfigured || !auth.currentUser) return false;
  const snap = await getDoc(doc(savedPostsRef(auth.currentUser.uid), postId));
  return snap.exists();
};

/**
 * Fetch all saved posts for a user (newest first, max 50).
 * Deleted posts are returned with `deleted: true` and a cached snapshot.
 */
export const fetchSavedPosts = async (userId: string): Promise<PostWithMeta[]> => {
  if (!isFirebaseConfigured) return [];

  const q = query(savedPostsRef(userId), orderBy('savedAt', 'desc'), limit(50));
  const snapshot = await getDocs(q);

  return Promise.all(
    snapshot.docs.map((d) => mapEntry(d.id, d.data(), 'savedAt'))
  );
};

// --- Recently Viewed ---

/**
 * Record that the current user viewed a post (fire-and-forget, upserts by postId).
 * Called from PostDetailScreen; deliberately does not await to avoid UI delay.
 */
export const trackRecentlyViewed = (post: Post): void => {
  if (!isFirebaseConfigured || !auth.currentUser) return;

  setDoc(doc(recentlyViewedRef(auth.currentUser.uid), post.id), {
    postId: post.id,
    viewedAt: serverTimestamp(),
    postSnapshot: toSnapshot(post),
  }).catch(() => {});
};

/**
 * Fetch the 20 most recently viewed posts for a user.
 * Deleted posts are returned with `deleted: true` and a cached snapshot.
 */
export const fetchRecentlyViewed = async (userId: string): Promise<PostWithMeta[]> => {
  if (!isFirebaseConfigured) return [];

  const q = query(recentlyViewedRef(userId), orderBy('viewedAt', 'desc'), limit(20));
  const snapshot = await getDocs(q);

  return Promise.all(
    snapshot.docs.map((d) => mapEntry(d.id, d.data(), 'viewedAt'))
  );
};
