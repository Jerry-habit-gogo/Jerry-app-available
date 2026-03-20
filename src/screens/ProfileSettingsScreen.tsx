import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Button from '../components/Button';
import ScreenContainer from '../components/ScreenContainer';
import { RootStackParamList } from '../navigation/RootNavigator';
import { signOutCurrentUser } from '../services/authService';
import { isFirebaseConfigured } from '../services/firebase';
import { useUserStore } from '../store/userStore';
import { color, radius, typography } from '../theme/tokens';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileSettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { clearAuthState } = useUserStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  return (
    <ScreenContainer>
      <Text style={styles.title}>설정</Text>
      <View style={styles.section}>
        <Button title="저장한 게시글" onPress={() => navigation.navigate('SavedPosts')} variant="outline" />
        <Button title="최근 본 게시글" onPress={() => navigation.navigate('RecentlyViewed')} variant="outline" />
        <Button title="차단 목록" onPress={() => navigation.navigate('BlockedUsers')} variant="outline" />
        <Button title="로그아웃" onPress={handleLogout} isLoading={isLoggingOut} variant="outline" />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: typography.size.screenTitle,
    fontWeight: typography.weight.bold,
    marginBottom: 8,
    color: color.text.primary,
  },
  section: {
    marginTop: 16,
    backgroundColor: color.bg.surface,
    borderRadius: radius.lg,
    padding: 20,
  },
});
