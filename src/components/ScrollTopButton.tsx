import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { BOTTOM_BAR_SPACE } from '@/components/BottomBar';
import { Icon } from '@/components/Icon';
import { NATIVE_DRIVER } from '@/hooks/useLoop';
import { useTheme } from '@/theme/ThemeProvider';

/** Khoảng trống cần cộng thêm vào cuối nội dung để nút ↑ không che dòng cuối (nút 48 + cách 16). */
export const SCROLL_TOP_SPACE = 48 + 16;

/**
 * Nút ↑ lên đầu trang: góc phải dưới, chỉ hiện khi đã cuộn xuống.
 * Cùng kiểu khối "đang chọn" của thanh tab: mặt chuyển màu emerald, mép 3D đậm + quầng sáng, icon trắng duotone.
 * `tabBar` = false khi màn không có thanh tab (vd bản đồ bài học) → nút sát đáy (cách safe area / 20px).
 */
export function ScrollTopButton({ visible, onPress, tabBar = true }: { visible: boolean; onPress: () => void; tabBar?: boolean }) {
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
          bottom: tabBar ? BOTTOM_BAR_SPACE + insets.bottom : Math.max(insets.bottom, 20),
          opacity: v,
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
          {
            backgroundColor: colors.navPillBottom,
            boxShadow: pressed
              ? `0px 1px 0px ${colors.navPillEdge}, 0px 3px 6px ${colors.navPillGlow}`
              : `0px 3px 0px ${colors.navPillEdge}, 0px 8px 16px ${colors.navPillGlow}`,
            transform: [{ translateY: pressed ? 2 : 0 }],
          },
        ]}
      >
        <View style={[StyleSheet.absoluteFill, styles.face]} pointerEvents="none">
          <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 10 10">
            <Defs>
              <LinearGradient id="scrollTopFace" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.navPillTop} />
                <Stop offset="1" stopColor={colors.navPillBottom} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="10" height="10" fill="url(#scrollTopFace)" />
          </Svg>
        </View>
        {/* Bọc View để icon nằm trên mặt gradient (web: phần tử định vị vẽ đè phần tử thường) */}
        <View>
          <Icon name="arrowBigUp" color={colors.navOn} duotone />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', right: 16, zIndex: 30 },
  btn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  face: { borderRadius: 24, overflow: 'hidden' },
});
