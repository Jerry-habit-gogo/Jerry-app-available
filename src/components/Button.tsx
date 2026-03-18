import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { color, radius, spacing, typography } from '../theme/tokens';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
  disabled?: boolean;
  rightIcon?: React.ReactNode;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  rightIcon,
}: ButtonProps) {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';
  const isDisabled = isLoading || disabled;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isPrimary && styles.primary,
        isSecondary && styles.secondary,
        isOutline && styles.outline,
        isGhost && styles.ghost,
        isDisabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.82}
    >
      {isLoading ? (
        <ActivityIndicator color={isOutline || isGhost ? color.brand.green : color.text.inverse} />
      ) : (
        <View style={styles.content}>
          <Text style={[
            styles.text,
            isSecondary && styles.textSecondary,
            isOutline && styles.textOutline,
            isGhost && styles.textGhost,
          ]}>
            {title}
          </Text>
          {rightIcon ? <View style={styles.iconSlot}>{rightIcon}</View> : null}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 48,
    paddingHorizontal: spacing[24],
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing[8],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSlot: {
    marginLeft: spacing[8],
  },
  primary: {
    backgroundColor: color.brand.green,
  },
  secondary: {
    backgroundColor: color.bg.subtle,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: color.brand.green,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.45,
  },
  text: {
    color: color.text.inverse,
    fontSize: typography.size.body,
    fontWeight: typography.weight.semiBold,
  },
  textSecondary: {
    color: color.text.primary,
  },
  textOutline: {
    color: color.brand.green,
  },
  textGhost: {
    color: color.brand.green,
    fontWeight: typography.weight.medium,
  },
});
