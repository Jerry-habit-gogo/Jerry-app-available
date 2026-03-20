import {
    addDoc,
    collection,
    doc,
    DocumentData,
    getDoc,
    getDocs,
    increment,
    limit,
    orderBy,
    query,
    QueryDocumentSnapshot,
    runTransaction,
    serverTimestamp,
    startAfter,
    updateDoc,
    where,
} from 'firebase/firestore';
import {
    getDownloadURL,
    ref as storageRef,
    uploadBytes,
} from 'firebase/storage';
import { auth, db, isFirebaseConfigured, storage } from './firebase';
import { Post, Comment, PostFilterOptions, PostStatus } from '../types';
import { mockPosts, mockComments } from './mockData';
import { createNotification } from './notificationService';
import { isPostDeleted } from '../constants/postStatus';

const POSTS_COLLECTION = 'posts';

// --- Mock fallback state (only used when Firebase is not configured) ---
let localPosts: Post[] = [...mockPosts];
let localComments: Record<string, Comment[]> = { ...mockComments };

// --- Helpers ---

const omitUndefined = <T extends Record<string, unknown>>(value: T): T =>
    Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;

const mapPostDoc = (docSnap: QueryDocumentSnapshot<DocumentData>): Post => {
    const data = docSnap.data();
    return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
    } as Post;
};

/** Client-side search filter — only applied when searchText is set. */
const applySearchFilter = (posts: Post[], searchText?: string): Post[] => {
    if (!searchText?.trim()) return posts;
    const lower = searchText.trim().toLowerCase();
    return posts.filter(
        (p) => p.title.toLowerCase().includes(lower) || p.content.toLowerCase().includes(lower)
    );
};

const filterVisiblePosts = (posts: Post[]): Post[] =>
    posts.filter((post) => !isPostDeleted(post));

const applyStructuredFilters = (posts: Post[], options: PostFilterOptions): Post[] =>
    posts.filter((post) => {
        if (options.categories?.length && !options.categories.includes(post.category as 'jobs' | 'real_estate' | 'marketplace')) return false;
        if (options.category && post.category !== options.category) return false;
        if (options.region && post.region !== options.region) return false;
        if (options.jobType && post.jobType !== options.jobType) return false;
        if (options.realEstateType && post.realEstateType !== options.realEstateType) return false;
        if (options.marketplaceCondition && post.marketplaceCondition !== options.marketplaceCondition) return false;
        return true;
    });

const sortPosts = (posts: Post[], sortBy?: PostFilterOptions['sortBy']): Post[] => {
    const sorted = [...posts];

    if (sortBy === 'price_low') {
        sorted.sort((a, b) => (a.price ?? Number.MAX_SAFE_INTEGER) - (b.price ?? Number.MAX_SAFE_INTEGER));
        return sorted;
    }

    if (sortBy === 'price_high') {
        sorted.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        return sorted;
    }

    sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return sorted;
};

// --- Image Upload ---

/**
 * Uploads local image URIs to Firebase Storage and returns download URLs.
 * Path: post-images/{userId}/{timestamp}-{random}.jpg
 */
