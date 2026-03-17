import { fetchPosts } from './boardService';
import { fetchRecentlyViewed, fetchSavedPosts, PostWithMeta } from './userContentService';
import { Post } from '../types';
import { isPostDeleted } from '../constants/postStatus';

export const HOME_REGION_OPTIONS = ['All', 'Sydney', 'Strathfield', 'Chatswood'] as const;
export type HomeRegion = (typeof HOME_REGION_OPTIONS)[number];

export interface HomeDashboardData {
  latestJobs: Post[];
  latestRealEstate: Post[];
  popularMarketplace: Post[];
  pinnedAnnouncements: Post[];
  newsSummary: Post[];
  recommendations: Post[];
  recentlyViewed: PostWithMeta[];
  savedPosts: PostWithMeta[];
}

const compactPosts = (posts: Post[], count: number) => posts.slice(0, count);

const uniquePosts = (posts: Post[]): Post[] => {
  const seen = new Set<string>();
  return posts.filter((post) => {
    if (seen.has(post.id)) return false;
    seen.add(post.id);
    return true;
  });
};

const filterDeleted = (posts: Post[]) => posts.filter((post) => !isPostDeleted(post));

const scoreMarketplace = (post: Post) => post.likeCount * 3 + post.commentCount * 2 + post.viewCount;

const getInteractionSignals = (items: PostWithMeta[]) => {
  const categoryScore = new Map<Post['category'], number>();
  const regionScore = new Map<string, number>();

  items.forEach((item, index) => {
    const post = item.post;
    if (!post || isPostDeleted(post)) return;

    const weight = Math.max(1, 6 - index);
    categoryScore.set(post.category, (categoryScore.get(post.category) ?? 0) + weight);
    if (post.region) {
      regionScore.set(post.region, (regionScore.get(post.region) ?? 0) + weight);
    }
  });

  const topCategory = [...categoryScore.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const topRegion = [...regionScore.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

  return { topCategory, topRegion };
};

export const fetchHomeDashboardData = async (
  userId?: string,
  region?: string
): Promise<HomeDashboardData> => {
  const regionFilter = region && region !== 'All' ? region : undefined;

  const [
    latestJobsResult,
    latestRealEstateResult,
    marketplaceResult,
    announcementsResult,
    newsResult,
    genericResult,
    recentlyViewed,
    savedPosts,
  ] = await Promise.all([
    fetchPosts({ category: 'jobs', region: regionFilter, sortBy: 'latest' }, 6),
    fetchPosts({ category: 'real_estate', region: regionFilter, sortBy: 'latest' }, 6),
    fetchPosts({ category: 'marketplace', region: regionFilter, sortBy: 'latest' }, 12),
    fetchPosts({ category: 'announcements', region: regionFilter, sortBy: 'latest' }, 8),
    fetchPosts({ category: 'news', region: regionFilter, sortBy: 'latest' }, 6),
    fetchPosts({ region: regionFilter, sortBy: 'latest' }, 20),
    userId ? fetchRecentlyViewed(userId) : Promise.resolve([]),
    userId ? fetchSavedPosts(userId) : Promise.resolve([]),
  ]);

  const recentCurrent = recentlyViewed.filter((item) => item.post && !item.deleted);
  const savedCurrent = savedPosts.filter((item) => item.post && !item.deleted);
  const recommendationInputs = [...recentCurrent, ...savedCurrent];
  const { topCategory, topRegion } = getInteractionSignals(recommendationInputs);
  const recommendationPool = filterDeleted(genericResult.posts).filter((post) => {
    if (topCategory && post.category !== topCategory) return false;
    if (topRegion && post.region && post.region !== topRegion) return false;
    return !recentCurrent.some((item) => item.post?.id === post.id)
      && !savedCurrent.some((item) => item.post?.id === post.id)
      && post.category !== 'announcements';
  });

  const fallbackRecommendations = filterDeleted(genericResult.posts).filter(
    (post) =>
      post.category !== 'announcements'
      && !recentCurrent.some((item) => item.post?.id === post.id)
      && !savedCurrent.some((item) => item.post?.id === post.id)
  );

  const pinnedAnnouncements = filterDeleted(announcementsResult.posts)
    .sort((a, b) => Number(b.isPinned) - Number(a.isPinned))
    .slice(0, 3);

  return {
    latestJobs: compactPosts(filterDeleted(latestJobsResult.posts), 4),
    latestRealEstate: compactPosts(filterDeleted(latestRealEstateResult.posts), 4),
    popularMarketplace: compactPosts(
      filterDeleted(marketplaceResult.posts).sort((a, b) => scoreMarketplace(b) - scoreMarketplace(a)),
      4
    ),
    pinnedAnnouncements: pinnedAnnouncements.length > 0
      ? pinnedAnnouncements
      : compactPosts(filterDeleted(announcementsResult.posts), 3),
    newsSummary: compactPosts(filterDeleted(newsResult.posts), 4),
    recommendations: compactPosts(
      uniquePosts(recommendationPool.length > 0 ? recommendationPool : fallbackRecommendations),
      4
    ),
    recentlyViewed: recentCurrent.slice(0, 4),
    savedPosts: savedCurrent.slice(0, 4),
  };
};
