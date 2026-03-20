import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  PanResponder,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../components/ScreenContainer';
import { SideMenuDrawer, SideMenuItem } from '../components/SideMenuDrawer';
import { HomeSectionHeader } from '../components/home/HomeSectionHeader';
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
  const insets = useSafeAreaInsets();
  const { user, blockedUserIds, unreadNotificationCount } = useUserStore();
  const [dashboard, setDashboard] = useState<HomeDashboardData>(emptyDashboardData);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const swipeResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, { dx, dy }) => dx > 8 && Math.abs(dy) < 50,
      onPanResponderRelease: (_, { dx, vx }) => {
        if (dx > 50 || vx > 0.5) {
          setMenuVisible(true);
        }
      },
    })
  ).current;

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
    <ScreenContainer useSafeArea edges={['bottom']} scrollable={false}>
      <View style={styles.swipeZone} {...swipeResponder.panHandlers} />
      {/* 고정 헤더 */}
      <View style={[styles.appHeader, { paddingTop: insets.top + 8, marginHorizontal: -16, marginTop: -16 }]}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setMenuVisible(true)}
          activeOpacity={0.82}
        >
          <BlurView intensity={80} tint="light" style={styles.glassBg} />
          <Ionicons name="menu-outline" size={24} color={color.text.primary} />
        </TouchableOpacity>

        <Image source={require('../../assets/images/logo.png')} style={styles.headerLogo} resizeMode="contain" />

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
      <View style={styles.headerDivider} />

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
  swipeZone: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 24,
    zIndex: 10,
  },
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: color.bg.surface,
  },
  headerLogo: {
    height: 28,
    width: 100,
  },
  headerDivider: {
    height: 1,
    backgroundColor: color.line.default,
    marginHorizontal: 0,
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
