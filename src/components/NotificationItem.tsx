import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppNotification } from '../types';

const TYPE_ICONS: Record<AppNotification['type'], string> = {
  chat_message: '💬',
  comment: '🗨️',
  like: '❤️',
  announcement: '📢',
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

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onPress }) => (
  <TouchableOpacity
    style={[styles.container, !notification.read && styles.unread]}
    onPress={() => onPress(notification)}
    activeOpacity={0.75}
  >
    <Text style={styles.icon}>{TYPE_ICONS[notification.type]}</Text>
    <View style={styles.content}>
      <Text style={[styles.title, !notification.read && styles.titleBold]} numberOfLines={1}>
        {notification.title}
      </Text>
      <Text style={styles.body} numberOfLines={2}>{notification.body}</Text>
      <Text style={styles.time}>{formatTimeAgo(notification.createdAt)}</Text>
    </View>
    {!notification.read && <View style={styles.dot} />}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  unread: {
    backgroundColor: '#EFF6FF',
  },
  icon: {
    fontSize: 22,
    marginRight: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
  },
  titleBold: {
    fontWeight: '700',
    color: '#111',
  },
  body: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 4,
  },
  time: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
    marginTop: 6,
    marginLeft: 8,
  },
});
