import React from 'react';
import { Text, StyleSheet } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import { useUserStore } from '../store/userStore';

export default function ProfileScreen() {
  const { user } = useUserStore();

  return (
    <ScreenContainer>
      <Text style={styles.title}>Profile</Text>
      {user ? (
        <Text style={styles.subtitle}>Welcome back, {user.displayName || 'User'}</Text>
      ) : (
        <Text style={styles.subtitle}>Please tap to sign in or register</Text>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: '#333' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center' },
});
