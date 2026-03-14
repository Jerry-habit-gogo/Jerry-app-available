import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Button from '../components/Button';
import Input from '../components/Input';
import ScreenContainer from '../components/ScreenContainer';
import { RootStackParamList } from '../navigation/RootNavigator';
import { updateCurrentUserProfile } from '../services/profileService';
import { useUserStore } from '../store/userStore';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

export default function EditProfileScreen({ navigation }: Props) {
  const { user, setUser } = useUserStore();
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPickingImage, setIsPickingImage] = useState(false);

  // Resolved preview: newly picked local image takes priority, else existing URL
  const previewUri = localImageUri ?? user?.photoUrl ?? null;

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('알림', '사진 라이브러리 접근 권한이 필요합니다.');
      return;
    }

    setIsPickingImage(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'] as ImagePicker.MediaType[],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setLocalImageUri(result.assets[0].uri);
      }
    } finally {
      setIsPickingImage(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('알림', '로그인이 필요합니다.');
      return;
    }

    if (!displayName.trim()) {
      Alert.alert('알림', '닉네임을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedProfile = await updateCurrentUserProfile({
        displayName,
        bio,
        // If a local image was picked, upload it; otherwise keep existing URL
        localImageUri: localImageUri ?? undefined,
        photoUrl: localImageUri ? undefined : (user.photoUrl ?? null),
      });

      if (updatedProfile) {
        setUser(updatedProfile);
      }

      Alert.alert('완료', '프로필이 저장되었습니다.', [
        { text: '확인', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Failed to update profile', error);
      Alert.alert('오류', '프로필 저장에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenContainer scrollable>
        <View style={styles.card}>
          <Text style={styles.title}>프로필 수정</Text>

          {/* Avatar picker */}
          <TouchableOpacity
            style={styles.previewContainer}
            onPress={handlePickImage}
            disabled={isPickingImage}
          >
            {previewUri ? (
              <Image source={{ uri: previewUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {(displayName || user?.email || 'J').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.editBadge}>
              <Text style={styles.editBadgeText}>{isPickingImage ? '…' : '사진 변경'}</Text>
            </View>
          </TouchableOpacity>

          <Input
            label="닉네임"
            placeholder="커뮤니티에서 보일 이름"
            value={displayName}
            onChangeText={setDisplayName}
          />

          <Input
            label="이메일"
            value={user?.email ?? ''}
            editable={false}
          />

          <Input
            label="소개"
            placeholder="간단한 자기소개를 입력하세요"
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
            style={styles.bioInput}
            textAlignVertical="top"
          />

          <Button
            title={isSubmitting ? '저장 중...' : '저장'}
            onPress={handleSubmit}
            isLoading={isSubmitting}
          />
        </View>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
    marginBottom: 20,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E5E7EB',
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
  },
  avatarText: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '700',
  },
  editBadge: {
    marginTop: 8,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  editBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  bioInput: {
    minHeight: 110,
  },
});
