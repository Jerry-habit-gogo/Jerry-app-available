import React, { useCallback, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Button from '../components/Button';
import { PostCard } from '../components/PostCard';
import ScreenContainer from '../components/ScreenContainer';
import { RootStackParamList } from '../navigation/RootNavigator';
import { fetchPostsByAuthor } from '../services/boardService';
import { signOutCurrentUser } from '../services/authService';
import { isFirebaseConfigured } from '../services/firebase';
import { getUserProfile } from '../services/profileService';
import { useUserStore } from '../store/userStore';
import { Post } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user, clearAuthState, setUser } = useUserStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const loadProfileData = useCallback(async () => {
    if (!user) {
      setPosts([]);
      return;
    }

    setIsLoadingProfile(true);
    try {
      if (isFirebaseConfigured) {
        const profile = await getUserProfile(user.id);
        if (profile) {
          setUser(profile);
        }
      }

      const authoredPosts = await fetchPostsByAuthor(user.id);
      setPosts(authoredPosts);
    } catch (error) {
      console.error('Failed to load profile', error);
    } finally {
      setIsLoadingProfile(false);
      setIsRefreshing(false);
    }
  }, [setUser, user]);

  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [loadProfileData])
  );

  const handleLogout = async () => {
    if (!isFirebaseConfigured) {
      clearAuthState();
      return;
    }

    setIsLoggingOut(true);
    try {
      await signOutCurrentUser();
    } catch (error) {
      console.error('Failed to sign out', error);
      Alert.alert('오류', '로그아웃에 실패했습니다.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadProfileData();
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>내 계정</Text>
      {user ? (
        <>
          <View style={styles.content}>
            <View style={styles.headerRow}>
              {user.photoUrl ? (
                <Image source={{ uri: user.photoUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>
                    {(user.displayName || user.email || 'J').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}

              <View style={styles.headerMeta}>
                <Text style={styles.subtitle}>{user.displayName || '회원'}</Text>
                <Text style={styles.meta}>{user.email}</Text>
                <Text style={styles.bio}>{user.bio || '아직 소개글이 없습니다.'}</Text>
              </View>
            </View>

            <Button title="프로필 수정" onPress={() => navigation.navigate('EditProfile')} />
            <Button title="로그아웃" onPress={handleLogout} isLoading={isLoggingOut} variant="outline" />
          </View>

          <View style={styles.postsSection}>
            <Text style={styles.sectionTitle}>내가 작성한 글</Text>
            {isLoadingProfile ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
              </View>
            ) : (
              <FlatList
                data={posts}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <PostCard post={item} onPress={(post) => navigation.navigate('PostDetail', { post })} />
                )}
                refreshControl={
                  <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
                }
                ListEmptyComponent={
                  <Text style={styles.emptyText}>작성한 게시글이 없습니다.</Text>
                }
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.postsList}
              />
            )}
          </View>
        </>
      ) : (
        <View style={styles.content}>
          <Text style={styles.subtitle}>로그인 후 글쓰기와 댓글 작성이 가능합니다.</Text>
          <Button title="로그인 / 회원가입" onPress={() => navigation.navigate('Auth')} />
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: '#333' },
  content: {
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  headerMeta: {
    flex: 1,
    marginLeft: 16,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#E5E7EB',
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
  },
  avatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: { fontSize: 20, color: '#333', fontWeight: '700', marginBottom: 6 },
  meta: { fontSize: 14, color: '#666', marginBottom: 8 },
  bio: { fontSize: 14, color: '#444', lineHeight: 20 },
  postsSection: {
    flex: 1,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 12,
  },
  postsList: {
    paddingBottom: 24,
  },
  loadingContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    paddingVertical: 24,
    textAlign: 'center',
  },
});
