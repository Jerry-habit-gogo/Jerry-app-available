import React from 'react';
import { View, StyleSheet, ViewProps, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, spacing } from '../theme/tokens';

interface ScreenContainerProps extends ViewProps {
  children: React.ReactNode;
  useSafeArea?: boolean;
  scrollable?: boolean;
}

export default function ScreenContainer({ children, style, useSafeArea = false, scrollable = false, ...props }: ScreenContainerProps) {
  const Container = useSafeArea ? SafeAreaView : View;

  const content = scrollable ? (
    <ScrollView
      contentContainerStyle={styles.innerScroll}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      contentInsetAdjustmentBehavior="automatic"
    >
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
    backgroundColor: color.bg.subtle,
  },
  inner: {
    flex: 1,
    padding: spacing[16],
    // Removed alignItems and justifyContent center to behave normally like standard screens
  },
  innerScroll: {
    padding: spacing[16],
    flexGrow: 1,
  }
});
