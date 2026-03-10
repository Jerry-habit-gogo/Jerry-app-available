import React from 'react';
import { Text, StyleSheet } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';

export default function NewsScreen() {
  return (
    <ScreenContainer>
      <Text style={styles.title}>News</Text>
      <Text style={styles.subtitle}>Local news for the community</Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: '#333' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center' },
});
