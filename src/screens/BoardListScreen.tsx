import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import PostFilters from '../components/PostFilters';
import { PostCard } from '../components/PostCard';
import SearchBar from '../components/SearchBar';
import { fetchPinnedPosts, fetchPosts } from '../services/boardService';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { Post, PostFilterOptions } from '../types';
import { useUserStore } from '../store/userStore';
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { color, radius, shadow, typography } from '../theme/tokens';

interface BoardListScreenProps {
    category?: 'jobs' | 'real_estate' | 'marketplace' | 'news' | 'announcements';
    title?: string;
    initialFilters?: Partial<PostFilterOptions>;
    hideCreateButton?: boolean;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const BoardListScreen: React.FC<BoardListScreenProps> = ({
    category,
    title,
    initialFilters,
    hideCreateButton = false,
}) => {
    const navigation = useNavigation<NavigationProp>();
    const { user, blockedUserIds } = useUserStore();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | undefined>(undefined);
    const [hasMore, setHasMore] = useState(false);
    const [pinnedPosts, setPinnedPosts] = useState<Post[]>([]);
    const [pinnedPostIds, setPinnedPostIds] = useState<Set<string>>(new Set());
    const [filters, setFilters] = useState<PostFilterOptions>({
        category,
        sortBy: 'latest',
        ...initialFilters,
    });

    useEffect(() => {
        setFilters({
            category,
            searchText: initialFilters?.searchText,
            sortBy: initialFilters?.sortBy || 'latest',
            region: initialFilters?.region,
            jobType: category === 'jobs' ? initialFilters?.jobType : undefined,
            realEstateType: category === 'real_estate' ? initialFilters?.realEstateType : undefined,
            marketplaceCondition: category === 'marketplace' ? initialFilters?.marketplaceCondition : undefined,
        });
    }, [category, initialFilters]);

    const PAGE_SIZE = 20;

    const filterPosts = (items: Post[]) => {
        let result = items;
        if (blockedUserIds.length > 0) {
            result = result.filter((p) => !blockedUserIds.includes(p.authorId));
        }
        if (pinnedPostIds.size > 0) {
            result = result.filter((p) => !pinnedPostIds.has(p.id));
        }
        return result;
    };

    const loadPosts = async () => {
        try {
            const shouldLoadPinned = category === 'announcements';
            const [{ posts: fetchedPosts, lastVisible: newLastVisible }, pinned] = await Promise.all([
                fetchPosts({ ...filters, category }, PAGE_SIZE),
                shouldLoadPinned ? fetchPinnedPosts() : Promise.resolve([]),
            ]);
            const ids = new Set(pinned.map((p) => p.id));
            setPinnedPosts(pinned);
            setPinnedPostIds(ids);
            setPosts(filterPosts(fetchedPosts));
            setLastVisible(newLastVisible);
            setHasMore(fetchedPosts.length === PAGE_SIZE);
        } catch (error) {
            console.error('Failed to load posts:', error);
        }
    };

    const loadMorePosts = async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        try {
            const { posts: morePosts, lastVisible: newLastVisible } = await fetchPosts(
                { ...filters, category },
                PAGE_SIZE,
                lastVisible
            );
            setPosts((prev) => [...prev, ...filterPosts(morePosts)]);
            setLastVisible(newLastVisible);
            setHasMore(morePosts.length === PAGE_SIZE);
        } catch (error) {
            console.error('Failed to load more posts:', error);
        } finally {
            setLoadingMore(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadPosts();
        setRefreshing(false);
    };

    // Reload posts when screen is focused
    useFocusEffect(
        useCallback(() => {
            loadPosts().finally(() => setLoading(false));
        }, [category, filters])
    );

    const handlePostPress = (post: Post) => {
        navigation.navigate('PostDetail', { post });
    };

    return (
        <ScreenContainer scrollable={false}>
            {title && (
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{title}</Text>
                </View>
            )}

            <View style={styles.controls}>
                <SearchBar
                    value={filters.searchText || ''}
                    onChangeText={(value) => setFilters((prev) => ({ ...prev, searchText: value }))}
                />
                <PostFilters
                    category={category}
                    filters={filters}
                    onChange={setFilters}
                />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={color.brand.green} />
                </View>
            ) : (
                <FlatList
                    data={posts}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <PostCard post={item} onPress={handlePostPress} />
                    )}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    onEndReached={loadMorePosts}
                    onEndReachedThreshold={0.3}
                    ListHeaderComponent={
                        pinnedPosts.length > 0 ? (
                            <View style={styles.pinnedSection}>
                                <View style={styles.pinnedHeader}>
                                    <Text style={styles.pinnedHeaderIcon}>📌</Text>
                                    <Text style={styles.pinnedHeaderText}>고정 게시글</Text>
                                </View>
                                {pinnedPosts.map((post) => (
                                    <PostCard key={post.id} post={post} onPress={handlePostPress} />
                                ))}
                                <View style={styles.pinnedDivider} />
                            </View>
                        ) : null
                    }
                    ListFooterComponent={
                        loadingMore ? (
                            <ActivityIndicator size="small" color={color.brand.green} style={styles.footerLoader} />
                        ) : null
                    }
                    ListEmptyComponent={() => (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>게시글이 없습니다.</Text>
                        </View>
                    )}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={[color.brand.green]}
                        />
                    }
                />
            )}
            {/* Floating Action Button (FAB) for Creating Post */}
            {!hideCreateButton && (
                <TouchableOpacity
                    style={styles.fab}
                    activeOpacity={0.8}
                    onPress={() =>
                        user
                            ? navigation.navigate('CreatePost', { category })
                            : navigation.navigate('Auth')
                    }
                >
                    <Text style={styles.fabText}>+ 글쓰기</Text>
                </TouchableOpacity>
            )}
        </ScreenContainer>
    );
};

const styles = StyleSheet.create({
    header: {
        marginBottom: 16,
        paddingHorizontal: 16,
    },
    headerTitle: {
        fontSize: typography.size.screenTitle,
        fontWeight: typography.weight.bold,
        color: color.text.primary,
    },
    controls: {
        paddingHorizontal: 16,
        paddingBottom: 4,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 80,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: color.text.tertiary,
        fontSize: typography.size.body,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        backgroundColor: color.brand.green,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: radius.full,
        ...shadow.float,
    },
    fabText: {
        color: color.text.inverse,
        fontSize: typography.size.body,
        fontWeight: typography.weight.bold,
    },
    footerLoader: {
        paddingVertical: 16,
    },
    pinnedSection: {
        marginBottom: 4,
    },
    pinnedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 4,
        marginBottom: 8,
        gap: 6,
    },
    pinnedHeaderIcon: {
        fontSize: typography.size.bodySmall,
    },
    pinnedHeaderText: {
        fontSize: typography.size.bodySmall,
        fontWeight: typography.weight.bold,
        color: color.text.secondary,
        letterSpacing: 0.2,
    },
    pinnedDivider: {
        height: 1,
        backgroundColor: color.line.default,
        marginVertical: 12,
    },
});