export const uploadPostImages = async (userId: string, localUris: string[]): Promise<string[]> => {
    const uploads = localUris.map(async (localUri) => {
        const response = await fetch(localUri);
        const blob = await response.blob();
        const imageRef = storageRef(
            storage,
            `post-images/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
        );
        await uploadBytes(imageRef, blob, { contentType: blob.type || 'image/jpeg' });
        return getDownloadURL(imageRef);
    });
    return Promise.all(uploads);
};

// --- Posts ---

/**
 * Fetch a single post by ID and increment its viewCount (fire-and-forget).
 * Returns null if the post does not exist.
 */
export const fetchPostById = async (postId: string): Promise<Post | null> => {
    if (!isFirebaseConfigured) {
        return localPosts.find((p) => p.id === postId) ?? null;
    }

    const postRef = doc(db, POSTS_COLLECTION, postId);
    // Non-blocking view count increment
    updateDoc(postRef, { viewCount: increment(1) }).catch(() => {/* best-effort */});

    const snapshot = await getDoc(postRef);
    if (!snapshot.exists()) return null;

    const data = snapshot.data();
    return {
        id: snapshot.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
    } as Post;
};

/**
 * Fetch a paginated list of posts with optional filters.
 * Firestore handles: category, region, jobType, realEstateType, marketplaceCondition, sort, pagination.
 * Client-side handles: searchText (Firestore has no full-text search).
 */
export const fetchPosts = async (
    options: PostFilterOptions = {},
    pageSize: number = 20,
    lastVisible?: QueryDocumentSnapshot<DocumentData>
): Promise<{ posts: Post[]; lastVisible: QueryDocumentSnapshot<DocumentData> | undefined }> => {
    if (!isFirebaseConfigured) {
        const filtered = applySearchFilter(
            sortPosts(applyStructuredFilters(filterVisiblePosts(localPosts), options), options.sortBy),
            options.searchText
        );
        return { posts: filtered.slice(0, pageSize), lastVisible: undefined };
    }

    const constraints: Parameters<typeof query>[1][] = [];

    if (options.categories?.length) {
        constraints.push(where('category', 'in', options.categories));
    } else if (options.category) {
        constraints.push(where('category', '==', options.category));
    }
    if (options.region) constraints.push(where('region', '==', options.region));
    if (options.jobType) constraints.push(where('jobType', '==', options.jobType));
    if (options.realEstateType) constraints.push(where('realEstateType', '==', options.realEstateType));
    if (options.marketplaceCondition) constraints.push(where('marketplaceCondition', '==', options.marketplaceCondition));

    if (options.sortBy === 'price_low') {
        constraints.push(orderBy('price', 'asc'));
    } else if (options.sortBy === 'price_high') {
        constraints.push(orderBy('price', 'desc'));
    } else {
        constraints.push(orderBy('createdAt', 'desc'));
    }

    constraints.push(limit(pageSize));
    if (lastVisible) constraints.push(startAfter(lastVisible));

    try {
        const q = query(collection(db, POSTS_COLLECTION), ...constraints);
        const snapshot = await getDocs(q);
        const posts = applySearchFilter(filterVisiblePosts(snapshot.docs.map(mapPostDoc)), options.searchText);

        return {
            posts,
            lastVisible: snapshot.docs[snapshot.docs.length - 1],
        };
    } catch (error: any) {
        if (error?.code !== 'failed-precondition') {
            throw error;
        }

        console.warn('Falling back to client-side post filtering because a Firestore index is still building or missing.');

        const fallbackSnapshot = await getDocs(query(collection(db, POSTS_COLLECTION), limit(Math.max(pageSize * 8, 80))));
        const filteredPosts = applySearchFilter(
            sortPosts(applyStructuredFilters(filterVisiblePosts(fallbackSnapshot.docs.map(mapPostDoc)), options), options.sortBy),
            options.searchText
        );

        return {
            posts: filteredPosts.slice(0, pageSize),
            lastVisible: undefined,
        };
    }
};

export const fetchPostsByCategory = async (
    category?: Post['category'],
    pageSize: number = 20,
    lastVisible?: QueryDocumentSnapshot<DocumentData>
) => fetchPosts({ category }, pageSize, lastVisible);

export const fetchPostsByAuthor = async (authorId: string, pageSize: number = 20): Promise<Post[]> => {
    if (!isFirebaseConfigured) {
        return localPosts
            .filter((p) => p.authorId === authorId)
            .filter((p) => !isPostDeleted(p))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, pageSize);
    }

    try {
        const q = query(
            collection(db, POSTS_COLLECTION),
            where('authorId', '==', authorId),
            orderBy('createdAt', 'desc'),
            limit(pageSize)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(mapPostDoc).filter((post) => !isPostDeleted(post));
    } catch (error: any) {
        // Gracefully fall back when the composite index has not been deployed yet.
        if (error?.code !== 'failed-precondition') {
            throw error;
        }

        const fallbackQuery = query(
            collection(db, POSTS_COLLECTION),
            where('authorId', '==', authorId),
            limit(pageSize * 3)
        );
        const fallbackSnapshot = await getDocs(fallbackQuery);
        return fallbackSnapshot.docs
            .map(mapPostDoc)
            .filter((post) => !isPostDeleted(post))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, pageSize);
    }
};

/**
 * Create a new post. Pass pre-uploaded Storage URLs in postData.images if needed.
 */
export const createPost = async (
    postData: Omit<Post, 'id' | 'createdAt' | 'viewCount' | 'commentCount' | 'likeCount'>
): Promise<string> => {
    const sanitizedPostData = omitUndefined(postData);

    if (!isFirebaseConfigured) {
        const newPost: Post = {
            id: `local-post-${Date.now()}`,
            ...sanitizedPostData,
            createdAt: new Date().toISOString(),
            viewCount: 0,
            commentCount: 0,
            likeCount: 0,
            status: 'active',
            isPinned: false,
        };
        localPosts = [newPost, ...localPosts];
        return newPost.id;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Authentication required.');

    const ref = await addDoc(collection(db, POSTS_COLLECTION), {
        ...sanitizedPostData,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || sanitizedPostData.authorName,
        authorAvatar: currentUser.photoURL || sanitizedPostData.authorAvatar || null,
        createdAt: serverTimestamp(),
        viewCount: 0,
        commentCount: 0,
        likeCount: 0,
        status: 'active',
        isPinned: false,
    });
    return ref.id;
};

/**
 * Fetch a single post by ID without incrementing its viewCount.
 * Returns null if the post does not exist.
 */
export const readPostById = async (postId: string): Promise<Post | null> => {
    if (!isFirebaseConfigured) {
        return localPosts.find((p) => p.id === postId) ?? null;
    }

    const snapshot = await getDoc(doc(db, POSTS_COLLECTION, postId));
    if (!snapshot.exists()) return null;

    const data = snapshot.data();
    return {
        id: snapshot.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
    } as Post;
};

/**
 * Update an existing post. Only the author can update.
 */
export const updatePost = async (
    postId: string,
    postData: Omit<Post, 'id' | 'createdAt' | 'viewCount' | 'commentCount' | 'likeCount' | 'status' | 'isPinned'>
): Promise<void> => {
    const sanitizedPostData = omitUndefined(postData);

    if (!isFirebaseConfigured) {
        localPosts = localPosts.map((post) =>
            post.id === postId ? { ...post, ...sanitizedPostData } : post
        );
        return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Authentication required.');

    await updateDoc(doc(db, POSTS_COLLECTION, postId), {
        ...sanitizedPostData,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || sanitizedPostData.authorName,
        authorAvatar: currentUser.photoURL || sanitizedPostData.authorAvatar || null,
    });
};

/**
 * Update the status of a post (author only).
 * Supported transitions: active → closed / sold / filled / rented, any → active.
 */
export const updatePostStatus = async (postId: string, status: PostStatus): Promise<void> => {
    if (!isFirebaseConfigured) {
        localPosts = localPosts.map((p) => (p.id === postId ? { ...p, status } : p));
        return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Authentication required.');

    await updateDoc(doc(db, POSTS_COLLECTION, postId), { status });
};

// --- Likes ---

/**
 * Returns true if the currently signed-in user has liked the given post.
 * Uses the posts/{postId}/likes/{userId} subcollection as source of truth.
 */
export const checkUserLiked = async (postId: string): Promise<boolean> => {
    if (!isFirebaseConfigured || !auth.currentUser) return false;

    const likeRef = doc(db, POSTS_COLLECTION, postId, 'likes', auth.currentUser.uid);
    const snapshot = await getDoc(likeRef);
    return snapshot.exists();
};

/**
 * Toggle like on a post.
 * Uses a Firestore transaction to atomically update the likes subcollection + likeCount.
 * `liked` = true means the user is NOW liking the post (add), false means unliking (remove).
 * Pass `context` to trigger a notification to the post author when liked.
 */
export const togglePostLike = async (
    postId: string,
    liked: boolean,
    context?: { postAuthorId: string; postTitle: string }
): Promise<void> => {
    if (!isFirebaseConfigured) {
        localPosts = localPosts.map((p) =>
            p.id === postId ? { ...p, likeCount: p.likeCount + (liked ? 1 : -1) } : p
        );
        return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Authentication required.');

    const postRef = doc(db, POSTS_COLLECTION, postId);
    const likeRef = doc(db, POSTS_COLLECTION, postId, 'likes', currentUser.uid);

    await runTransaction(db, async (transaction) => {
        if (liked) {
            transaction.set(likeRef, { createdAt: serverTimestamp() });
            transaction.update(postRef, { likeCount: increment(1) });
        } else {
            transaction.delete(likeRef);
            transaction.update(postRef, { likeCount: increment(-1) });
        }
    });

    // Notify post author when liked (not when unliking, not for self-like)
    if (liked && context && context.postAuthorId !== currentUser.uid) {
        createNotification(
            context.postAuthorId,
            'like',
            '좋아요',
            `${currentUser.displayName || '누군가'}님이 "${context.postTitle}"을 좋아합니다.`,
            { postId, actorId: currentUser.uid, actorName: currentUser.displayName || undefined, postTitle: context.postTitle }
        ).catch(() => {}); // fire-and-forget
    }
};

// --- Comments ---

export const fetchPostComments = async (postId: string): Promise<Comment[]> => {
    if (!isFirebaseConfigured) {
        return (localComments[postId] || []).slice().sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
    }

    const q = query(
        collection(db, POSTS_COLLECTION, postId, 'comments'),
        orderBy('createdAt', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => {
        const data = d.data();
        return {
            id: d.id,
            ...data,
            createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
        } as Comment;
    });
};

/**
 * Add a comment and atomically increment the post's commentCount via transaction.
 * Pass `context` to trigger a notification to the post author.
 */
export const addComment = async (
    postId: string,
    commentData: Omit<Comment, 'id' | 'createdAt' | 'postId'>,
    context?: { postAuthorId: string; postTitle: string }
): Promise<string> => {
    if (!isFirebaseConfigured) {
        const newComment: Comment = {
            id: `local-comment-${Date.now()}`,
            ...commentData,
            postId,
            createdAt: new Date().toISOString(),
        };
        localComments = {
            ...localComments,
            [postId]: [...(localComments[postId] || []), newComment],
        };
        localPosts = localPosts.map((p) =>
            p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p
        );
        return newComment.id;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Authentication required.');

    // Create a doc ref outside the transaction so we can return the ID
    const newCommentRef = doc(collection(db, POSTS_COLLECTION, postId, 'comments'));
    const postRef = doc(db, POSTS_COLLECTION, postId);

    await runTransaction(db, async (transaction) => {
        transaction.set(newCommentRef, {
            ...commentData,
            authorId: currentUser.uid,
            authorName: currentUser.displayName || commentData.authorName,
            authorAvatar: currentUser.photoURL || commentData.authorAvatar || null,
            postId,
            createdAt: serverTimestamp(),
        });
        transaction.update(postRef, { commentCount: increment(1) });
    });

    // Notify post author (not for self-comments)
    if (context && context.postAuthorId !== currentUser.uid) {
        createNotification(
            context.postAuthorId,
            'comment',
            '새 댓글',
            `${currentUser.displayName || '누군가'}님: "${commentData.content.slice(0, 60)}"`,
            { postId, actorId: currentUser.uid, actorName: currentUser.displayName || undefined, postTitle: context.postTitle }
        ).catch(() => {}); // fire-and-forget
    }

    return newCommentRef.id;
};

// --- Pinned Posts ---

/**
 * Fetch all currently pinned posts, ordered by creation date.
 * isPinned is set exclusively via Firebase console / Admin SDK.
 */
export const fetchPinnedPosts = async (): Promise<Post[]> => {
    if (!isFirebaseConfigured) {
        return localPosts.filter((p) => p.isPinned && !isPostDeleted(p));
    }

    const q = query(
        collection(db, POSTS_COLLECTION),
        where('isPinned', '==', true),
        orderBy('createdAt', 'desc'),
        limit(10)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapPostDoc).filter((p) => !isPostDeleted(p));
};

// --- Deletion ---

/**
 * Mark a post as deleted (author only).
 */
export const deletePost = async (postId: string): Promise<void> => {
    if (!isFirebaseConfigured) {
        localPosts = localPosts.map((p) => (p.id === postId ? { ...p, status: 'deleted' } : p));
        return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Authentication required.');

    await updateDoc(doc(db, POSTS_COLLECTION, postId), { status: 'deleted' });
};

/**
 * Delete a comment and atomically decrement the post's commentCount.
 */
export const deleteComment = async (postId: string, commentId: string): Promise<void> => {
    if (!isFirebaseConfigured) {
        localComments = {
            ...localComments,
            [postId]: (localComments[postId] ?? []).filter((c) => c.id !== commentId),
        };
        localPosts = localPosts.map((p) =>
            p.id === postId ? { ...p, commentCount: Math.max(0, p.commentCount - 1) } : p
        );
        return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Authentication required.');

    const commentRef = doc(db, POSTS_COLLECTION, postId, 'comments', commentId);
    const postRef = doc(db, POSTS_COLLECTION, postId);

    await runTransaction(db, async (transaction) => {
        transaction.delete(commentRef);
        transaction.update(postRef, { commentCount: increment(-1) });
    });
};
