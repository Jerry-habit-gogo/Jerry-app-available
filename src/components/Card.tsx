import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { color, radius, shadow, spacing } from '../theme/tokens';

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export default function Card({ children, style, ...props }: CardProps) {
  return (
    <View style={[styles.container, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: color.bg.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.line.default,
    padding: spacing[16],
    marginVertical: spacing[8],
    ...shadow.soft,
  },
});
