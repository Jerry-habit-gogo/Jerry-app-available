import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../components/ScreenContainer';
import { SideMenuDrawer, SideMenuItem } from '../components/SideMenuDrawer';
import { HomeSectionHeader } from '../components/home/HomeSectionHeader';
import { HomeCategoryCard } from '../components/home/HomeCategoryCard';
import { HomeCompactPostCard } from '../components/home/HomeCompactPostCard';
import { HomeContinueCard } from '../components/home/HomeContinueCard';
import { HomeAdSlot } from '../components/home/HomeAdSlot';
import { RootStackParamList } from '../navigation/RootNavigator';
import {
  fetchHomeDashboardData,
  HomeDashboardData,
} from '../services/homeService';
import { useUserStore } from '../store/userStore';
import { Post } from '../types';
import { color, radius, typography } from '../theme/tokens';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const QUICK_ACCESS_ITEMS = [
  { key: 'jobs', label: 'Jobs', description: '일자리와 채용 공고를 확인하세요', icon: '💼', accent: color.brand.blueLight },
  { key: 'real_estate', label: 'Real Estate', description: '집, 방, 렌트 정보를 살펴보세요', icon: '🏠', accent: color.brand.greenLight },
  { key: 'marketplace', label: 'Marketplace', description: '중고 물품과 생활 거래를 찾으세요', icon: '🛍️', accent: color.brand.sandLight },
  { key: 'news', label: 'News', description: '지역 소식과 업데이트를 빠르게 확인하세요', icon: '📰', accent: color.state.errorLight },
  { key: 'announcements', label: 'Announcements', description: '공지와 필수 안내를 한눈에 확인하세요', icon: '📌', accent: color.state.warningLight },
] as const;

const categoryTitles: Record<string, string> = {
  jobs: '구인구직',
  real_estate: '부동산',
  marketplace: '중고장터',
  news: '뉴스',
  announcements: '공지사항',
};

const emptyDashboardData: HomeDashboardData = {
  latestJobs: [],
  latestRealEstate: [],
  popularMarketplace: [],
  pinnedAnnouncements: [],
  newsSummary: [],
  recommendations: [],
  recentlyViewed: [],
  savedPosts: [],
};

