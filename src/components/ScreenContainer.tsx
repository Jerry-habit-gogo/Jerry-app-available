import React from 'react';
import { View, StyleSheet, SafeAreaView, ViewProps } from 'react-native';

interface ScreenContainerProps extends ViewProps {
  children: React.ReactNode;
  useSafeArea?: boolean;
}

export default function ScreenContainer({ children, style, useSafeArea = false, ...props }: ScreenContainerProps) {
  const Container = useSafeArea ? SafeAreaView : View;
  
  return (
    <Container style={[styles.container, style]} {...props}>
      <View style={styles.inner}>
        {children}
      </View>
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
    alignItems: 'center',
    justifyContent: 'center',
  }
});
