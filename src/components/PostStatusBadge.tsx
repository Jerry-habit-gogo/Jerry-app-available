import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { POST_STATUS_LABELS, POST_STATUS_STYLES } from '../constants/postStatus';
import { PostStatus } from '../types';
import { radius, typography } from '../theme/tokens';

interface Props {
  status: PostStatus;
  style?: ViewStyle;
}

export function PostStatusBadge({ status, style }: Props) {
  if (status === 'active') return null;

  const tone = POST_STATUS_STYLES[status];

  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }, style]}>
      <Text style={[styles.text, { color: tone.color }]}>
        {POST_STATUS_LABELS[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.xs,
  },
  text: {
    fontSize: typography.size.micro,
    fontWeight: typography.weight.bold,
  },
});
