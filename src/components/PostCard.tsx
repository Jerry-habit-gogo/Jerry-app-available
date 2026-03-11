import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Post } from '../types';
import Card from './Card';

interface PostCardProps {
    post: Post;
    onPress: (post: Post) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onPress }) => {
    // Format date loosely for UI mockup
    const formatTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

        if (diffInHours < 1) return '방금 전';
        if (diffInHours < 24) return `${diffInHours}시간 전`;
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}일 전`;
    };

    return (
        <TouchableOpacity onPress={() => onPress(post)} activeOpacity={0.8}>
            <Card style={styles.cardContainer}>
                {/* Header: Author & Time */}
                <View style={styles.header}>
                    <View style={styles.authorInfo}>
                        {post.authorAvatar ? (
                            <Image source={{ uri: post.authorAvatar }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, styles.placeholderAvatar]}>
                                <Text style={styles.placeholderAvatarText}>
                                    {post.authorName.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                        <Text style={styles.authorName}>{post.authorName}</Text>
                    </View>
                    <Text style={styles.timeText}>{formatTimeAgo(post.createdAt)}</Text>
                </View>

                {/* Content: Title & Preview */}
                <Text style={styles.title} numberOfLines={2}>{post.title}</Text>
                <Text style={styles.preview} numberOfLines={3}>{post.content}</Text>

                {/* Price Tag if applicable */}
                {post.price && (
                    <Text style={styles.price}>${post.price.toLocaleString()}</Text>
                )}

                {/* Optional Image Preview */}
                {post.images && post.images.length > 0 && (
                    <Image source={{ uri: post.images[0] }} style={styles.imagePreview} />
                )}

                {/* Footer: Stats */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>👀 {post.viewCount}</Text>
                    <Text style={styles.footerText}>💬 {post.commentCount}</Text>
                    <Text style={styles.footerText}>❤️ {post.likeCount}</Text>
                </View>
            </Card>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        marginBottom: 12,
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    authorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
    },
    placeholderAvatar: {
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderAvatarText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    authorName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    timeText: {
        fontSize: 12,
        color: '#888',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111',
        marginBottom: 8,
    },
    preview: {
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
        marginBottom: 12,
    },
    price: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#10b981', // green for price
        marginBottom: 12,
    },
    imagePreview: {
        width: '100%',
        height: 150,
        borderRadius: 8,
        marginBottom: 12,
        backgroundColor: '#f0f0f0',
    },
    footer: {
        flexDirection: 'row',
        gap: 16,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 12,
    },
    footerText: {
        fontSize: 13,
        color: '#666',
    },
});
