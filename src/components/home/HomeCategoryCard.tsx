import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { radius, spacing, typography, color } from '../../theme/tokens';

interface Props {
  label: string;
  description: string;
  accent: string;
  icon: string;
  onPress: () => void;
}

export function HomeCategoryCard({ label, description, accent, icon, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: accent }]}
      activeOpacity={0.82}
      onPress={onPress}
    >
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.description} numberOfLines={2}>
        {description}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '48%',
    borderRadius: radius.lg,
    padding: spacing[16],
    minHeight: 100,
  },
  icon: {
    fontSize: 24,
    marginBottom: spacing[8],
  },
  label: {
    fontSize: typography.size.bodySmall,
    fontWeight: typography.weight.bold,
    color: color.text.primary,
    marginBottom: spacing[4],
  },
  description: {
    fontSize: typography.size.caption,
    lineHeight: 17,
    color: color.text.secondary,
  },
});
