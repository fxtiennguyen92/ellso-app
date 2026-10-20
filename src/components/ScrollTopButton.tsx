import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BOTTOM_BAR_SPACE } from '@/components/BottomBar';
import { Icon } from '@/components/Icon';
import { NATIVE_DRIVER } from '@/hooks/useLoop';
import { useTheme } from '@/theme/ThemeProvider';

/** Khoảng trống cần cộng thêm vào cuối nội dung để nút ↑ không che dòng cuối (nút 48 + cách 16). */
export const SCROLL_TOP_SPACE = 48 + 16;

/** Nút ↑ lên đầu trang: góc phải dưới, nằm trên thanh điều hướng; chỉ hiện khi đã cuộn xuống. */
export function ScrollTopButton({ visible, onPress }: { visible: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(v, { toValue: visible ? 1 : 0, stiffness: 260, damping: 22, useNativeDriver: NATIVE_DRIVER }).start();
  }, [visible, v]);

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        styles.wrap,
        {
          bottom: BOTTOM_BAR_SPACE + insets.bottom,
          opacity: v, // hiện/ẩn; bản thân nút hơi trong (0.92) để thấy nội dung phía sau
          transform: [
            { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
            { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
          ],
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Lên đầu trang"
        onPress={onPress}
        style={({ pressed }) => [
          styles.btn,
          { backgroundColor: pressed ? colors.emerald800 : colors.emerald700, boxShadow: colors.shadowNav, opacity: 0.92 },
        ]}
      >
        <Icon name="arrowUp" color={colors.onEmerald} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', right: 16, zIndex: 30 },
  btn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
});