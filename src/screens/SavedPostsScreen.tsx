import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ScreenContainer from '../components/ScreenContainer';
import { PostCard } from '../components/PostCard';
import { RootStackParamList } from '../navigation/RootNavigator';
import { fetchSavedPosts, PostWithMeta } from '../services/userContentService';
import { useUserStore } from '../store/userStore';
import { isPostDeleted } from '../constants/postStatus';
import { color, radius, typography } from '../theme/tokens';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

function DeletedPostCard({ item }: { item: PostWithMeta }) {
  return (
    <View style={styles.deletedCard}>
      <Text style={styles.deletedTitle} numberOfLines={1}>
        {item.snapshot.title}
      </Text>
      <Text style={styles.deletedBadge}>삭제된 게시글</Text>
      <Text style={styles.deletedMeta}>저장일 {formatDate(item.timestamp)}</Text>
    </View>
  );
}

export default function SavedPostsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useUserStore();
  const [items, setItems] = useState<PostWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const data = await fetchSavedPosts(user.id);
      setItems(data);
    } catch (e) {
      console.error('Failed to load saved posts', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (!user) {
    return (
      <ScreenContainer>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔖</Text>
          <Text style={styles.emptyText}>로그인 후 저장된 게시글을 확인할 수 있습니다.</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {loading ? (
        <ActivityIndicator size="large" color={color.brand.green} style={styles.loader} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.postId}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          renderItem={({ item }) =>
            item.deleted || !item.post || isPostDeleted(item.post) ? (
              <DeletedPostCard item={item} />
            ) : (
              <PostCard
                post={item.post}
                onPress={(post) => navigation.navigate('PostDetail', { post })}
              />
            )
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔖</Text>
              <Text style={styles.emptyText}>저장한 게시글이 없습니다.</Text>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: 60,
  },
  list: {
    paddingBottom: 24,
  },
  empty: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: typography.size.body,
    color: color.text.tertiary,
    textAlign: 'center',
  },
  deletedCard: {
    backgroundColor: color.bg.subtle,
    borderRadius: radius.sm,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: color.line.default,
  },
  deletedTitle: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semiBold,
    color: color.text.tertiary,
    marginBottom: 6,
    textDecorationLine: 'line-through',
  },
  deletedBadge: {
    fontSize: typography.size.caption,
    color: color.state.error,
    marginBottom: 4,
  },
  deletedMeta: {
    fontSize: typography.size.caption,
    color: color.line.default,
  },
});
