import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Button from '../components/Button';
import Input from '../components/Input';
import ScreenContainer from '../components/ScreenContainer';
import { RootStackParamList } from '../navigation/RootNavigator';
import { signInWithEmail, signUpWithEmail } from '../services/authService';
import { isFirebaseConfigured } from '../services/firebase';

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

const mapAuthErrorMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message : 'Authentication failed.';

  if (message.includes('Firebase is not configured')) {
    return 'Firebase 설정이 아직 연결되지 않았습니다. config를 먼저 채워야 합니다.';
  }
  if (message.includes('auth/email-already-in-use')) {
    return '이미 사용 중인 이메일입니다.';
  }
  if (message.includes('auth/invalid-email')) {
    return '이메일 형식이 올바르지 않습니다.';
  }
  if (message.includes('auth/weak-password')) {
    return '비밀번호는 최소 6자 이상이어야 합니다.';
  }
  if (message.includes('auth/invalid-credential') || message.includes('auth/user-not-found')) {
    return '이메일 또는 비밀번호가 올바르지 않습니다.';
  }

  return '인증 처리 중 오류가 발생했습니다.';
};

export default function AuthScreen({ navigation }: Props) {
  const [mode, setMode] = useState<'sign_in' | 'sign_up'>('sign_in');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignUp = mode === 'sign_up';

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim() || (isSignUp && !displayName.trim())) {
      Alert.alert('알림', '필수 항목을 모두 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email.trim(), password, displayName.trim());
      } else {
        await signInWithEmail(email.trim(), password);
      }

      navigation.goBack();
    } catch (error) {
      Alert.alert('인증 오류', mapAuthErrorMessage(error));
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
          <Text style={styles.title}>{isSignUp ? '회원가입' : '로그인'}</Text>
          <Text style={styles.subtitle}>
            {isSignUp ? 'Jerry 커뮤니티 계정을 생성합니다.' : '이메일 계정으로 로그인합니다.'}
          </Text>

          {!isFirebaseConfigured && (
            <View style={styles.noticeBox}>
              <Text style={styles.noticeText}>
                Firebase 설정값이 placeholder 상태입니다. 실제 인증을 쓰려면 `src/services/firebase.ts`의 config를 채워야 합니다.
              </Text>
            </View>
          )}

          {isSignUp && (
            <Input
              label="이름"
              placeholder="표시 이름"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
            />
          )}

          <Input
            label="이메일"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Input
            label="비밀번호"
            placeholder="6자 이상"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <Button
            title={isSubmitting ? '처리 중...' : isSignUp ? '회원가입' : '로그인'}
            onPress={handleSubmit}
            isLoading={isSubmitting}
          />

          <TouchableOpacity
            style={styles.modeSwitch}
            onPress={() => setMode(isSignUp ? 'sign_in' : 'sign_up')}
            disabled={isSubmitting}
          >
            <Text style={styles.modeSwitchText}>
              {isSignUp ? '이미 계정이 있나요? 로그인' : '계정이 없나요? 회원가입'}
            </Text>
          </TouchableOpacity>
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
    fontSize: 26,
    fontWeight: '700',
    color: '#111',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    marginBottom: 16,
  },
  noticeBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  noticeText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  modeSwitch: {
    marginTop: 12,
    alignItems: 'center',
  },
  modeSwitchText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