export default function HomeDashboardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user, blockedUserIds, unreadNotificationCount } = useUserStore();
  const [dashboard, setDashboard] = useState<HomeDashboardData>(emptyDashboardData);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const removeBlocked = useCallback(
    (posts: Post[]) =>
      blockedUserIds.length > 0
        ? posts.filter((post) => !blockedUserIds.includes(post.authorId))
        : posts,
    [blockedUserIds]
  );

  const loadDashboard = useCallback(async () => {
    try {
      const data = await fetchHomeDashboardData(user?.id, 'All');
      setDashboard({
        latestJobs: removeBlocked(data.latestJobs),
        latestRealEstate: removeBlocked(data.latestRealEstate),
        popularMarketplace: removeBlocked(data.popularMarketplace),
        pinnedAnnouncements: removeBlocked(data.pinnedAnnouncements),
        newsSummary: removeBlocked(data.newsSummary),
        recommendations: removeBlocked(data.recommendations),
        recentlyViewed: data.recentlyViewed.filter((item) => !item.post || !blockedUserIds.includes(item.post.authorId)),
        savedPosts: data.savedPosts.filter((item) => !item.post || !blockedUserIds.includes(item.post.authorId)),
      });
    } catch (error) {
      console.error('Failed to load home dashboard', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [blockedUserIds, removeBlocked, user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  const openCategory = (category: Post['category']) => {
    navigation.navigate('Browse', {
      title: categoryTitles[category],
      category,
      initialFilters: {
        category,
        sortBy: 'latest',
      },
    });
  };

  const openPost = (post: Post) => navigation.navigate('PostDetail', { post });

  const openSection = (title: string, category?: Post['category']) => {
    navigation.navigate('Browse', {
      title,
      category,
      initialFilters: {
        category,
        sortBy: 'latest',
      },
    });
  };

  const recommendationSubtitle = useMemo(() => {
    if (!user) return '로그인하면 최근 활동을 바탕으로 더 맞는 추천을 보여드립니다.';
    return '최근 본 글과 저장한 글을 바탕으로 맞춤 추천을 모았습니다.';
  }, [user]);

  const handleLoginPrompt = () => navigation.navigate('Auth');

  const menuItems: SideMenuItem[] = [
    { label: '구인구직', onPress: () => openSection('구인구직', 'jobs') },
    { label: '부동산', onPress: () => openSection('부동산', 'real_estate') },
    { label: '중고장터', onPress: () => openSection('중고장터', 'marketplace') },
    { label: '뉴스', onPress: () => navigation.navigate('News') },
    { label: '새 소식', onPress: () => navigation.navigate('Announcements') },
    { label: '디자인', onPress: () => navigation.navigate('DesignPreview') },
  ];

  return (
    <ScreenContainer useSafeArea scrollable={false}>
      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={color.brand.green} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadDashboard();
              }}
              tintColor={color.brand.green}
            />
          }
        >
          <View style={styles.appHeader}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setMenuVisible(true)}
              activeOpacity={0.82}
            >
              <BlurView intensity={80} tint="light" style={styles.glassBg} />
              <Ionicons name="menu-outline" size={24} color={color.text.primary} />
            </TouchableOpacity>

            <View style={styles.appHeaderRight}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => navigation.navigate('Notifications')}
                activeOpacity={0.82}
              >
                <BlurView intensity={80} tint="light" style={styles.glassBg} />
                <Ionicons name="notifications-outline" size={22} color={color.text.primary} />
                {unreadNotificationCount > 0 ? (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.hero}>
            <View style={styles.heroGlow} />
            <View style={styles.heroCopy}>
              <Text style={styles.greeting}>
                {user?.displayName ? `${user.displayName}님을 위한 Jerry` : 'Jerry 서비스 홈'}
              </Text>
              <Text style={styles.subtitle}>오늘 필요한 정보와 서비스만 빠르게 확인하세요.</Text>
            </View>
          </View>

          <View style={styles.section}>
            <HomeAdSlot />
          </View>

          <View style={styles.section}>
            <HomeSectionHeader title="News" actionLabel="전체보기" onPressAction={() => navigation.navigate('News')} />
            {dashboard.newsSummary.length > 0 ? (
              dashboard.newsSummary.map((post) => (
                <TouchableOpacity key={post.id} style={styles.newsRow} onPress={() => openPost(post)} activeOpacity={0.82}>
                  <Text style={styles.newsTitle} numberOfLines={2}>{post.title}</Text>
                  <Text style={styles.newsMeta} numberOfLines={1}>
                    {[post.region, `${post.viewCount} views`].filter(Boolean).join(' · ')}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyCardTitle}>새로운 뉴스가 없습니다</Text>
                <Text style={styles.emptyCardText}>지역 소식이 올라오면 요약 형태로 모아드립니다.</Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <HomeSectionHeader title="새 소식" actionLabel="전체보기" onPressAction={() => navigation.navigate('Announcements')} />
            {dashboard.pinnedAnnouncements.length > 0 ? (
              dashboard.pinnedAnnouncements.map((post) => (
                <TouchableOpacity key={post.id} style={styles.announcementRow} onPress={() => openPost(post)} activeOpacity={0.82}>
                  <Text style={styles.announcementTag}>공지</Text>
                  <Text style={styles.announcementTitle} numberOfLines={2}>{post.title}</Text>
                  <Text style={styles.announcementMeta} numberOfLines={1}>
                    {[post.region, post.authorName].filter(Boolean).join(' · ')}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyCardTitle}>등록된 공지가 없습니다</Text>
                <Text style={styles.emptyCardText}>중요 공지가 올라오면 이곳에서 먼저 보여드립니다.</Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <HomeSectionHeader title="Quick Access" subtitle="자주 찾는 서비스를 바로 열어보세요." />
            <View style={styles.quickGrid}>
              {QUICK_ACCESS_ITEMS.map((item) => (
                <HomeCategoryCard
                  key={item.key}
                  label={item.label}
                  description={item.description}
                  icon={item.icon}
                  accent={item.accent}
                  onPress={() => openCategory(item.key)}
                />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <HomeSectionHeader
              title="Continue Browsing"
              subtitle="최근 확인한 정보와 저장한 글을 이어서 보세요."
            />
            {user ? (
              <>
                <View style={styles.continueRow}>
                  <HomeContinueCard
                    title="최근 본 글"
                    count={dashboard.recentlyViewed.length}
                    icon="🕘"
                    description="최근 살펴본 게시글을 이어서 확인하세요."
                    onPress={() => navigation.navigate('RecentlyViewed')}
                  />
                  <View style={styles.rowSpacer} />
                  <HomeContinueCard
                    title="저장한 글"
                    count={dashboard.savedPosts.length}
                    icon="🔖"
                    description="나중에 보려고 저장한 글을 빠르게 모아봤어요."
                    onPress={() => navigation.navigate('SavedPosts')}
                  />
                </View>
                {dashboard.recentlyViewed.length > 0 ? (
                  <>
                    <Text style={styles.previewLabel}>최근 본 글</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rail}>
                      {dashboard.recentlyViewed
                        .map((item) => item.post)
                        .filter((post): post is Post => !!post)
                        .map((post) => (
                          <HomeCompactPostCard key={post.id} post={post} onPress={openPost} compact />
                        ))}
                    </ScrollView>
                  </>
                ) : null}
                {dashboard.savedPosts.length > 0 ? (
                  <>
                    <Text style={styles.previewLabel}>저장한 글</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rail}>
                      {dashboard.savedPosts
                        .map((item) => item.post)
                        .filter((post): post is Post => !!post)
                        .map((post) => (
                          <HomeCompactPostCard key={post.id} post={post} onPress={openPost} compact />
                        ))}
                    </ScrollView>
                  </>
                ) : null}
              </>
            ) : (
              <TouchableOpacity style={styles.loginPrompt} onPress={handleLoginPrompt} activeOpacity={0.85}>
                <Text style={styles.loginPromptTitle}>로그인하고 이어보기 기능을 사용하세요</Text>
                <Text style={styles.loginPromptText}>
                  최근 본 글, 저장한 글, 맞춤 추천을 홈에서 바로 확인할 수 있습니다.
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.section}>
            <HomeSectionHeader title="Recommended for You" subtitle={recommendationSubtitle} />
            {!user ? (
              <TouchableOpacity style={styles.loginPrompt} onPress={handleLoginPrompt} activeOpacity={0.85}>
                <Text style={styles.loginPromptTitle}>로그인하면 맞춤 추천이 활성화됩니다</Text>
                <Text style={styles.loginPromptText}>
                  최근 본 글과 저장한 글을 바탕으로 홈 추천을 더 정확하게 구성합니다.
                </Text>
              </TouchableOpacity>
            ) : dashboard.recommendations.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {dashboard.recommendations.map((post) => (
                  <HomeCompactPostCard key={post.id} post={post} onPress={openPost} />
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyCardTitle}>추천을 준비하는 중입니다</Text>
                <Text style={styles.emptyCardText}>
                  글을 둘러보거나 저장하면 홈 추천이 더 정교해집니다.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <HomeSectionHeader title="Latest Jobs" actionLabel="더보기" onPressAction={() => openSection('구인구직', 'jobs')} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {dashboard.latestJobs.map((post) => (
                <HomeCompactPostCard key={post.id} post={post} onPress={openPost} compact />
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <HomeSectionHeader title="Latest Real Estate" actionLabel="더보기" onPressAction={() => openSection('부동산', 'real_estate')} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {dashboard.latestRealEstate.map((post) => (
                <HomeCompactPostCard key={post.id} post={post} onPress={openPost} compact />
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <HomeSectionHeader title="Popular Marketplace" actionLabel="더보기" onPressAction={() => openSection('중고장터', 'marketplace')} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {dashboard.popularMarketplace.map((post) => (
                <HomeCompactPostCard key={post.id} post={post} onPress={openPost} compact />
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      )}
      <SideMenuDrawer
        visible={menuVisible}
        title="메뉴"
        items={menuItems}
        onClose={() => setMenuVisible(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingBottom: 40,
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  appHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hero: {
    backgroundColor: color.bg.subtle,
    borderRadius: radius.xl,
    padding: 20,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: color.line.default,
  },
  heroGlow: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: color.brand.greenLight,
  },
  heroCopy: {
    paddingRight: 52,
  },
  greeting: {
    fontSize: typography.size.display,
    fontWeight: typography.weight.extraBold,
    color: color.text.primary,
    marginBottom: 6,
    lineHeight: 34,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: color.line.default,
  },
  glassBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  subtitle: {
    fontSize: typography.size.bodySmall,
    color: color.text.secondary,
    lineHeight: 20,
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: color.state.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  notificationBadgeText: {
    fontSize: 9,
    fontWeight: typography.weight.bold,
    color: color.text.inverse,
  },
  section: {
    marginBottom: 28,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  continueRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  rowSpacer: {
    width: 12,
  },
  rail: {
    marginTop: 4,
    marginBottom: 6,
  },
  previewLabel: {
    fontSize: typography.size.bodySmall,
    fontWeight: typography.weight.bold,
    color: color.text.secondary,
    marginTop: 8,
    marginBottom: 8,
  },
  loginPrompt: {
    backgroundColor: color.bg.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.line.default,
    padding: 18,
  },
  loginPromptTitle: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.bold,
    color: color.text.primary,
    marginBottom: 6,
  },
  loginPromptText: {
    fontSize: typography.size.bodySmall,
    lineHeight: 19,
    color: color.text.secondary,
  },
  emptyCard: {
    backgroundColor: color.bg.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.line.default,
    padding: 18,
  },
  emptyCardTitle: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.bold,
    color: color.text.primary,
    marginBottom: 6,
  },
  emptyCardText: {
    fontSize: typography.size.bodySmall,
    lineHeight: 19,
    color: color.text.secondary,
  },
  announcementRow: {
    backgroundColor: color.bg.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.line.default,
    padding: 16,
    marginBottom: 10,
  },
  announcementTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: color.brand.greenLight,
    color: color.brand.greenDark,
    fontSize: typography.size.micro,
    fontWeight: typography.weight.bold,
    marginBottom: 10,
  },
  announcementTitle: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.bold,
    color: color.text.primary,
    lineHeight: 20,
    marginBottom: 6,
  },
  announcementMeta: {
    fontSize: typography.size.caption,
    color: color.text.secondary,
  },
  newsRow: {
    backgroundColor: color.bg.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.line.default,
    padding: 16,
    marginBottom: 10,
  },
  newsTitle: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.bold,
    color: color.text.primary,
    lineHeight: 20,
    marginBottom: 6,
  },
  newsMeta: {
    fontSize: typography.size.caption,
    color: color.text.secondary,
  },
});
