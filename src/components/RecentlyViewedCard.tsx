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
import { color, radius, shadow, spacing, typography } from '../theme/tokens';

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
    backgroundColor: color.bg.surface,
    borderRadius: radius.sm,
    padding: spacing[12],
    marginBottom: spacing[8],
    borderWidth: 1,
    borderColor: color.line.subtle,
    ...shadow.soft,
  },
  deletedCard: {
    backgroundColor: color.bg.subtle,
    borderColor: color.line.default,
  },
  inactiveCard: {
    backgroundColor: color.bg.subtle,
  },
  thumbnailBox: {
    marginRight: spacing[12],
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: radius.xs,
    backgroundColor: color.line.subtle,
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
    borderRadius: radius.xs,
    backgroundColor: color.brand.blueLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailPlaceholderDimmed: {
    backgroundColor: color.line.subtle,
    opacity: 0.6,
  },
  thumbnailPlaceholderText: {
    fontSize: typography.size.sectionTitle,
    fontWeight: typography.weight.bold,
    color: color.brand.blue,
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
    fontSize: typography.size.body,
    fontWeight: typography.weight.semiBold,
    color: color.text.primary,
    lineHeight: 20,
  },
  titleDimmed: {
    color: color.text.tertiary,
  },
  titleDeleted: {
    color: color.text.tertiary,
    textDecorationLine: 'line-through',
  },
  deletedBadge: {
    backgroundColor: color.state.errorLight,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.xs,
    flexShrink: 0,
  },
  deletedBadgeText: {
    fontSize: typography.size.micro,
    fontWeight: typography.weight.bold,
    color: color.state.error,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing[4],
  },
  categoryTag: {
    backgroundColor: color.brand.greenLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  categoryTagText: {
    fontSize: typography.size.micro,
    color: color.brand.greenDark,
    fontWeight: typography.weight.semiBold,
  },
  regionText: {
    fontSize: typography.size.caption,
    color: color.text.tertiary,
  },
  price: {
    fontSize: typography.size.bodySmall,
    fontWeight: typography.weight.bold,
    color: color.state.success,
    marginBottom: 3,
  },
  priceDimmed: {
    color: color.text.tertiary,
  },
  priceDeleted: {
    fontSize: typography.size.bodySmall,
    fontWeight: typography.weight.bold,
    color: color.neutral[300],
    marginBottom: 3,
  },
  viewedAt: {
    fontSize: typography.size.micro,
    color: color.neutral[300],
  },
});
