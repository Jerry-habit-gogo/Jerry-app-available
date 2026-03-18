import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { color, radius, spacing, typography } from '../../theme/tokens';

interface Props {
  title?: string;
  body?: string;
  ctaLabel?: string;
  onPress?: () => void;
}

export function HomeAdSlot({
  title = 'Jerry 파트너 배너',
  body = '이 영역은 추후 광고, 제휴 프로모션, 스폰서 콘텐츠로 쉽게 교체할 수 있습니다.',
  ctaLabel = '추후 연결',
  onPress,
}: Props) {
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper style={styles.card} onPress={onPress} activeOpacity={0.84}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>AD</Text>
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>
      <Text style={styles.cta}>{ctaLabel}</Text>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.bg.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.line.default,
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[12],
    minHeight: 92,
    justifyContent: 'space-between',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: color.brand.sandLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4],
    marginBottom: spacing[8],
  },
  badgeText: {
    fontSize: typography.size.micro,
    fontWeight: typography.weight.bold,
    color: color.brand.sandDark,
  },
  copy: {
    paddingRight: spacing[24],
  },
  title: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.bold,
    color: color.text.primary,
    marginBottom: spacing[4],
  },
  body: {
    fontSize: typography.size.bodySmall,
    lineHeight: 18,
    color: color.text.secondary,
  },
  cta: {
    marginTop: spacing[12],
    fontSize: typography.size.caption,
    fontWeight: typography.weight.semiBold,
    color: color.brand.green,
  },
});
