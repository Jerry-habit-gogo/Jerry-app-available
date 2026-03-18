import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ScreenContainer from '../components/ScreenContainer';
import { RecentlyViewedCard } from '../components/RecentlyViewedCard';
import { RootStackParamList } from '../navigation/RootNavigator';
import { fetchRecentlyViewed, PostWithMeta } from '../services/userContentService';
import { useUserStore } from '../store/userStore';
import { color, typography } from '../theme/tokens';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function RecentlyViewedScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useUserStore();
  const [items, setItems] = useState<PostWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Tracks whether the initial load has completed so refocus silently refreshes
  const initialLoadedRef = useRef(false);

  const load = useCallback(
    async (silent = false) => {
      if (!user) {
        setLoading(false);
        return;
      }
      if (!silent) setLoading(true);
      try {
        const data = await fetchRecentlyViewed(user.id);
        setItems(data);
        initialLoadedRef.current = true;
      } catch (e) {
        console.error('Failed to load recently viewed', e);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user]
  );

  // First focus: full spinner. Subsequent focuses: silent background refresh.
  useFocusEffect(
    useCallback(() => {
      load(!initialLoadedRef.current);
    }, [load])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    load(true);
  };

  if (!user) {
    return (
      <ScreenContainer>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🕐</Text>
          <Text style={styles.emptyText}>로그인 후 최근 본 게시글을 확인할 수 있습니다.</Text>
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
          renderItem={({ item }) => (
            <RecentlyViewedCard
              item={item}
              onPress={(post) => navigation.navigate('PostDetail', { post })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🕐</Text>
              <Text style={styles.emptyText}>최근 본 게시글이 없습니다.</Text>
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
    paddingHorizontal: 16,
    paddingTop: 12,
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
});
