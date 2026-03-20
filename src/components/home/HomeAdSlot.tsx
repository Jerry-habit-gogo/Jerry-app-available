import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { color, radius, spacing, typography } from '../../theme/tokens';

interface Props {
  onPress?: () => void;
}

export function HomeAdSlot({ onPress }: Props) {
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper style={styles.card} onPress={onPress} activeOpacity={0.84}>
      <Image 
        source={require('../../../assets/images/ad_banner.jpg')} 
        style={styles.imageBackground}
        resizeMode="cover"
      />
      <View style={styles.badgeContainer}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>AD</Text>
        </View>
      </View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.bg.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.line.default,
    minHeight: 140, // 이미지가 잘 보이도록 높이 증가
    overflow: 'hidden',
    position: 'relative',
  },
  imageBackground: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  badgeContainer: {
    padding: spacing[12],
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: radius.full,
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4],
  },
  badgeText: {
    fontSize: typography.size.micro,
    fontWeight: typography.weight.bold,
    color: color.text.primary,
  },
});
