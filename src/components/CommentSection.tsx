import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity } from 'react-native';
import { Comment } from '../types';

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
        marginTop: 20,
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 20,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        paddingTop: 12,
        minHeight: 40,
        maxHeight: 100,
        backgroundColor: '#fafafa',
        marginRight: 8,
    },
    submitButton: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        justifyContent: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: '#a5b4fc',
    },
    submitButtonText: {
        color: 'white',
        fontWeight: '600',
    },
    listContainer: {
        gap: 16,
    },
    disabledMessage: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: -10,
        marginBottom: 16,
    },
    commentItem: {
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    authorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 8,
    },
    placeholderAvatar: {
        backgroundColor: '#10b981',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderAvatarText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 10,
    },
    authorName: {
        fontSize: 13,
        fontWeight: '500',
        color: '#444',
    },
    timeText: {
        fontSize: 11,
        color: '#888',
    },
    commentContent: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
        marginLeft: 32,
    },
    commentHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    deleteButton: {
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    deleteButtonText: {
        fontSize: 12,
        color: '#EF4444',
    },
    reportButtonText: {
        fontSize: 12,
        color: '#9CA3AF',
    },
});
