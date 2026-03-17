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
        <ActivityIndicator size="large" color="#3b82f6" style={styles.loader} />
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
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: '#E5E7EB',
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6B7280',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  unblockButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  unblockText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  empty: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyText: {
    fontSize: 15,
    color: '#9CA3AF',
  },
});
