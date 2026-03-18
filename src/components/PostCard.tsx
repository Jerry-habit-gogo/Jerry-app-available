import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Post } from '../types';
import Card from './Card';
import { PostStatusBadge } from './PostStatusBadge';
import { getPostStatus, isPostActive } from '../constants/postStatus';
import { color, radius, spacing, typography } from '../theme/tokens';

interface PostCardProps {
    post: Post;
    onPress: (post: Post) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onPress }) => {
    const formatTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

        if (diffInHours < 1) return '방금 전';
        if (diffInHours < 24) return `${diffInHours}시간 전`;
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}일 전`;
    };

    const status = getPostStatus(post);
    const isInactive = !isPostActive(post);

    return (
        <TouchableOpacity onPress={() => onPress(post)} activeOpacity={0.8}>
            <Card style={[styles.cardContainer, !!post.isPinned && styles.pinnedCard]}>
                {post.isPinned && (
                    <View style={styles.pinnedBanner}>
                        <Text style={styles.pinnedText}>📌 공지사항</Text>
                    </View>
                )}

                {/* Header: Author, Time & Status badge */}
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
                    <View style={styles.headerRight}>
                        <PostStatusBadge status={status} />
                        <Text style={styles.timeText}>{formatTimeAgo(post.createdAt)}</Text>
                    </View>
                </View>

                {/* Content: Title & Preview */}
                <Text style={[styles.title, isInactive && styles.titleDimmed]} numberOfLines={2}>{post.title}</Text>
                <Text style={styles.preview} numberOfLines={3}>{post.content}</Text>

                {/* Price Tag if applicable */}
                {post.price && (
                    <Text style={styles.price}>${post.price.toLocaleString()}</Text>
                )}

                {(post.region || post.jobType || post.realEstateType || post.marketplaceCondition) && (
                    <View style={styles.metaRow}>
                        {post.region && <Text style={styles.metaText}>{post.region}</Text>}
                        {post.jobType && <Text style={styles.metaText}>{post.jobType.replace('_', ' ')}</Text>}
                        {post.realEstateType && <Text style={styles.metaText}>{post.realEstateType}</Text>}
                        {post.marketplaceCondition && <Text style={styles.metaText}>{post.marketplaceCondition}</Text>}
                    </View>
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
        marginBottom: spacing[12],
        padding: spacing[16],
    },
    pinnedCard: {
        borderLeftWidth: 3,
        borderLeftColor: color.brand.blue,
    },
    pinnedBanner: {
        backgroundColor: color.brand.greenLight,
        borderRadius: radius.xs,
        paddingHorizontal: spacing[8],
        paddingVertical: spacing[4],
        alignSelf: 'flex-start',
        marginBottom: 10,
    },
    pinnedText: {
        fontSize: typography.size.micro,
        fontWeight: typography.weight.bold,
        color: color.brand.greenDark,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing[12],
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    titleDimmed: {
        color: color.text.tertiary,
    },
    authorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: spacing[8],
    },
    placeholderAvatar: {
        backgroundColor: color.brand.green,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderAvatarText: {
        color: color.text.inverse,
        fontWeight: typography.weight.bold,
        fontSize: typography.size.bodySmall,
    },
    authorName: {
        fontSize: typography.size.bodySmall,
        fontWeight: typography.weight.semiBold,
        color: color.text.primary,
    },
    timeText: {
        fontSize: typography.size.caption,
        color: color.text.tertiary,
    },
    title: {
        fontSize: typography.size.body,
        fontWeight: typography.weight.bold,
        color: color.text.primary,
        marginBottom: spacing[8],
    },
    preview: {
        fontSize: typography.size.bodySmall,
        color: color.text.secondary,
        lineHeight: 20,
        marginBottom: spacing[12],
    },
    price: {
        fontSize: typography.size.body,
        fontWeight: typography.weight.bold,
        color: color.brand.green,
        marginBottom: spacing[12],
    },
    metaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing[8],
        marginBottom: spacing[12],
    },
    metaText: {
        fontSize: typography.size.caption,
        color: color.brand.greenDark,
        backgroundColor: color.brand.greenLight,
        paddingHorizontal: spacing[8],
        paddingVertical: spacing[4],
        borderRadius: radius.full,
    },
    imagePreview: {
        width: '100%',
        height: 150,
        borderRadius: radius.xs,
        marginBottom: spacing[12],
        backgroundColor: color.line.subtle,
    },
    footer: {
        flexDirection: 'row',
        gap: spacing[16],
        borderTopWidth: 1,
        borderTopColor: color.line.subtle,
        paddingTop: spacing[12],
    },
    footerText: {
        fontSize: typography.size.bodySmall,
        color: color.text.secondary,
    },
});
