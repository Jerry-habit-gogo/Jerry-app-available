import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, Image, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import ScreenContainer from '../components/ScreenContainer';
import { CommentSection } from '../components/CommentSection';
import { fetchPostComments, addComment } from '../services/boardService';
import { useUserStore } from '../store/userStore';
import { Comment } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'PostDetail'>;

export const PostDetailScreen: React.FC<Props> = ({ route }) => {
    const { post } = route.params;
    const { user } = useUserStore();

    const [comments, setComments] = useState<Comment[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load comments
    useEffect(() => {
        const loadComments = async () => {
            try {
                const fetchedComments = await fetchPostComments(post.id);
                setComments(fetchedComments);
            } catch (error) {
                console.error('Failed to load comments', error);
            }
        };
        loadComments();
    }, [post.id]);

    const handleAddComment = async (content: string) => {
        if (!user) {
            Alert.alert("알림", "로그인이 필요합니다.");
            return;
        }

        setIsSubmitting(true);
        try {
            const newCommentData = {
                authorId: user.id || 'anonymous',
                authorName: user.displayName || '익명 사용자',
                authorAvatar: user.photoUrl || undefined,
                content,
            };

            const newId = await addComment(post.id, newCommentData);

            // Update local state instantly
            const newComment: Comment = {
                ...newCommentData,
                id: newId,
                postId: post.id,
                createdAt: new Date().toISOString()
            };

            setComments([...comments, newComment]);
        } catch (error) {
            console.error('Failed to add comment', error);
            Alert.alert('오류', '댓글 게시에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };

    return (
        <ScreenContainer scrollable={true}>
            <View style={styles.postContainer}>
                {/* Header (Author, Category, Time) */}
                <View style={styles.header}>
                    <View style={styles.authorRow}>
                        {post.authorAvatar ? (
                            <Image source={{ uri: post.authorAvatar }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, styles.placeholderAvatar]}>
                                <Text style={styles.placeholderAvatarText}>
                                    {post.authorName.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                        <View>
                            <Text style={styles.authorName}>{post.authorName}</Text>
                            <Text style={styles.dateText}>{formatDate(post.createdAt)}</Text>
                        </View>
                    </View>
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{post.category.toUpperCase()}</Text>
                    </View>
                </View>

                {/* Title and Content */}
                <Text style={styles.title}>{post.title}</Text>

                {post.price && (
                    <Text style={styles.price}>${post.price.toLocaleString()}</Text>
                )}

                {/* Highlight Image if present */}
                {post.images && post.images.length > 0 && (
                    <Image source={{ uri: post.images[0] }} style={styles.mainImage} />
                )}

                <Text style={styles.content}>{post.content}</Text>

                {/* Stats */}
                <View style={styles.statsContainer}>
                    <Text style={styles.statsText}>조회 {post.viewCount}</Text>
                    <Text style={styles.statsText}>·</Text>
                    <Text style={styles.statsText}>좋아요 {post.likeCount}</Text>
                </View>
            </View>

            {/* Constraints Comment Section below post */}
            <CommentSection comments={comments} onAddComment={handleAddComment} isSubmitting={isSubmitting} />
        </ScreenContainer>
    );
};

const styles = StyleSheet.create({
    postContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    placeholderAvatar: {
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderAvatarText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    authorName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    dateText: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    categoryBadge: {
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    categoryText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#4b5563',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111',
        marginBottom: 12,
    },
    price: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#10b981',
        marginBottom: 16,
    },
    mainImage: {
        width: '100%',
        height: 250,
        borderRadius: 8,
        marginBottom: 16,
        backgroundColor: '#f9f9f9',
    },
    content: {
        fontSize: 16,
        color: '#444',
        lineHeight: 24,
        marginBottom: 24,
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 16,
    },
    statsText: {
        fontSize: 13,
        color: '#6b7280',
        marginRight: 8,
    },
});
