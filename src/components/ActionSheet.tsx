import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { color, radius, shadow, spacing, typography } from '../theme/tokens';

export interface ActionSheetItem {
  label: string;
  onPress: () => void;
  tone?: 'default' | 'destructive';
}

interface Props {
  visible: boolean;
  title: string;
  subtitle?: string;
  items: ActionSheetItem[];
  onClose: () => void;
}

export function ActionSheet({ visible, title, subtitle, items, onClose }: Props) {
  const handlePress = (item: ActionSheetItem) => {
    onClose();
    item.onPress();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

          <View style={styles.list}>
            {items.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.item}
                activeOpacity={0.82}
                onPress={() => handlePress(item)}
              >
                <Text
                  style={[
                    styles.itemText,
                    item.tone === 'destructive' && styles.itemTextDestructive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose} activeOpacity={0.82}>
            <Text style={styles.cancelText}>닫기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(17, 24, 39, 0.28)',
  },
  sheet: {
    backgroundColor: color.bg.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing[20],
    paddingTop: spacing[12],
    paddingBottom: spacing[24],
    ...shadow.modal,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: color.line.default,
    marginBottom: spacing[16],
  },
  title: {
    fontSize: typography.size.sectionTitle,
    fontWeight: typography.weight.bold,
    color: color.text.primary,
    marginBottom: spacing[4],
  },
  subtitle: {
    fontSize: typography.size.bodySmall,
    lineHeight: 19,
    color: color.text.secondary,
    marginBottom: spacing[16],
  },
  list: {
    gap: spacing[8],
  },
  item: {
    backgroundColor: color.bg.subtle,
    borderRadius: radius.lg,
    paddingVertical: spacing[16],
    paddingHorizontal: spacing[16],
  },
  itemText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semiBold,
    color: color.text.primary,
  },
  itemTextDestructive: {
    color: color.state.error,
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[16],
    marginTop: spacing[16],
  },
  cancelText: {
    fontSize: typography.size.bodySmall,
    fontWeight: typography.weight.medium,
    color: color.text.tertiary,
  },
});
