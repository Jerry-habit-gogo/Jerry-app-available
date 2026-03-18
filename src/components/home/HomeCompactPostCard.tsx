import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Post } from '../../types';
import { PostStatusBadge } from '../PostStatusBadge';
import { getPostStatus, isPostActive } from '../../constants/postStatus';
import { color, radius, spacing, typography } from '../../theme/tokens';

interface Props {
  post: Post;
  onPress: (post: Post) => void;
  compact?: boolean;
}

export function HomeCompactPostCard({ post, onPress, compact = false }: Props) {
  const inactive = !isPostActive(post);
  const status = getPostStatus(post);

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      style={[styles.card, compact && styles.cardCompact]}
      onPress={() => onPress(post)}
    >
      {post.images?.[0] ? (
        <Image source={{ uri: post.images[0] }} style={[styles.image, compact && styles.imageCompact]} />
      ) : null}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, inactive && styles.titleInactive]} numberOfLines={2}>
            {post.title}
          </Text>
          <PostStatusBadge status={status} />
        </View>
        <Text style={styles.meta} numberOfLines={1}>
          {[post.region, post.authorName].filter(Boolean).join(' · ')}
        </Text>
        {post.price != null ? (
          <Text style={styles.price}>${post.price.toLocaleString()}</Text>
        ) : (
          <Text style={styles.preview} numberOfLines={2}>
            {post.content}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 250,
    backgroundColor: color.bg.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.line.subtle,
    padding: spacing[12],
    marginRight: spacing[12],
  },
  cardCompact: {
    width: 220,
  },
  image: {
    width: '100%',
    height: 120,
    borderRadius: radius.md,
    marginBottom: spacing[12],
    backgroundColor: color.line.default,
  },
  imageCompact: {
    height: 104,
  },
  content: {
    gap: 6,
  },
  header: {
    gap: spacing[8],
  },
  title: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.bold,
    color: color.text.primary,
    lineHeight: 20,
  },
  titleInactive: {
    color: color.text.tertiary,
  },
  meta: {
    fontSize: typography.size.caption,
    color: color.text.tertiary,
  },
  price: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.bold,
    color: color.state.success,
  },
  preview: {
    fontSize: typography.size.bodySmall,
    lineHeight: 18,
    color: color.text.tertiary,
  },
});
