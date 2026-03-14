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

const POSTS_COLLECTION = 'posts';

// --- Mock fallback state (only used when Firebase is not configured) ---
let localPosts: Post[] = [...mockPosts];
let localComments: Record<string, Comment[]> = { ...mockComments };

// --- Helpers ---

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
        const categoryPosts = options.category
            ? localPosts.filter((p) => p.category === options.category)
            : localPosts;
        const filtered = applySearchFilter(categoryPosts, options.searchText);
        return { posts: filtered.slice(0, pageSize), lastVisible: undefined };
    }

    const constraints: Parameters<typeof query>[1][] = [];

    if (options.category) constraints.push(where('category', '==', options.category));
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

    const q = query(collection(db, POSTS_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);
    const posts = applySearchFilter(snapshot.docs.map(mapPostDoc), options.searchText);

    return {
        posts,
        lastVisible: snapshot.docs[snapshot.docs.length - 1],
    };
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
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, pageSize);
    }

    const q = query(
        collection(db, POSTS_COLLECTION),
        where('authorId', '==', authorId),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapPostDoc);
};

/**
 * Create a new post. Pass pre-uploaded Storage URLs in postData.images if needed.
 */
export const createPost = async (
    postData: Omit<Post, 'id' | 'createdAt' | 'viewCount' | 'commentCount' | 'likeCount'>
): Promise<string> => {
    if (!isFirebaseConfigured) {
        const newPost: Post = {
            id: `local-post-${Date.now()}`,
            ...postData,
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
        ...postData,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || postData.authorName,
        authorAvatar: currentUser.photoURL || postData.authorAvatar || null,
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
 * Update the status of a post (author only).
 * Supported transitions: active → closed / sold / filled, any → active.
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
