import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import { PostCard } from '../components/PostCard';
import ScreenContainer from '../components/ScreenContainer';
import { RootStackParamList } from '../navigation/RootNavigator';
import { fetchPostsByAuthor } from '../services/boardService';
import { isFirebaseConfigured } from '../services/firebase';
import { getUserProfile } from '../services/profileService';
import { useUserStore } from '../store/userStore';
import { Post } from '../types';
import { color, radius, typography } from '../theme/tokens';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user, setUser } = useUserStore();
  const userId = user?.id;
  const [posts, setPosts] = useState<Post[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const loadProfileData = useCallback(async () => {
    if (!userId) {
      setPosts([]);
      setIsLoadingProfile(false);
      setIsRefreshing(false);
      return;
    }

    setIsLoadingProfile(true);
    try {
      if (isFirebaseConfigured) {
        const profile = await getUserProfile(userId);
        if (
          profile &&
          (
            user?.id !== profile.id ||
            user.displayName !== profile.displayName ||
            user.email !== profile.email ||
            user.photoUrl !== profile.photoUrl ||
            user.bio !== profile.bio
          )
        ) {
          setUser(profile);
        }
      }

      const authoredPosts = await fetchPostsByAuthor(userId);
      setPosts(authoredPosts);
    } catch (error) {
      console.error('Failed to load profile', error);
    } finally {
      setIsLoadingProfile(false);
      setIsRefreshing(false);
    }
  }, [setUser, user?.bio, user?.displayName, user?.email, user?.id, user?.photoUrl, userId]);

  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [loadProfileData])
  );

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
              <Pressable
                onPress={() => navigation.navigate('EditProfile')}
                style={styles.avatarPressable}
                accessibilityRole="button"
                accessibilityLabel="프로필 사진 변경"
              >
                {user.photoUrl ? (
                  <Image source={{ uri: user.photoUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Text style={styles.avatarText}>
                      {(user.displayName || user.email || 'J').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.avatarEditBadge}>
                  <Ionicons name="camera" size={13} color={color.text.inverse} />
                </View>
              </Pressable>

              <View style={styles.headerMeta}>
                <Text style={styles.subtitle}>{user.displayName || '회원'}</Text>
                <Text style={styles.meta}>{user.email}</Text>
                <Text style={styles.bio}>{user.bio || '아직 소개글이 없습니다.'}</Text>
              </View>
            </View>
            <Button
              title="설정"
              onPress={() => navigation.navigate('ProfileSettings')}
              rightIcon={<Ionicons name="chevron-forward" size={18} color={color.text.inverse} />}
            />
          </View>

          <View style={styles.postsSection}>
            <Text style={styles.sectionTitle}>내가 작성한 글</Text>
            {isLoadingProfile ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={color.brand.green} />
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
  title: { fontSize: typography.size.screenTitle, fontWeight: typography.weight.bold, marginBottom: 8, color: color.text.primary },
  content: {
    marginTop: 16,
    backgroundColor: color.bg.surface,
    borderRadius: radius.lg,
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
  avatarPressable: {
    position: 'relative',
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: color.line.default,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.brand.green,
  },
  avatarText: {
    color: color.text.inverse,
    fontSize: 28,
    fontWeight: typography.weight.bold,
  },
  avatarEditBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.brand.green,
    borderWidth: 2,
    borderColor: color.bg.surface,
  },
  subtitle: { fontSize: typography.size.sectionTitle, color: color.text.primary, fontWeight: typography.weight.bold, marginBottom: 6 },
  meta: { fontSize: typography.size.bodySmall, color: color.text.secondary, marginBottom: 8 },
  bio: { fontSize: typography.size.bodySmall, color: color.text.secondary, lineHeight: 20 },
  postsSection: {
    flex: 1,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: typography.size.sectionTitle,
    fontWeight: typography.weight.bold,
    color: color.text.primary,
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
    fontSize: typography.size.bodySmall,
    color: color.text.secondary,
    paddingVertical: 24,
    textAlign: 'center',
  },
});
