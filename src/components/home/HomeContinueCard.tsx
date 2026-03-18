import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { color, radius, spacing, typography } from '../../theme/tokens';

interface Props {
  title: string;
  count: number;
  icon: string;
  description: string;
  onPress: () => void;
}

export function HomeContinueCard({ title, count, icon, description, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
      <View style={styles.topRow}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.count}>{count}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: color.bg.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.line.subtle,
    padding: spacing[16],
    minHeight: 120,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[12],
  },
  icon: {
    fontSize: spacing[20],
  },
  count: {
    fontSize: typography.size.screenTitle,
    fontWeight: typography.weight.extraBold,
    color: color.brand.green,
  },
  title: {
    fontSize: typography.size.bodySmall,
    fontWeight: typography.weight.bold,
    color: color.text.primary,
    marginBottom: 6,
  },
  description: {
    fontSize: typography.size.caption,
    lineHeight: 18,
    color: color.text.tertiary,
  },
});
