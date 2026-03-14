import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Alert, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import Button from '../components/Button';
import ScreenContainer from '../components/ScreenContainer';
import { CommentSection } from '../components/CommentSection';
import { ReportModal } from '../components/ReportModal';
import {
    fetchPostById,
    fetchPostComments,
    addComment,
    togglePostLike,
    checkUserLiked,
    updatePostStatus,
} from '../services/boardService';
import { createOrOpenChatForPost } from '../services/chatService';
import { blockUser } from '../services/moderationService';
import { useUserStore } from '../store/userStore';
import { Comment, Post, PostStatus } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'PostDetail'>;

const STATUS_LABELS: Record<PostStatus, string> = {
    active: '활성',
    closed: '마감',
    sold: '판매완료',
    filled: '충원완료',
};

const STATUS_BADGE_STYLE: Record<PostStatus, { color: string; bg: string }> = {
    active:  { color: '#059669', bg: '#D1FAE5' },
    closed:  { color: '#6B7280', bg: '#F3F4F6' },
    sold:    { color: '#DC2626', bg: '#FEF2F2' },
    filled:  { color: '#2563EB', bg: '#EFF6FF' },
};

export const PostDetailScreen: React.FC<Props> = ({ route, navigation }) => {
    const { post: routePost } = route.params;
    const { user } = useUserStore();

    const [post, setPost] = useState<Post>(routePost);
    const [comments, setComments] = useState<Comment[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOpeningChat, setIsOpeningChat] = useState(false);
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(routePost.likeCount);
    const [commentCount, setCommentCount] = useState(routePost.commentCount);
    const [reportVisible, setReportVisible] = useState(false);

    const isAuthor = !!user && user.id === post.authorId;

    useEffect(() => {
        const load = async () => {
            try {
                const [freshPost, fetchedComments, alreadyLiked] = await Promise.all([
                    fetchPostById(routePost.id),
                    fetchPostComments(routePost.id),
                    checkUserLiked(routePost.id),
                ]);

                if (freshPost) {
                    setPost(freshPost);
                    setLikeCount(freshPost.likeCount);
                    setCommentCount(freshPost.commentCount);
                }
                setComments(fetchedComments);
                setLiked(alreadyLiked);
            } catch (error) {
                console.error('Failed to load post data', error);
            }
        };
        load();
    }, [routePost.id]);

    const handleAddComment = async (content: string) => {
        if (!user) {
            Alert.alert('알림', '로그인이 필요합니다.', [
                { text: '취소', style: 'cancel' },
                { text: '로그인', onPress: () => navigation.navigate('Auth') },
            ]);
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

            const newId = await addComment(routePost.id, newCommentData, {
                postAuthorId: post.authorId,
                postTitle: post.title,
            });

            setComments((prev) => [
                ...prev,
                { ...newCommentData, id: newId, postId: routePost.id, createdAt: new Date().toISOString() },
            ]);
            setCommentCount((prev) => prev + 1);
        } catch (error) {
            console.error('Failed to add comment', error);
            Alert.alert('오류', '댓글 게시에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLike = async () => {
        if (!user) {
            Alert.alert('알림', '로그인이 필요합니다.', [
                { text: '취소', style: 'cancel' },
                { text: '로그인', onPress: () => navigation.navigate('Auth') },
            ]);
            return;
        }

        const newLiked = !liked;
        setLiked(newLiked);
        setLikeCount((prev) => prev + (newLiked ? 1 : -1));
        try {
            await togglePostLike(routePost.id, newLiked, {
                postAuthorId: post.authorId,
                postTitle: post.title,
            });
        } catch {
            setLiked(!newLiked);
            setLikeCount((prev) => prev + (newLiked ? -1 : 1));
        }
    };

    const handleOpenChat = async () => {
        if (!user) {
            Alert.alert('알림', '로그인이 필요합니다.', [
                { text: '취소', style: 'cancel' },
                { text: '로그인', onPress: () => navigation.navigate('Auth') },
            ]);
            return;
        }

        setIsOpeningChat(true);
        try {
            const chatRoom = await createOrOpenChatForPost(post);
            navigation.navigate('ChatDetail', { chatRoom });
        } catch (error) {
            console.error('Failed to open chat', error);
            Alert.alert('오류', '채팅방을 여는 데 실패했습니다.');
        } finally {
            setIsOpeningChat(false);
        }
    };

    const handleMoreMenu = () => {
        if (!user) {
            navigation.navigate('Auth');
            return;
        }

        if (isAuthor) {
            const currentLabel = STATUS_LABELS[post.status ?? 'active'];
            Alert.alert('게시글 관리', `현재 상태: ${currentLabel}`, [
                { text: '마감으로 변경', onPress: () => handleUpdateStatus('closed') },
                { text: '판매완료로 변경', onPress: () => handleUpdateStatus('sold') },
                { text: '충원완료로 변경', onPress: () => handleUpdateStatus('filled') },
                { text: '다시 활성화', onPress: () => handleUpdateStatus('active') },
                { text: '취소', style: 'cancel' },
            ]);
        } else {
            Alert.alert('', '', [
                { text: '이 게시글 신고하기', onPress: () => setReportVisible(true) },
                { text: '작성자 차단하기', style: 'destructive', onPress: handleBlockAuthor },
                { text: '취소', style: 'cancel' },
            ]);
        }
    };

    const handleUpdateStatus = async (status: PostStatus) => {
        try {
            await updatePostStatus(post.id, status);
            setPost((prev) => ({ ...prev, status }));
        } catch {
            Alert.alert('오류', '상태 변경에 실패했습니다.');
        }
    };

    const handleBlockAuthor = () => {
        Alert.alert(
            '차단 확인',
            `${post.authorName}님을 차단하면 해당 사용자의 게시글과 채팅이 더 이상 표시되지 않습니다.`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '차단하기',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await blockUser(post.authorId);
                            Alert.alert('완료', '차단되었습니다.');
                            navigation.goBack();
                        } catch {
                            Alert.alert('오류', '차단에 실패했습니다.');
                        }
                    },
                },
            ]
        );
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };

    const currentStatus = post.status ?? 'active';
    const badgeStyle = STATUS_BADGE_STYLE[currentStatus];

    return (
        <ScreenContainer scrollable={true}>
            <View style={styles.postContainer}>
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

                    <View style={styles.headerRight}>
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{post.category.toUpperCase()}</Text>
                        </View>
                        <TouchableOpacity style={styles.moreButton} onPress={handleMoreMenu}>
                            <Text style={styles.moreButtonText}>•••</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {currentStatus !== 'active' && (
                    <View style={[styles.statusBanner, { backgroundColor: badgeStyle.bg }]}>
                        <Text style={[styles.statusBannerText, { color: badgeStyle.color }]}>
                            {STATUS_LABELS[currentStatus]}
                        </Text>
                    </View>
                )}

                <Text style={styles.title}>{post.title}</Text>

                {post.price != null && (
                    <Text style={styles.price}>${post.price.toLocaleString()}</Text>
                )}

                {post.images && post.images.length > 0 && (
                    <Image source={{ uri: post.images[0] }} style={styles.mainImage} />
                )}

                <Text style={styles.content}>{post.content}</Text>

                {!isAuthor && (
                    <View style={styles.chatAction}>
                        <Button
                            title={isOpeningChat ? '채팅방 여는 중...' : '작성자와 채팅하기'}
                            onPress={handleOpenChat}
                            isLoading={isOpeningChat}
                        />
                    </View>
                )}

                <View style={styles.statsContainer}>
                    <Text style={styles.statsText}>조회 {post.viewCount}</Text>
                    <Text style={styles.statsText}>·</Text>
                    <Text style={styles.statsText}>댓글 {commentCount}</Text>
                    <Text style={styles.statsText}>·</Text>
                    <TouchableOpacity onPress={handleLike} style={styles.likeButton}>
                        <Text style={[styles.statsText, liked && styles.likedText]}>
                            {liked ? '♥' : '♡'} {likeCount}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <CommentSection
                comments={comments}
                onAddComment={handleAddComment}
                isSubmitting={isSubmitting}
            />

            <ReportModal
                visible={reportVisible}
                targetType="post"
                targetId={post.id}
                postId={post.id}
                onClose={() => setReportVisible(false)}
            />
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
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
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
    moreButton: {
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    moreButtonText: {
        fontSize: 16,
        color: '#6B7280',
        letterSpacing: 2,
    },
    statusBanner: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        marginBottom: 12,
    },
    statusBannerText: {
        fontSize: 13,
        fontWeight: '700',
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
    chatAction: {
        marginBottom: 8,
    },
    statsText: {
        fontSize: 13,
        color: '#6b7280',
        marginRight: 8,
    },
    likeButton: {
        padding: 4,
    },
    likedText: {
        color: '#ef4444',
        fontWeight: 'bold',
    },
});
