import React from 'react';
import { Text, StyleSheet } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';

export default function HomeScreen() {
  return (
    <ScreenContainer>
      <Text style={styles.title}>Home Feed</Text>
      <Text style={styles.subtitle}>Latest community posts and local news</Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: '#333' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center' },
});
