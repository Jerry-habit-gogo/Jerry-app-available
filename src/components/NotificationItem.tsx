import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppNotification } from '../types';

// Type-specific icon + accent color
const TYPE_CONFIG: Record<
  AppNotification['type'],
  { icon: string; color: string; bg: string }
> = {
  chat_message: { icon: '💬', color: '#2563EB', bg: '#EFF6FF' },
  comment:      { icon: '🗨️',  color: '#059669', bg: '#ECFDF5' },
  like:         { icon: '❤️',  color: '#DC2626', bg: '#FEF2F2' },
  announcement: { icon: '📢', color: '#D97706', bg: '#FFFBEB' },
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
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onPress }) => {
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
        <Text style={styles.iconText}>{cfg.icon}</Text>
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

      {isUnread && <View style={[styles.dot, { backgroundColor: cfg.color }]} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 8,
    overflow: 'hidden',
  },
  unread: {
    backgroundColor: '#F8FAFF',
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
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  iconText: {
    fontSize: 20,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  titleUnread: {
    fontWeight: '700',
    color: '#111827',
  },
  bodyText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  time: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 10,
    flexShrink: 0,
  },
});
