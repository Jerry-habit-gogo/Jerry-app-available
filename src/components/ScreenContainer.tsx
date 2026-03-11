import React from 'react';
import { View, StyleSheet, SafeAreaView, ViewProps, ScrollView } from 'react-native';

interface ScreenContainerProps extends ViewProps {
  children: React.ReactNode;
  useSafeArea?: boolean;
  scrollable?: boolean;
}

export default function ScreenContainer({ children, style, useSafeArea = false, scrollable = false, ...props }: ScreenContainerProps) {
  const Container = useSafeArea ? SafeAreaView : View;

  const content = scrollable ? (
    <ScrollView contentContainerStyle={styles.innerScroll} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={styles.inner}>
      {children}
    </View>
  );

  return (
    <Container style={[styles.container, style]} {...props}>
      {content}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  inner: {
    flex: 1,
    padding: 16,
    // Removed alignItems and justifyContent center to behave normally like standard screens
  },
  innerScroll: {
    padding: 16,
    flexGrow: 1,
  }
});
