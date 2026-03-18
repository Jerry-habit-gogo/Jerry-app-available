import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppNotification } from '../types';
import { color, radius, spacing, typography } from '../theme/tokens';

// Type-specific icon + accent color
const TYPE_CONFIG: Record<
  AppNotification['type'],
  { icon: string; color: string; bg: string }
> = {
  chat_message: { icon: 'chatbubble', color: color.brand.blue,      bg: color.brand.blueLight },
  comment:      { icon: 'chatbox-ellipses',  color: color.state.success,  bg: color.state.successLight },
  like:         { icon: 'heart',  color: color.state.error,    bg: color.state.errorLight },
  announcement: { icon: 'megaphone', color: color.state.warning,  bg: color.state.warningLight },
};

const formatTimeAgo = (dateStr: string): string => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return '방금 전';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
};

interface NotificationItemProps {
  notification: AppNotification;
  onPress: (notification: AppNotification) => void;
  onDelete?: (notification: AppNotification) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onPress, onDelete }) => {
  const cfg = TYPE_CONFIG[notification.type];
  const isUnread = !notification.read;

  return (
    <TouchableOpacity
      style={[styles.container, isUnread && styles.unread]}
      onPress={() => onPress(notification)}
      activeOpacity={0.7}
    >
      {isUnread && <View style={[styles.leftBar, { backgroundColor: cfg.color }]} />}

      <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
        <Ionicons name={cfg.icon as any} size={22} color={cfg.color} />
      </View>

      <View style={styles.body}>
        <Text
          style={[styles.title, isUnread && styles.titleUnread]}
          numberOfLines={1}
        >
          {notification.title}
        </Text>
        <Text style={styles.bodyText} numberOfLines={2}>
          {notification.body}
        </Text>
        <Text style={styles.time}>{formatTimeAgo(notification.createdAt)}</Text>
      </View>

      <View style={styles.trailing}>
        {isUnread && <View style={[styles.dot, { backgroundColor: cfg.color }]} />}
        {onDelete ? (
          <TouchableOpacity
            onPress={() => onDelete(notification)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.deleteButton}
          >
            <Text style={styles.deleteText}>삭제</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.bg.surface,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: spacing[8],
    overflow: 'hidden',
  },
  unread: {
    backgroundColor: color.brand.blueLight,
  },
  leftBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderRadius: 2,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[12],
    flexShrink: 0,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: typography.size.bodySmall,
    color: color.text.secondary,
    fontWeight: typography.weight.medium,
  },
  titleUnread: {
    fontWeight: typography.weight.bold,
    color: color.text.primary,
  },
  bodyText: {
    fontSize: typography.size.bodySmall,
    color: color.text.tertiary,
    lineHeight: 18,
  },
  time: {
    fontSize: typography.size.micro,
    color: color.text.tertiary,
    marginTop: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  trailing: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    marginLeft: 10,
  },
  deleteButton: {
    paddingVertical: 2,
  },
  deleteText: {
    fontSize: typography.size.micro,
    color: color.text.tertiary,
    fontWeight: typography.weight.medium,
  },
});
