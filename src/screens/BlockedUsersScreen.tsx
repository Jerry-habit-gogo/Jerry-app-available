import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenContainer from '../components/ScreenContainer';
import { fetchBlockedUsers, unblockUser } from '../services/moderationService';
import { useUserStore } from '../store/userStore';
import { Block } from '../types';
import { color, radius, typography } from '../theme/tokens';

export default function BlockedUsersScreen() {
  const { setBlockedUserIds } = useUserStore();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBlocks = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchBlockedUsers();
      setBlocks(result);
    } catch {
      // silent — user sees empty list
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBlocks();
    }, [loadBlocks])
  );

  const handleUnblock = (block: Block) => {
    Alert.alert(
      '차단 해제',
      `${block.blockedDisplayName || '이 사용자'}의 차단을 해제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '해제',
          onPress: async () => {
            try {
              await unblockUser(block.blockedId);
              const newBlocks = blocks.filter((b) => b.id !== block.id);
              setBlocks(newBlocks);
              setBlockedUserIds(newBlocks.map((b) => b.blockedId));
            } catch {
              Alert.alert('오류', '차단 해제에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <ScreenContainer>
        <ActivityIndicator size="large" color={color.brand.green} style={styles.loader} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <FlatList
        data={blocks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.row}>
            {item.blockedPhotoUrl ? (
              <Image source={{ uri: item.blockedPhotoUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {(item.blockedDisplayName || '?').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.name} numberOfLines={1}>
              {item.blockedDisplayName || '알 수 없는 사용자'}
            </Text>
            <TouchableOpacity style={styles.unblockButton} onPress={() => handleUnblock(item)}>
              <Text style={styles.unblockText}>차단 해제</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>차단한 사용자가 없습니다.</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: 60,
  },
  list: {
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.bg.surface,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: color.line.default,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.text.secondary,
  },
  avatarText: {
    color: color.text.inverse,
    fontWeight: typography.weight.bold,
    fontSize: typography.size.sectionTitle,
  },
  name: {
    flex: 1,
    fontSize: typography.size.body,
    fontWeight: typography.weight.semiBold,
    color: color.text.primary,
  },
  unblockButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: color.line.default,
  },
  unblockText: {
    fontSize: typography.size.bodySmall,
    fontWeight: typography.weight.semiBold,
    color: color.text.secondary,
  },
  empty: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyText: {
    fontSize: typography.size.body,
    color: color.text.tertiary,
  },
});
