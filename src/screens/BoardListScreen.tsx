import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import PostFilters from '../components/PostFilters';
import { PostCard } from '../components/PostCard';
import SearchBar from '../components/SearchBar';
import { fetchPosts } from '../services/boardService';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { Post, PostFilterOptions } from '../types';
import { useUserStore } from '../store/userStore';
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

interface BoardListScreenProps {
    category?: 'jobs' | 'real_estate' | 'marketplace' | 'news' | 'announcements';
    title?: string;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const BoardListScreen: React.FC<BoardListScreenProps> = ({ category, title }) => {
    const navigation = useNavigation<NavigationProp>();
    const { user, blockedUserIds } = useUserStore();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | undefined>(undefined);
    const [hasMore, setHasMore] = useState(false);
    const [filters, setFilters] = useState<PostFilterOptions>({
        category,
        sortBy: 'latest',
    });

    useEffect(() => {
        setFilters((prev) => ({
            ...prev,
            category,
            jobType: category === 'jobs' ? prev.jobType : undefined,
            realEstateType: category === 'real_estate' ? prev.realEstateType : undefined,
            marketplaceCondition: category === 'marketplace' ? prev.marketplaceCondition : undefined,
        }));
    }, [category]);

    const PAGE_SIZE = 20;

    const filterBlocked = (items: Post[]) =>
        blockedUserIds.length > 0
            ? items.filter((p) => !blockedUserIds.includes(p.authorId))
            : items;

    const loadPosts = async () => {
        try {
            const { posts: fetchedPosts, lastVisible: newLastVisible } = await fetchPosts(
                { ...filters, category },
                PAGE_SIZE
            );
            const visible = filterBlocked(fetchedPosts);
            setPosts(visible);
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
            const visible = filterBlocked(morePosts);
            setPosts((prev) => [...prev, ...visible]);
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
                    <ActivityIndicator size="large" color="#3b82f6" />
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
                    ListFooterComponent={
                        loadingMore ? (
                            <ActivityIndicator size="small" color="#3b82f6" style={styles.footerLoader} />
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
                            colors={['#3b82f6']}
                        />
                    }
                />
            )}
            {/* Floating Action Button (FAB) for Creating Post */}
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
        </ScreenContainer>
    );
};

const styles = StyleSheet.create({
    header: {
        marginBottom: 16,
        paddingHorizontal: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111',
    },
    controls: {
        paddingHorizontal: 16,
        paddingBottom: 4,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 80, // Extra padding for FAB
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: '#888',
        fontSize: 16,
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
        backgroundColor: '#3b82f6',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    fabText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footerLoader: {
        paddingVertical: 16,
    },
});
