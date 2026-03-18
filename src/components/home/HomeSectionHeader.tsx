import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { color, radius, spacing, typography } from '../../theme/tokens';

interface Props {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onPressAction?: () => void;
}

export function HomeSectionHeader({ title, subtitle, actionLabel, onPressAction }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {actionLabel && onPressAction ? (
        <TouchableOpacity onPress={onPressAction} style={styles.action}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  copy: {
    flex: 1,
    paddingRight: spacing[12],
  },
  title: {
    fontSize: typography.size.sectionTitle,
    fontWeight: typography.weight.bold,
    color: color.text.primary,
  },
  subtitle: {
    marginTop: spacing[4],
    fontSize: typography.size.bodySmall,
    color: color.text.tertiary,
    lineHeight: 18,
  },
  action: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: color.bg.subtle,
  },
  actionText: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.bold,
    color: color.brand.green,
  },
});
