import { useCallback, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BOTTOM_BAR_SPACE } from '@/components/BottomBar';
import { Icon } from '@/components/Icon';
import { NATIVE_DRIVER } from '@/hooks/useLoop';
import { useTheme } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';

/**
 * Thông báo ngắn nổi phía trên thanh điều hướng.
 *   const [toast, showToast] = useToast();
 *   showToast('Đã sao chép');   … và render {toast} trong màn hình.
 */
export function useToast() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const v = useRef(new Animated.Value(0)).current;
  const [text, setText] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = useCallback(
    (message: string) => {
      setText(message);
      clearTimeout(timer.current);
      Animated.spring(v, { toValue: 1, stiffness: 300, damping: 24, useNativeDriver: NATIVE_DRIVER }).start();
      timer.current = setTimeout(() => {
        Animated.timing(v, { toValue: 0, duration: 200, useNativeDriver: NATIVE_DRIVER }).start();
      }, 1800);
    },
    [v],
  );

  const node = (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[
        styles.toast,
        {
          bottom: BOTTOM_BAR_SPACE + insets.bottom + 4,
          backgroundColor: colors.ink900,
          opacity: v,
          transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
        },
      ]}
    >
      <Icon name="check" size={16} strokeWidth={2.5} color={colors.bg} />
      <Text style={[type.label, { color: colors.bg }]}>{text}</Text>
    </Animated.View>
  );

  return [node, show] as const;
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 9999,
  },
});