import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp, doc, getDoc, limit, startAfter, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from './firebase';
import { Post, Comment } from '../types';

const POSTS_COLLECTION = 'posts';

// 1. Fetch posts by category
export const fetchPostsByCategory = async (
    category?: 'jobs' | 'real_estate' | 'marketplace' | 'news' | 'announcements',
    pageSize: number = 20,
    lastVisible?: QueryDocumentSnapshot<DocumentData>
) => {
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
