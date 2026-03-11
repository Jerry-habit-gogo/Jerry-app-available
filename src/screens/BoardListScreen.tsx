import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import { PostCard } from '../components/PostCard';
import { fetchPostsByCategory } from '../services/boardService';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { Post } from '../types';

interface BoardListScreenProps {
    category?: 'jobs' | 'real_estate' | 'marketplace' | 'news' | 'announcements';
    title?: string;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const BoardListScreen: React.FC<BoardListScreenProps> = ({ category, title }) => {
    const navigation = useNavigation<NavigationProp>();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadPosts = async () => {
        try {
            const { posts: fetchedPosts } = await fetchPostsByCategory(category);
            setPosts(fetchedPosts);
        } catch (error) {
            console.error('Failed to load posts:', error);
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
        }, [category])
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
                onPress={() => navigation.navigate('CreatePost', { category })}
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
    listContent: {
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
});
