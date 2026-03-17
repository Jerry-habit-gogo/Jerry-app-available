import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Post } from '../types';
import { PostWithMeta } from '../services/userContentService';
import { PostStatusBadge } from './PostStatusBadge';
import { getPostStatus, isPostActive, isPostDeleted } from '../constants/postStatus';

interface Props {
  item: PostWithMeta;
  onPress?: (post: Post) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  jobs: '구인구직',
  realestate: '부동산',
  marketplace: '중고거래',
  community: '커뮤니티',
  news: '뉴스',
  announcements: '공지',
};

const formatTimeAgo = (iso: string): string => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return '방금 전';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
};

export function RecentlyViewedCard({ item, onPress }: Props) {
  const { snapshot, post, deleted, timestamp } = item;

  const postStatus = getPostStatus(post);
  const deletedState = deleted || !post || isPostDeleted(post);
  const isInactive = !deletedState && !isPostActive(post);
  const thumbnailUri = post?.images?.[0] ?? snapshot.imageUrl ?? null;
  const categoryLabel = CATEGORY_LABELS[snapshot.category] ?? snapshot.category;
  const price = post?.price ?? snapshot.price;

  // Deleted post — non-tappable, greyed out
  if (deletedState) {
    return (
      <View style={[styles.card, styles.deletedCard]}>
        <View style={styles.thumbnailBox}>
          {thumbnailUri ? (
            <Image source={{ uri: thumbnailUri }} style={[styles.thumbnail, styles.thumbnailDeleted]} />
          ) : (
            <View style={[styles.thumbnailPlaceholder, styles.thumbnailDeleted]}>
              <Text style={styles.thumbnailPlaceholderText}>{categoryLabel[0]}</Text>
            </View>
          )}
        </View>
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, styles.titleDeleted]} numberOfLines={2}>
              {post?.title ?? snapshot.title}
            </Text>
            <View style={styles.deletedBadge}>
              <Text style={styles.deletedBadgeText}>삭제됨</Text>
            </View>
          </View>
          <View style={styles.tagsRow}>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryTagText}>{categoryLabel}</Text>
            </View>
            {snapshot.region ? (
              <Text style={styles.regionText}>{snapshot.region}</Text>
            ) : null}
          </View>
          {price != null ? (
            <Text style={styles.priceDeleted}>${price.toLocaleString()}</Text>
          ) : null}
          <Text style={styles.viewedAt}>{formatTimeAgo(timestamp)} 조회</Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.card, isInactive && styles.inactiveCard]}
      onPress={() => onPress?.(post)}
      activeOpacity={0.75}
    >
      <View style={styles.thumbnailBox}>
        {thumbnailUri ? (
          <Image
            source={{ uri: thumbnailUri }}
            style={[styles.thumbnail, isInactive && styles.thumbnailDimmed]}
          />
        ) : (
          <View style={[styles.thumbnailPlaceholder, isInactive && styles.thumbnailPlaceholderDimmed]}>
            <Text style={styles.thumbnailPlaceholderText}>{categoryLabel[0]}</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text
            style={[styles.title, isInactive && styles.titleDimmed]}
            numberOfLines={2}
          >
            {post.title}
          </Text>
          <PostStatusBadge status={postStatus} />
        </View>

        <View style={styles.tagsRow}>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryTagText}>{categoryLabel}</Text>
          </View>
          {post.region ? (
            <Text style={styles.regionText}>{post.region}</Text>
          ) : null}
        </View>

        {price != null ? (
          <Text style={[styles.price, isInactive && styles.priceDimmed]}>
            ${price.toLocaleString()}
          </Text>
        ) : null}

        <Text style={styles.viewedAt}>{formatTimeAgo(timestamp)} 조회</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  deletedCard: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  inactiveCard: {
    backgroundColor: '#FAFAFA',
  },
  thumbnailBox: {
    marginRight: 12,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  thumbnailDimmed: {
    opacity: 0.5,
  },
  thumbnailDeleted: {
    opacity: 0.35,
  },
  thumbnailPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailPlaceholderDimmed: {
    backgroundColor: '#F3F4F6',
    opacity: 0.6,
  },
  thumbnailPlaceholderText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#3B82F6',
  },
  info: {
    flex: 1,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 5,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 20,
  },
  titleDimmed: {
    color: '#9CA3AF',
  },
  titleDeleted: {
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  deletedBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    flexShrink: 0,
  },
  deletedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  categoryTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  categoryTagText: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '600',
  },
  regionText: {
    fontSize: 12,
    color: '#6B7280',
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 3,
  },
  priceDimmed: {
    color: '#9CA3AF',
  },
  priceDeleted: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D1D5DB',
    marginBottom: 3,
  },
  viewedAt: {
    fontSize: 11,
    color: '#D1D5DB',
  },
});
