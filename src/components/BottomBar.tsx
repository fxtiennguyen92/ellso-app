import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useCart } from '@/components/cart/CartContext';
import { Icon, type IconName } from '@/components/Icon';
import { useRevealStyle } from '@/components/splash/RevealContext';
import { NATIVE_DRIVER } from '@/hooks/useLoop';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';

/** Khoảng trống nội dung cần chừa phía dưới để không bị thanh điều hướng che. */
export const BOTTOM_BAR_SPACE = 20 + 60 + 20;

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Trang chủ', icon: 'home' },
  courses: { label: 'Khoá học', icon: 'courses' },
  documents: { label: 'Tài liệu', icon: 'documents' },
  cart: { label: 'Giỏ hàng', icon: 'cart' },
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
 * Luôn tối ở cả chế độ sáng / tối (token nav*), tab đang chọn là khối emerald.
 * Đổi tab: khối 3D trượt sang tab mới (spring), tab cũ thu lại, tab mới giãn ra và hiện chữ;
 * cả thanh phình ra / co lại theo độ dài nhãn của tab đang chọn.
 *
 * Cách làm: một giá trị `pos` (số thực = chỉ số tab đang chọn) chạy spring.
 * Với mỗi trạng thái nguyên k, tính sẵn vị trí/độ rộng của từng tab và của khối 3D;
 * giữa hai trạng thái thì nội suy tuyến tính → mọi thứ chuyển động đồng bộ.
 */
export function BottomBar({ state, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const reveal = useRevealStyle(4, 40);

  const { cart } = useCart();
  // Bàn phím mở (vd ô mã khuyến mãi ở Giỏ hàng) → ẩn thanh tab để không nổi đè lên bàn phím / ô nhập
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  const currentName = state.routes[state.index]?.name;
  // Tab Giỏ hàng (trước Hồ sơ) chỉ hiện khi giỏ có món, hoặc đang mở tab đó (vd vừa bỏ món cuối cùng ra)
  const routes = useMemo(
    () => state.routes.filter((r) => TABS[r.name] && (r.name !== 'cart' || cart.count > 0 || currentName === 'cart')),
    [state.routes, cart.count, currentName],
  );
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
    <Animated.View
      pointerEvents={keyboardOpen ? 'none' : 'box-none'}
      style={[styles.wrap, { bottom: 20 + insets.bottom }, reveal, keyboardOpen && styles.hidden]}
    >
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
        style={[styles.bar, { backgroundColor: colors.navBg, borderColor: colors.navLine, boxShadow: colors.navShadow }]}
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
                  backgroundColor: colors.navPillBottom,
                  // Mép đáy đậm + quầng bóng = cảm giác khối nổi; nhấn xuống thì "lún" 2px
                  boxShadow: activePressed
                    ? `0px 1px 0px ${colors.navPillEdge}, 0px 3px 6px ${colors.navPillGlow}`
                    : `0px 3px 0px ${colors.navPillEdge}, 0px 8px 16px ${colors.navPillGlow}`,
                  transform: [{ translateY: activePressed ? 2 : 0 }],
                },
              ]}
            >
              <View style={styles.pillFace}>
                <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 10 10">
                  <Defs>
                    <LinearGradient id="pillFace" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor={colors.navPillTop} />
                      <Stop offset="1" stopColor={colors.navPillBottom} />
                    </LinearGradient>
                  </Defs>
                  <Rect x="0" y="0" width="10" height="10" fill="url(#pillFace)" />
                </Svg>
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
                  accessibilityLabel={route.name === 'cart' && cart.count > 0 ? `${tab.label}, ${cart.count} sản phẩm` : tab.label}
                  onPressIn={() => setPressedKey(route.key)}
                  onPressOut={() => setPressedKey(null)}
                  onPress={() => {
                    // Phát sự kiện tabPress như tab bar mặc định: Stack lồng bên trong tự lắng nghe —
                    // bấm lại tab ĐANG mở thì Stack về màn đầu (popToTop).
                    // Chuyển sang tab khác thì giữ nguyên màn con đang xem của tab cũ.
                    const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                    if (!active && !event.defaultPrevented) navigateToTab(route.key);
                  }}
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
                        <Icon name={tab.icon} color={colors.navIcon} />
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
                        <Icon name={tab.icon} color={colors.navOn} duotone />
                      </Animated.View>
                      {route.name === 'cart' && cart.count > 0 ? <CartDot count={cart.count} /> : null}
                    </View>
                    <Animated.Text
                      style={[
                        type.label,
                        styles.label,
                        {
                          width: labelW[route.name],
                          color: colors.navOn,
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

/**
 * Dấu chấm vàng trên icon tab Giỏ hàng (không ghi số): vòng sóng lan ra định kỳ để gây chú ý,
 * nảy mạnh một lần mỗi khi số món thay đổi. Giảm chuyển động → chỉ chấm tĩnh.
 */
function CartDot({ count }: { count: number }) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const pop = useRef(new Animated.Value(1)).current;
  const ping = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced) return;
    pop.setValue(0.3);
    Animated.spring(pop, { toValue: 1, stiffness: 300, damping: 9, mass: 1, useNativeDriver: NATIVE_DRIVER }).start();
  }, [count, pop, reduced]);

  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(ping, { toValue: 1, duration: 1300, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE_DRIVER }),
        Animated.delay(900),
        Animated.timing(ping, { toValue: 0, duration: 0, useNativeDriver: NATIVE_DRIVER }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [ping, reduced]);

  return (
    <View pointerEvents="none" style={styles.dotWrap}>
      {!reduced && (
        <Animated.View
          style={[
            styles.dotRing,
            {
              backgroundColor: colors.spark500,
              opacity: ping.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }),
              transform: [{ scale: ping.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] }) }],
            },
          ]}
        />
      )}
      <Animated.View style={[styles.dot, { backgroundColor: colors.spark500, transform: [{ scale: pop }] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  dotWrap: { position: 'absolute', top: -2, right: -3, width: 9, height: 9, alignItems: 'center', justifyContent: 'center' },
  dotRing: { position: 'absolute', width: 9, height: 9, borderRadius: 5 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  hidden: { opacity: 0 },
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
  tabAbs: { position: 'absolute', top: 0, height: TAB_H, overflow: 'hidden', borderRadius: 9999 },
  tabStatic: { width: TAB_W, height: TAB_H, overflow: 'hidden' },
  tabPress: { flex: 1 },
  tabContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: ICON, height: ICON },
  label: { marginLeft: 8, flexShrink: 0 },
});