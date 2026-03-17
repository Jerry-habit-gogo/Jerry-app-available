import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ScreenContainer from '../components/ScreenContainer';
import { HomeSectionHeader } from '../components/home/HomeSectionHeader';
import { HomeCategoryCard } from '../components/home/HomeCategoryCard';
import { HomeCompactPostCard } from '../components/home/HomeCompactPostCard';
import { HomeContinueCard } from '../components/home/HomeContinueCard';
import { RootStackParamList } from '../navigation/RootNavigator';
import {
  fetchHomeDashboardData,
  HOME_REGION_OPTIONS,
  HomeDashboardData,
  HomeRegion,
} from '../services/homeService';
import { useUserStore } from '../store/userStore';
import { Post } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const QUICK_ACCESS_ITEMS = [
  { key: 'jobs', label: 'Jobs', description: '일자리와 채용 공고를 확인하세요', icon: '💼', accent: '#E0ECFF' },
  { key: 'real_estate', label: 'Real Estate', description: '집, 방, 렌트 정보를 살펴보세요', icon: '🏠', accent: '#DCFCE7' },
  { key: 'marketplace', label: 'Marketplace', description: '중고 물품과 생활 거래를 찾으세요', icon: '🛍️', accent: '#FEF3C7' },
  { key: 'news', label: 'News', description: '지역 소식과 업데이트를 빠르게 확인하세요', icon: '📰', accent: '#FCE7F3' },
  { key: 'announcements', label: 'Announcements', description: '공지와 필수 안내를 한눈에 확인하세요', icon: '📌', accent: '#EDE9FE' },
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
  const [selectedRegion, setSelectedRegion] = useState<HomeRegion>('All');
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const removeBlocked = useCallback(
    (posts: Post[]) =>
      blockedUserIds.length > 0
        ? posts.filter((post) => !blockedUserIds.includes(post.authorId))
        : posts,
    [blockedUserIds]
  );

  const loadDashboard = useCallback(async () => {
    try {
      const data = await fetchHomeDashboardData(user?.id, selectedRegion);
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
  }, [blockedUserIds, removeBlocked, selectedRegion, user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  const openRegionPicker = () => {
    Alert.alert(
      '지역 선택',
      '홈에서 우선 볼 지역을 선택하세요.',
      [
        ...HOME_REGION_OPTIONS.map((option) => ({
          text: option === 'All' ? '전체 지역' : option,
          onPress: () => {
            setLoading(true);
            setSelectedRegion(option);
          },
        })),
        { text: '취소', style: 'cancel' as const },
      ]
    );
  };

  const handleSearchSubmit = () => {
    const trimmed = searchText.trim();
    navigation.navigate('Browse', {
      title: trimmed ? `"${trimmed}" 검색 결과` : '전체 게시글',
      initialFilters: {
        searchText: trimmed || undefined,
        region: selectedRegion === 'All' ? undefined : selectedRegion,
        sortBy: 'latest',
      },
    });
  };

  const openCategory = (category: Post['category']) => {
    navigation.navigate('Browse', {
      title: categoryTitles[category],
      category,
      initialFilters: {
        category,
        region: selectedRegion === 'All' ? undefined : selectedRegion,
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
        region: selectedRegion === 'All' ? undefined : selectedRegion,
        sortBy: 'latest',
      },
    });
  };

  const recommendationSubtitle = useMemo(() => {
    if (!user) return '로그인하면 최근 활동을 바탕으로 더 맞는 추천을 보여드립니다.';
    if (selectedRegion !== 'All') return `${selectedRegion} 중심으로 맞춤 추천을 보여드려요.`;
    return '최근 본 글과 저장한 글을 바탕으로 맞춤 추천을 모았습니다.';
  }, [selectedRegion, user]);

  const handleLoginPrompt = () => navigation.navigate('Auth');

  return (
    <ScreenContainer useSafeArea scrollable={false}>
      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#2563EB" />
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
              tintColor="#2563EB"
            />
          }
        >
          <View style={styles.hero}>
            <View style={styles.heroGlow} />
            <View style={styles.topBar}>
              <View>
                <Text style={styles.greeting}>
                  {user?.displayName ? `${user.displayName}님을 위한 Jerry` : 'Jerry 서비스 홈'}
                </Text>
                <Text style={styles.subtitle}>오늘 필요한 정보와 서비스만 빠르게 확인하세요.</Text>
              </View>
              <TouchableOpacity
                style={styles.notificationButton}
                onPress={() => navigation.navigate('Notifications')}
                activeOpacity={0.82}
              >
                <Text style={styles.notificationIcon}>🔔</Text>
                {unreadNotificationCount > 0 ? (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            </View>

            <View style={styles.searchRow}>
              <View style={styles.searchBox}>
                <TextInput
                  value={searchText}
                  onChangeText={setSearchText}
                  onSubmitEditing={handleSearchSubmit}
                  placeholder="찾고 싶은 글이나 서비스를 검색하세요"
                  placeholderTextColor="#9CA3AF"
                  style={styles.searchInput}
                  returnKeyType="search"
                />
              </View>
              <TouchableOpacity style={styles.regionButton} onPress={openRegionPicker} activeOpacity={0.82}>
                <Text style={styles.regionLabel}>{selectedRegion === 'All' ? '전체 지역' : selectedRegion}</Text>
              </TouchableOpacity>
            </View>
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

          <View style={styles.section}>
            <HomeSectionHeader title="Pinned Announcements" actionLabel="전체보기" onPressAction={() => navigation.navigate('Announcements')} />
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
            <HomeSectionHeader title="News Summary" actionLabel="전체보기" onPressAction={() => navigation.navigate('News')} />
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
        </ScrollView>
      )}
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
  hero: {
    backgroundColor: '#F8FBFF',
    borderRadius: 28,
    padding: 20,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5EEF8',
  },
  heroGlow: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#DCEBFF',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    maxWidth: 260,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  notificationIcon: {
    fontSize: 18,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 10,
    paddingHorizontal: 16,
  },
  searchInput: {
    minHeight: 52,
    fontSize: 15,
    color: '#111827',
  },
  regionButton: {
    minHeight: 52,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  regionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
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
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginTop: 8,
    marginBottom: 8,
  },
  loginPrompt: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 18,
  },
  loginPromptTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  loginPromptText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#6B7280',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 18,
  },
  emptyCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  emptyCardText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#6B7280',
  },
  announcementRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 10,
  },
  announcementTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#EEF2FF',
    color: '#4338CA',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 10,
  },
  announcementTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 20,
    marginBottom: 6,
  },
  announcementMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
  newsRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 10,
  },
  newsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 20,
    marginBottom: 6,
  },
  newsMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
});
