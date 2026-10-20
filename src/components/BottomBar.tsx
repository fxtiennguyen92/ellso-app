import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Icon, type IconName } from '@/components/Icon';
import { useRevealStyle } from '@/components/splash/RevealContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';

/** Khoảng trống nội dung cần chừa phía dưới để không bị thanh điều hướng che. */
export const BOTTOM_BAR_SPACE = 20 + 60 + 20;

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Trang chủ', icon: 'home' },
  courses: { label: 'Khoá học', icon: 'courses' },
  documents: { label: 'Tài liệu', icon: 'documents' },
  profile: { label: 'Hồ sơ', icon: 'profile' },
};

// Kích thước (khớp thiết kế): tab thường 56×48, icon 22.
// Tab đang chọn: đệm trái 14 + icon 22 + khoảng 8 + chữ + đệm phải 18.
const TAB_H = 48;
const TAB_W = 56;
const ICON = 22;
const PAD_ACTIVE = 14;
const PAD_IDLE = (TAB_W - ICON) / 2;
const ACTIVE_EXTRA = PAD_ACTIVE + ICON + 8 + 18 - TAB_W; // = 6
const BAR_PAD = 6;
/** Khoảng cách cố định giữa các tab — thanh ôm vừa nội dung, không kéo giãn hết màn hình. */
const GAP = 4;
const BAR_BORDER = 1;

/**
 * Thanh điều hướng viên thuốc, nổi cách đáy 20px, căn giữa và chỉ rộng vừa các tab.
 * Đổi tab: khối 3D trượt sang tab mới (spring), tab cũ thu lại, tab mới giãn ra và hiện chữ;
 * cả thanh phình ra / co lại theo độ dài nhãn của tab đang chọn.
 *
 * Cách làm: một giá trị `pos` (số thực = chỉ số tab đang chọn) chạy spring.
 * Với mỗi trạng thái nguyên k, tính sẵn vị trí/độ rộng của từng tab và của khối 3D;
 * giữa hai trạng thái thì nội suy tuyến tính → mọi thứ chuyển động đồng bộ.
 */
