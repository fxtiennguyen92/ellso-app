import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, KeyboardAvoidingView, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { NATIVE_DRIVER } from '@/hooks/useLoop';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

/**
 * Popup giữa màn hình (dùng chung) — dùng cho hộp thoại có ô nhập ngắn (vd mã khuyến mãi): khung nằm giữa,
 * KeyboardAvoidingView (padding) đẩy cả khối lên khi bàn phím mở nên ô nhập + nút không bị che.
 * Hiện: mờ nền + phóng nhẹ từ 0.92; Giảm chuyển động → chỉ mờ.
 */
export function CenterDialog({ visible, onClose, title, children }: Props) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const v = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) setMounted(true);
    Animated.timing(v, {
      toValue: visible ? 1 : 0,
      duration: reduced ? 120 : visible ? 260 : 180,
      easing: visible ? Easing.out(Easing.back(1.4)) : Easing.in(Easing.cubic),
      useNativeDriver: NATIVE_DRIVER,
    }).start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
  }, [visible, v, reduced]);

  if (!mounted) return null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.root} behavior="padding">
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }) }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Đóng" />
        </Animated.View>
        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.line,
              opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
              transform: [{ scale: reduced ? 1 : v.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }],
            },
          ]}
        >
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
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  backdrop: { backgroundColor: 'rgba(15,23,42,0.78)' },
  card: { width: '100%', maxWidth: 400, borderRadius: 24, borderWidth: 1, padding: 20, boxShadow: '0px 20px 48px rgba(15,23,42,0.28)' },
  head: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  title: { flex: 1 },
  close: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
