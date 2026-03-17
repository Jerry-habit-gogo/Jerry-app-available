import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, Alert, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import Button from '../components/Button';
import ScreenContainer from '../components/ScreenContainer';
import { CommentSection } from '../components/CommentSection';
import { ReportModal } from '../components/ReportModal';
import {
    fetchPostById,
    readPostById,
    fetchPostComments,
    addComment,
    togglePostLike,
    checkUserLiked,
    updatePostStatus,
    deletePost,
    deleteComment,
} from '../services/boardService';
import { createOrOpenChatForPost } from '../services/chatService';
import { blockUser } from '../services/moderationService';
import {
    isPostSaved,
    toggleSavedPost,
    trackRecentlyViewed,
} from '../services/userContentService';
import { useUserStore } from '../store/userStore';
import { Comment, Post, PostStatus } from '../types';
import {
    getPostStatus,
    isPostActive,
    isPostDeleted,
    POST_STATUS_LABELS,
    POST_STATUS_STYLES,
} from '../constants/postStatus';

type Props = NativeStackScreenProps<RootStackParamList, 'PostDetail'>;

export const PostDetailScreen: React.FC<Props> = ({ route, navigation }) => {
    const { post: routePost } = route.params;
    const { user } = useUserStore();

    const [post, setPost] = useState<Post>(routePost);
    const [isDeleted, setIsDeleted] = useState(isPostDeleted(routePost));
    const [comments, setComments] = useState<Comment[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOpeningChat, setIsOpeningChat] = useState(false);
    const [liked, setLiked] = useState(false);
    const [saved, setSaved] = useState(false);
    const [likeCount, setLikeCount] = useState(routePost.likeCount);
    const [commentCount, setCommentCount] = useState(routePost.commentCount);
    const [reportVisible, setReportVisible] = useState(false);
    const [reportCommentTarget, setReportCommentTarget] = useState<Comment | null>(null);
    const hasTrackedInitialViewRef = useRef(false);

    const isAuthor = !!user && user.id === post.authorId;
    const currentStatus = isDeleted ? 'deleted' : getPostStatus(post);
    const isActive = !isDeleted && isPostActive(post);
    const badgeStyle = POST_STATUS_STYLES[currentStatus];
    const statusLabel = POST_STATUS_LABELS[currentStatus];

    const loadPostData = useCallback(async (trackView: boolean) => {
        try {
            const [freshPost, fetchedComments, alreadyLiked, alreadySaved] = await Promise.all([
                trackView ? fetchPostById(routePost.id) : readPostById(routePost.id),
                fetchPostComments(routePost.id),
                checkUserLiked(routePost.id),
                isPostSaved(routePost.id),
            ]);

            if (freshPost) {
                setPost(freshPost);
                setIsDeleted(isPostDeleted(freshPost));
                setLikeCount(freshPost.likeCount);
                setCommentCount(freshPost.commentCount);
                if (!isPostDeleted(freshPost)) {
                    trackRecentlyViewed(freshPost);
                }
            } else {
                setIsDeleted(true);
                setPost((prev) => ({ ...prev, status: 'deleted' }));
            }
            setComments(freshPost && !isPostDeleted(freshPost) ? fetchedComments : []);
            setLiked(alreadyLiked);
            setSaved(alreadySaved);
        } catch (error) {
            console.error('Failed to load post data', error);
        }
    }, [routePost.id]);

    useEffect(() => {
        hasTrackedInitialViewRef.current = false;
    }, [routePost.id]);

    useFocusEffect(
        useCallback(() => {
            const trackView = !hasTrackedInitialViewRef.current;
            hasTrackedInitialViewRef.current = true;
            loadPostData(trackView);
        }, [loadPostData])
    );

    const handleAddComment = async (content: string) => {
        if (!isActive) {
            Alert.alert('안내', '활성 상태의 게시글에만 댓글을 남길 수 있습니다.');
            return;
        }

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

    const handleSave = async () => {
        if (!user) {
            Alert.alert('알림', '로그인이 필요합니다.', [
                { text: '취소', style: 'cancel' },
                { text: '로그인', onPress: () => navigation.navigate('Auth') },
            ]);
            return;
        }
        const newSaved = !saved;
        setSaved(newSaved);
        try {
            await toggleSavedPost(post.id, newSaved, post);
        } catch {
            setSaved(!newSaved);
        }
    };

    const handleOpenChat = async () => {
        if (!isActive) {
            Alert.alert('안내', '활성 상태의 게시글에만 연락할 수 있습니다.');
            return;
        }

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

    const handleDeletePost = () => {
        Alert.alert('게시글 삭제', '이 게시글을 삭제 상태로 변경하시겠습니까? 일반 사용자에게는 더 이상 노출되지 않습니다.', [
            { text: '취소', style: 'cancel' },
            {
                text: '삭제',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deletePost(post.id);
                        setPost((prev) => ({ ...prev, status: 'deleted' }));
                        setIsDeleted(true);
                        setComments([]);
                    } catch {
                        Alert.alert('오류', '게시글 삭제에 실패했습니다.');
                    }
                },
            },
        ]);
    };

    const handleDeleteComment = async (commentId: string) => {
        Alert.alert('댓글 삭제', '이 댓글을 삭제하시겠습니까?', [
            { text: '취소', style: 'cancel' },
            {
                text: '삭제',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteComment(post.id, commentId);
                        setComments((prev) => prev.filter((c) => c.id !== commentId));
                        setCommentCount((prev) => Math.max(0, prev - 1));
                    } catch {
                        Alert.alert('오류', '댓글 삭제에 실패했습니다.');
                    }
                },
            },
        ]);
    };

    const handleMoreMenu = () => {
        if (!user) {
            navigation.navigate('Auth');
            return;
        }

        if (isAuthor) {
            const currentLabel = POST_STATUS_LABELS[currentStatus];
            Alert.alert('게시글 관리', `현재 상태: ${currentLabel}`, [
                { text: '게시글 수정', onPress: () => navigation.navigate('CreatePost', { post }) },
                { text: '마감으로 변경', onPress: () => handleUpdateStatus('closed') },
                { text: '판매완료로 변경', onPress: () => handleUpdateStatus('sold') },
                { text: '충원완료로 변경', onPress: () => handleUpdateStatus('filled') },
                { text: '임대완료로 변경', onPress: () => handleUpdateStatus('rented') },
                { text: '다시 활성화', onPress: () => handleUpdateStatus('active') },
                { text: '게시글 삭제', style: 'destructive', onPress: handleDeletePost },
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
            setIsDeleted(status === 'deleted');
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
                            await blockUser(post.authorId, {
                                displayName: post.authorName,
                                photoUrl: post.authorAvatar,
                            });
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

    const commentDisabledMessage = isDeleted
        ? '삭제된 게시글에는 댓글을 작성할 수 없습니다.'
        : !isActive
            ? `${statusLabel} 상태의 게시글에는 댓글을 작성할 수 없습니다.`
            : undefined;

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
                            {statusLabel}
                        </Text>
                    </View>
                )}

                <Text style={styles.title}>{post.title}</Text>

                {isDeleted ? (
                    <View style={styles.deletedState}>
                        <Text style={styles.deletedTitle}>삭제된 게시글입니다.</Text>
                        <Text style={styles.deletedDescription}>
                            이 게시글은 더 이상 확인하거나 연락할 수 없습니다.
                        </Text>
                    </View>
                ) : (
                    <>
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
                                    title={
                                        isActive
                                            ? (isOpeningChat ? '채팅방 여는 중...' : '작성자와 채팅하기')
                                            : `${statusLabel} 게시글`
                                    }
                                    onPress={handleOpenChat}
                                    isLoading={isOpeningChat}
                                    disabled={!isActive}
                                />
                                {!isActive ? (
                                    <Text style={styles.actionHint}>
                                        활성 상태의 게시글에만 작성자와 연락할 수 있습니다.
                                    </Text>
                                ) : null}
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
                            <View style={styles.statsSpacer} />
                            <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                                <Text style={[styles.saveIcon, saved && styles.savedIcon]}>
                                    {saved ? '★' : '☆'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>

            {!isDeleted ? (
                <CommentSection
                    comments={comments}
                    onAddComment={handleAddComment}
                    isSubmitting={isSubmitting}
                    currentUserId={user?.id}
                    onDeleteComment={handleDeleteComment}
                    onReportComment={(comment) => setReportCommentTarget(comment)}
                    disabled={!isActive}
                    disabledMessage={commentDisabledMessage}
                />
            ) : null}

            <ReportModal
                visible={reportVisible}
                targetType="post"
                targetId={post.id}
                postId={post.id}
                onClose={() => setReportVisible(false)}
            />
            <ReportModal
                visible={reportCommentTarget !== null}
                targetType="comment"
                targetId={reportCommentTarget?.id ?? ''}
                postId={post.id}
                onClose={() => setReportCommentTarget(null)}
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
    deletedState: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        padding: 16,
        marginBottom: 8,
    },
    deletedTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 6,
    },
    deletedDescription: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
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
    actionHint: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 8,
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
    statsSpacer: {
        flex: 1,
    },
    saveButton: {
        padding: 4,
    },
    saveIcon: {
        fontSize: 20,
        color: '#9CA3AF',
    },
    savedIcon: {
        color: '#F59E0B',
    },
});
