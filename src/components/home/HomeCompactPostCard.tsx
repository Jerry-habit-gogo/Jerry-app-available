import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Post } from '../../types';
import { PostStatusBadge } from '../PostStatusBadge';
import { getPostStatus, isPostActive } from '../../constants/postStatus';

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
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    padding: 12,
    marginRight: 12,
  },
  cardCompact: {
    width: 220,
  },
  image: {
    width: '100%',
    height: 120,
    borderRadius: 14,
    marginBottom: 12,
    backgroundColor: '#E5E7EB',
  },
  imageCompact: {
    height: 104,
  },
  content: {
    gap: 6,
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 20,
  },
  titleInactive: {
    color: '#9CA3AF',
  },
  meta: {
    fontSize: 12,
    color: '#6B7280',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  preview: {
    fontSize: 13,
    lineHeight: 18,
    color: '#4B5563',
  },
});
