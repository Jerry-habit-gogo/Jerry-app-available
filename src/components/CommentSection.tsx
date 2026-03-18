import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity } from 'react-native';
import { Comment } from '../types';
import { color, radius, shadow, spacing, typography } from '../theme/tokens';

interface CommentSectionProps {
    comments: Comment[];
    onAddComment: (content: string) => void;
    isSubmitting?: boolean;
    currentUserId?: string;
    onDeleteComment?: (commentId: string) => void;
    onReportComment?: (comment: Comment) => void;
    disabled?: boolean;
    disabledMessage?: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
    comments,
    onAddComment,
    isSubmitting = false,
    currentUserId,
    onDeleteComment,
    onReportComment,
    disabled = false,
    disabledMessage,
}) => {
    const [newComment, setNewComment] = useState('');

    const handleSubmit = () => {
        if (newComment.trim()) {
            onAddComment(newComment.trim());
            setNewComment('');
        }
    };

    const formatTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInMins = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMins < 1) return '방금 전';
        if (diffInMins < 60) return `${diffInMins}분 전`;
        const diffInHours = Math.floor(diffInMins / 60);
        if (diffInHours < 24) return `${diffInHours}시간 전`;
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}일 전`;
    };

    return (
        <View style={styles.container}>
            <Text style={styles.headerTitle}>댓글 {comments.length}개</Text>

            {/* Input Area */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="댓글을 남겨보세요..."
                    value={newComment}
                    onChangeText={setNewComment}
                    multiline
                    editable={!isSubmitting && !disabled}
                />
                <TouchableOpacity
                    style={[styles.submitButton, (!newComment.trim() || isSubmitting || disabled) && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={!newComment.trim() || isSubmitting || disabled}
                >
                    <Text style={styles.submitButtonText}>{isSubmitting ? '등록 중...' : '등록'}</Text>
                </TouchableOpacity>
            </View>
            {disabledMessage ? (
                <Text style={styles.disabledMessage}>{disabledMessage}</Text>
            ) : null}

            {/* Comments List */}
            <View style={styles.listContainer}>
                {comments.map((comment) => (
                    <View key={comment.id} style={styles.commentItem}>
                        <View style={styles.commentHeader}>
                            <View style={styles.authorInfo}>
                                {comment.authorAvatar ? (
                                    <Image source={{ uri: comment.authorAvatar }} style={styles.avatar} />
                                ) : (
                                    <View style={[styles.avatar, styles.placeholderAvatar]}>
                                        <Text style={styles.placeholderAvatarText}>
                                            {comment.authorName.charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                )}
                                <Text style={styles.authorName}>{comment.authorName}</Text>
                            </View>
                            <View style={styles.commentHeaderRight}>
                                <Text style={styles.timeText}>{formatTimeAgo(comment.createdAt)}</Text>
                                {currentUserId && comment.authorId === currentUserId && onDeleteComment && (
                                    <TouchableOpacity
                                        onPress={() => onDeleteComment(comment.id)}
                                        style={styles.deleteButton}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                        <Text style={styles.deleteButtonText}>삭제</Text>
                                    </TouchableOpacity>
                                )}
                                {currentUserId && comment.authorId !== currentUserId && onReportComment && (
                                    <TouchableOpacity
                                        onPress={() => onReportComment(comment)}
                                        style={styles.deleteButton}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                        <Text style={styles.reportButtonText}>신고</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                        <Text style={styles.commentContent}>{comment.content}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: spacing[20],
        backgroundColor: color.bg.surface,
        borderRadius: radius.xs,
        padding: spacing[16],
        ...shadow.soft,
    },
    headerTitle: {
        fontSize: typography.size.body,
        fontWeight: typography.weight.bold,
        color: color.text.primary,
        marginBottom: spacing[16],
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: spacing[20],
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: color.line.default,
        borderRadius: radius.xs,
        padding: spacing[12],
        paddingTop: spacing[12],
        minHeight: 40,
        maxHeight: 100,
        backgroundColor: color.bg.subtle,
        marginRight: spacing[8],
    },
    submitButton: {
        backgroundColor: color.brand.green,
        paddingHorizontal: spacing[16],
        paddingVertical: spacing[12],
        borderRadius: radius.xs,
        justifyContent: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: color.neutral[300],
    },
    submitButtonText: {
        color: color.text.inverse,
        fontWeight: typography.weight.semiBold,
    },
    listContainer: {
        gap: spacing[16],
    },
    disabledMessage: {
        fontSize: typography.size.caption,
        color: color.text.tertiary,
        marginTop: -10,
        marginBottom: spacing[16],
    },
    commentItem: {
        paddingBottom: spacing[16],
        borderBottomWidth: 1,
        borderBottomColor: color.line.subtle,
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing[8],
    },
    authorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: spacing[8],
    },
    placeholderAvatar: {
        backgroundColor: color.state.success,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderAvatarText: {
        color: color.text.inverse,
        fontWeight: typography.weight.bold,
        fontSize: 10,
    },
    authorName: {
        fontSize: typography.size.bodySmall,
        fontWeight: typography.weight.medium,
        color: color.text.secondary,
    },
    timeText: {
        fontSize: typography.size.micro,
        color: color.text.tertiary,
    },
    commentContent: {
        fontSize: typography.size.bodySmall,
        color: color.text.primary,
        lineHeight: 20,
        marginLeft: 32,
    },
    commentHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[8],
    },
    deleteButton: {
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    deleteButtonText: {
        fontSize: typography.size.caption,
        color: color.state.error,
    },
    reportButtonText: {
        fontSize: typography.size.caption,
        color: color.text.tertiary,
    },
});