export function BottomBar({ state, navigateToTab, insets }: BottomTabBarProps) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const reveal = useRevealStyle(4, 40);

  const routes = state.routes.filter((r) => TABS[r.name]);
  const activeIndex = Math.max(
    0,
    routes.findIndex((r) => r.key === state.routes[state.index]?.key),
  );

  // --- đo bề rộng từng nhãn chữ
  const [labelW, setLabelW] = useState<Record<string, number>>({});
  const measured = routes.every((r) => labelW[r.name] > 0);

  // --- chuyển động
  // pos: vị trí khối 3D (trượt qua các tab). act[name]: mức "đang chọn" riêng của từng tab (0 → 1),
  // để tab nằm giữa đường trượt không bị sáng lên khi khối 3D đi ngang qua.
  const pos = useRef(new Animated.Value(activeIndex)).current;
  const actRef = useRef<Record<string, Animated.Value>>({});
  const act = (name: string, i: number) =>
    (actRef.current[name] ??= new Animated.Value(i === activeIndex ? 1 : 0));
  const [pressedKey, setPressedKey] = useState<string | null>(null);

  useEffect(() => {
    const run = (value: Animated.Value, toValue: number, delay = 0) =>
      reduced
        ? Animated.timing(value, { toValue, duration: 150, easing: Easing.out(Easing.quad), useNativeDriver: false })
        : Animated.spring(value, { toValue, delay, stiffness: 280, damping: 22, mass: 1, useNativeDriver: false });
    Animated.parallel([
      run(pos, activeIndex),
      ...routes.map((r, i) => run(act(r.name, i), i === activeIndex ? 1 : 0, i === activeIndex ? 60 : 0)),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, reduced]);

  // --- khung hình chính cho từng trạng thái k
  const frames = useMemo(() => {
    if (!measured) return null;
    const n = routes.length;
    const extra = (j: number) => ACTIVE_EXTRA + labelW[routes[j].name];

    // Độ rộng từng tab theo mức chọn của chính nó; các tab nối tiếp nhau cách GAP.
    const tabWidth = routes.map((r, j) =>
      act(r.name, j).interpolate({ inputRange: [0, 1], outputRange: [TAB_W, TAB_W + extra(j)] }),
    );
    const tabLeft: (Animated.AnimatedNode | number)[] = [];
    let x: Animated.AnimatedNode | number = 0;
    for (let i = 0; i < n; i++) {
      tabLeft.push(x);
      x = Animated.add(x, tabWidth[i]);
      if (i < n - 1) x = Animated.add(x, GAP);
    }
    // Bề rộng cả hàng tab = bề rộng thanh (trừ đệm) → thanh co giãn theo tab đang chọn
    const trackWidth = x;

    // Khối 3D: vị trí/độ rộng tại mỗi trạng thái k, nội suy theo pos.
    const input = routes.map((_, k) => k);
    const range = (out: number[]) =>
      n > 1 ? pos.interpolate({ inputRange: input, outputRange: out, extrapolate: 'clamp' }) : out[0];

    return {
      tabLeft,
      tabWidth,
      trackWidth,
      pillLeft: range(input.map((k) => k * (TAB_W + GAP))),
      pillWidth: range(input.map((k) => TAB_W + extra(k))),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measured, routes.length, labelW, pos]);

  const activePressed = pressedKey === routes[activeIndex]?.key;

  return (
    <Animated.View pointerEvents="box-none" style={[styles.wrap, { bottom: 20 + insets.bottom }, reveal]}>
      {/* Đo nhãn chữ (ẩn) */}
      <View pointerEvents="none" style={styles.measure} aria-hidden>
        {routes.map((r) => (
          <Text
            key={r.key}
            style={type.label}
            onLayout={(e) => {
              const w = Math.ceil(e.nativeEvent.layout.width) + 1;
              setLabelW((prev) => (prev[r.name] === w ? prev : { ...prev, [r.name]: w }));
            }}
          >
            {TABS[r.name].label}
          </Text>
        ))}
      </View>

      <View
        accessibilityRole="tablist"
        accessibilityLabel="Điều hướng chính"
        style={[styles.bar, { backgroundColor: colors.card, borderColor: colors.line, boxShadow: colors.shadowNav }]}
      >
        <Animated.View style={[styles.track, frames ? { width: frames.trackWidth } : styles.trackStatic]}>
          {frames && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.pill,
                {
                  left: frames.pillLeft,
                  width: frames.pillWidth,
                  backgroundColor: colors.pillBottom,
                  // Mép đáy đậm + quầng bóng = cảm giác khối nổi; nhấn xuống thì "lún" 2px
                  boxShadow: activePressed
                    ? `0px 1px 0px ${colors.pillEdge}, 0px 3px 6px ${colors.pillGlow}`
                    : `0px 3px 0px ${colors.pillEdge}, 0px 8px 16px ${colors.pillGlow}`,
                  transform: [{ translateY: activePressed ? 2 : 0 }],
                },
              ]}
            >
              <View style={styles.pillFace}>
                <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 10 10">
                  <Defs>
                    <LinearGradient id="pillFace" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor={colors.pillTop} />
                      <Stop offset="1" stopColor={colors.pillBottom} />
                    </LinearGradient>
                  </Defs>
                  <Rect x="0" y="0" width="10" height="10" fill="url(#pillFace)" />
                </Svg>
                {/* vệt sáng mép trên */}
                <View style={styles.pillShine} />
              </View>
            </Animated.View>
          )}

          {routes.map((route, i) => {
            const tab = TABS[route.name];
            const active = i === activeIndex;
            const a = act(route.name, i);
            const lerp = (from: number, to: number) => a.interpolate({ inputRange: [0, 1], outputRange: [from, to] });
            const labelOpacity = a.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1], extrapolate: 'clamp' });

            return (
              <Animated.View
                key={route.key}
                style={
                  frames
                    ? [styles.tabAbs, { left: frames.tabLeft[i], width: frames.tabWidth[i] }]
                    : [styles.tabStatic, active && { width: TAB_W + ACTIVE_EXTRA + 72 }]
                }
              >
                <Pressable
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={tab.label}
                  onPressIn={() => setPressedKey(route.key)}
                  onPressOut={() => setPressedKey(null)}
                  onPress={() => !active && navigateToTab(route.key)}
                  style={({ pressed }) => [styles.tabPress, pressed && !active && { transform: [{ scale: 0.9 }] }]}
                >
                  <Animated.View
                    style={[
                      styles.tabContent,
                      { paddingLeft: frames ? lerp(PAD_IDLE, PAD_ACTIVE) : PAD_IDLE },
                    ]}
                  >
                    <View style={styles.iconBox}>
                      <Animated.View style={[StyleSheet.absoluteFill, { opacity: lerp(1, 0) }]}>
                        <Icon name={tab.icon} color={colors.ink600} />
                      </Animated.View>
                      <Animated.View
                        style={[
                          StyleSheet.absoluteFill,
                          {
                            opacity: a,
                            transform: [{ scale: lerp(0.7, 1) }],
                          },
                        ]}
                      >
                        <Icon name={tab.icon} color={colors.onEmerald} duotone />
                      </Animated.View>
                    </View>
                    <Animated.Text
                      style={[
                        type.label,
                        styles.label,
                        {
                          width: labelW[route.name],
                          color: colors.onEmerald,
                          opacity: labelOpacity,
                          transform: [{ translateX: lerp(-8, 0) }],
                        },
                      ]}
                    >
                      {tab.label}
                    </Animated.Text>
                  </Animated.View>
                </Pressable>
              </Animated.View>
            );
          })}
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  measure: { position: 'absolute', opacity: 0, left: 0, top: 0, flexDirection: 'row' },
  bar: {
    borderRadius: 9999,
    borderWidth: BAR_BORDER,
    padding: BAR_PAD,
  },
  track: { height: TAB_H },
  trackStatic: { flexDirection: 'row', gap: GAP },
  pill: { position: 'absolute', top: 0, height: TAB_H, borderRadius: 9999 },
  pillFace: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 9999, overflow: 'hidden' },
  pillShine: {
    position: 'absolute',
    top: 1,
    left: 14,
    right: 14,
    height: 1,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  tabAbs: { position: 'absolute', top: 0, height: TAB_H, overflow: 'hidden', borderRadius: 9999 },
  tabStatic: { width: TAB_W, height: TAB_H, overflow: 'hidden' },
  tabPress: { flex: 1 },
  tabContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: ICON, height: ICON },
  label: { marginLeft: 8, flexShrink: 0 },
});