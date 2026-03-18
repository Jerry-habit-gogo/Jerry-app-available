import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { color, radius, shadow, spacing, typography } from '../theme/tokens';

export interface SideMenuItem {
  label: string;
  onPress: () => void;
}

interface Props {
  visible: boolean;
  title: string;
  items: SideMenuItem[];
  onClose: () => void;
}

export function SideMenuDrawer({ visible, title, items, onClose }: Props) {
  const translateX = useRef(new Animated.Value(-320)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    translateX.setValue(-320);
    overlayOpacity.setValue(0);
  }, [overlayOpacity, translateX, visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: -320,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) onClose();
    });
  };

  const handleItemPress = (item: SideMenuItem) => {
    handleClose();
    setTimeout(item.onPress, 190);
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.root}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.list}>
            {items.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.item}
                activeOpacity={0.82}
                onPress={() => handleItemPress(item)}
              >
                <Text style={styles.itemText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 24, 39, 0.24)',
  },
  drawer: {
    width: 288,
    height: '100%',
    backgroundColor: color.bg.surface,
    paddingTop: spacing[56],
    paddingHorizontal: spacing[16],
    borderTopRightRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    ...shadow.modal,
  },
  title: {
    fontSize: typography.size.sectionTitle,
    fontWeight: typography.weight.bold,
    color: color.text.primary,
    marginBottom: spacing[20],
  },
  list: {
    gap: spacing[8],
  },
  item: {
    backgroundColor: color.bg.subtle,
    borderRadius: radius.lg,
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[16],
  },
  itemText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semiBold,
    color: color.text.primary,
  },
});
