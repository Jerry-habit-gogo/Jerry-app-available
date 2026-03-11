import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp, doc, getDoc, limit, startAfter, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { Post, Comment } from '../types';
import { mockPosts, mockComments } from './mockData';

const POSTS_COLLECTION = 'posts';
let localPosts: Post[] = [...mockPosts];
let localComments: Record<string, Comment[]> = { ...mockComments };

// 1. Fetch posts by category
export const fetchPostsByCategory = async (
    category?: 'jobs' | 'real_estate' | 'marketplace' | 'news' | 'announcements',
    pageSize: number = 20,
    lastVisible?: QueryDocumentSnapshot<DocumentData>
) => {
    if (!isFirebaseConfigured) {
        const filteredPosts = category
            ? localPosts.filter((post) => post.category === category)
            : localPosts;

        return {
            posts: filteredPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, pageSize),
            lastVisible: undefined,
        };
    }

    try {
        let q = collection(db, POSTS_COLLECTION);

        const constraints: any[] = [];
        if (category) {
            constraints.push(where('category', '==', category));
        }

        constraints.push(orderBy('createdAt', 'desc'));
        constraints.push(limit(pageSize));

        if (lastVisible) {
            constraints.push(startAfter(lastVisible));
        }

        const finalQuery = query(q, ...constraints);
        const querySnapshot = await getDocs(finalQuery);

        const posts: Post[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            posts.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
            } as Post);
        });

        return {
            posts,
            lastVisible: querySnapshot.docs[querySnapshot.docs.length - 1],
        };
    } catch (error) {
        console.error('Error fetching posts:', error);
        throw error;
    }
};

// 2. Create a new post
export const createPost = async (
    postData: Omit<Post, 'id' | 'createdAt' | 'viewCount' | 'commentCount' | 'likeCount'>
) => {
    if (!isFirebaseConfigured) {
        const newPost: Post = {
            id: `local-post-${Date.now()}`,
            ...postData,
            createdAt: new Date().toISOString(),
            viewCount: 0,
            commentCount: 0,
            likeCount: 0,
        };

        localPosts = [newPost, ...localPosts];
        return newPost.id;
    }

    try {
        const newPostRef = await addDoc(collection(db, POSTS_COLLECTION), {
            ...postData,
            createdAt: serverTimestamp(),
            viewCount: 0,
            commentCount: 0,
            likeCount: 0,
        });
        return newPostRef.id;
    } catch (error) {
        console.error('Error creating post:', error);
        throw error;
    }
};

// 3. Fetch single post comments
export const fetchPostComments = async (postId: string) => {
    if (!isFirebaseConfigured) {
        return (localComments[postId] || []).sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
    }

    try {
        const commentsRef = collection(db, `${POSTS_COLLECTION}/${postId}/comments`);
        const q = query(commentsRef, orderBy('createdAt', 'asc'));

        const querySnapshot = await getDocs(q);
        const comments: Comment[] = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            comments.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
            } as Comment);
        });

        return comments;
    } catch (error) {
        console.error('Error fetching comments:', error);
        throw error;
    }
};

// 4. Add a comment to a post
export const addComment = async (
    postId: string,
    commentData: Omit<Comment, 'id' | 'createdAt' | 'postId'>
) => {
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
        localPosts = localPosts.map((post) =>
            post.id === postId ? { ...post, commentCount: post.commentCount + 1 } : post
        );

        return newComment.id;
    }

    try {
        const commentsRef = collection(db, `${POSTS_COLLECTION}/${postId}/comments`);
        const newCommentRef = await addDoc(commentsRef, {
            ...commentData,
            postId,
            createdAt: serverTimestamp(),
        });

        return newCommentRef.id;
    } catch (error) {
        console.error('Error adding comment:', error);
        throw error;
    }
};
