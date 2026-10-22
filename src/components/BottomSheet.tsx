import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { NATIVE_DRIVER } from '@/hooks/useLoop';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { WEB_MAX_WIDTH } from '@/theme/tokens';
import { type } from '@/theme/typography';

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

/**
 * Bảng trượt từ dưới lên (dùng chung). Chạy cả native và web (web: rộng tối đa WEB_MAX_WIDTH, căn giữa).
 * Dùng thay Alert.alert — Alert không hoạt động trên web.
 */
export function BottomSheet({ visible, onClose, title, children }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const v = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) setMounted(true);
    Animated.timing(v, {
      toValue: visible ? 1 : 0,
      duration: reduced ? 120 : visible ? 320 : 220,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: NATIVE_DRIVER,
    }).start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
  }, [visible, v, reduced]);

  if (!mounted) return null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: v }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Đóng" />
        </Animated.View>
        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              borderColor: colors.line,
              paddingBottom: 20 + insets.bottom,
              transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [reduced ? 0 : 420, 0] }) }],
              opacity: reduced ? v : 1,
            },
          ]}
        >
          <View style={[styles.grabber, { backgroundColor: colors.line }]} />
          <View style={styles.head}>
            <Text accessibilityRole="header" style={[type.cardTitle, styles.title, { color: colors.ink900 }]}>
              {title}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Đóng"
              onPress={onClose}
              hitSlop={8}
              style={({ pressed }) => [styles.close, { backgroundColor: colors.surfaceAlt, opacity: pressed ? 0.7 : 1 }]}
            >
              <Icon name="close" size={18} color={colors.ink600} />
            </Pressable>
          </View>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  backdrop: { backgroundColor: 'rgba(15,23,42,0.45)' },
  sheet: {
    width: '100%',
    maxWidth: WEB_MAX_WIDTH,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginBottom: 10 },
  head: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  title: { flex: 1 },
  close: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});