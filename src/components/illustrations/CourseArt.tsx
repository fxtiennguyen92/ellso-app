import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

import type { CourseIllustration } from '@/data/home';
import type { ExploreIllustration } from '@/data/courses';
import { NATIVE_DRIVER, useLoop } from '@/hooks/useLoop';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { illo } from '@/theme/tokens';

import { BulbIllustration, TrophyIllustration, WebIllustration } from './Illustrations';

/** Nền gradient vẽ bằng SVG (RN không có CSS gradient). */
function Grad({
  id,
  from,
  to,
  radius = 0,
  angle = 'down',
  radial,
}: {
  id: string;
  from: string;
  to: string;
  radius?: number;
  angle?: 'down' | 'diag' | 'right';
  radial?: boolean;
}) {
  const v = { down: [0, 0, 0, 1], diag: [0.15, 0, 0.85, 1], right: [0, 0, 1, 0] }[angle];
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
      <Defs>
        {radial ? (
          <RadialGradient id={id} cx="35%" cy="30%" r="75%">
            <Stop offset="0" stopColor={from} />
            <Stop offset="1" stopColor={to} />
          </RadialGradient>
        ) : (
          <LinearGradient id={id} x1={v[0]} y1={v[1]} x2={v[2]} y2={v[3]}>
            <Stop offset="0" stopColor={from} />
            <Stop offset="1" stopColor={to} />
          </LinearGradient>
        )}
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" rx={radius} fill={`url(#${id})`} />
    </Svg>
  );
}

const bobStyle = (v: Animated.Value) => ({
  transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) }],
});

// ------------------------------------------------------------------ Khám phá

/** Hai bong bóng chat. */
export function ChatArt() {
  const v = useLoop(3000);
  return (
    <Animated.View style={[{ width: 100, height: 76 }, bobStyle(v)]}>
      <View style={[styles.abs, { left: 0, top: 4, width: 62, height: 44, borderRadius: 16, overflow: 'hidden', boxShadow: `0px 5px 0px ${illo.chatEdge}` }]}>
        <Grad id="chat" from={illo.chatHi} to={illo.chatLo} angle="diag" />
        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.dot} />
          ))}
        </View>
      </View>
      <View style={[styles.abs, styles.tailLeft, { left: 12, top: 46, borderTopColor: illo.chatLo }]} />
      <View style={[styles.abs, { right: 0, top: 26, width: 52, height: 38, borderRadius: 14, overflow: 'hidden', boxShadow: `0px 5px 0px ${illo.metalLo}` }]}>
        <Grad id="chat2" from={illo.white} to={illo.metalHi} angle="diag" />
      </View>
      <View style={[styles.abs, styles.tailRight, { right: 10, top: 62, borderTopColor: illo.metalHi }]} />
    </Animated.View>
  );
}

/** Đồng hồ có kim giây quay. */
export function ClockArt() {
  const v = useLoop(3400, { delay: 600 });
  const reduced = useReducedMotion();
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 6000, easing: Easing.linear, useNativeDriver: NATIVE_DRIVER }),
    );
    loop.start();
    return () => loop.stop();
  }, [reduced, spin]);

  return (
    <Animated.View style={[{ width: 76, height: 80 }, bobStyle(v)]}>
      <View style={[styles.abs, { left: 4, top: 4, width: 68, height: 68, borderRadius: 34, overflow: 'hidden', boxShadow: `0px 6px 0px ${illo.clockEdge}` }]}>
        <Grad id="clock" from={illo.clockHi} to={illo.clockLo} radial />
      </View>
      <View style={[styles.abs, { left: 14, top: 14, width: 48, height: 48, borderRadius: 24, backgroundColor: illo.white }]} />
      <View style={[styles.abs, { left: 36.5, top: 22, width: 3, height: 17, borderRadius: 2, backgroundColor: illo.clockHand }]} />
      <Animated.View
        style={[
          styles.abs,
          {
            left: 36.5,
            top: 24,
            width: 3,
            height: 30,
            transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }],
          },
        ]}
      >
        <View style={{ width: 3, height: 15, borderRadius: 2, backgroundColor: illo.clockLo }} />
      </Animated.View>
      <View style={[styles.abs, { left: 33.5, top: 34.5, width: 9, height: 9, borderRadius: 5, backgroundColor: illo.clockHand }]} />
    </Animated.View>
  );
}

function Bar({ h, from, to, delay }: { h: number; from: string; to: string; delay: number }) {
  const v = useLoop(2400, { delay });
  return (
    <Animated.View
      style={{
        width: 20,
        height: h,
        borderTopLeftRadius: 6,
        borderTopRightRadius: 6,
        borderBottomLeftRadius: 3,
        borderBottomRightRadius: 3,
        overflow: 'hidden',
        boxShadow: `0px 5px 0px ${illo.barEdge}`,
        transformOrigin: 'bottom',
        transform: [{ scaleY: v.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] }) }],
      }}
    >
      <Grad id={`bar${h}`} from={from} to={to} angle="right" />
    </Animated.View>
  );
}

/** Biểu đồ cột mọc lên. */
export function BarsArt() {
  return (
    <View style={{ width: 84, height: 76, flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingBottom: 6 }}>
      <Bar h={30} from={illo.bar1} to={illo.bar2} delay={0} />
      <Bar h={48} from={illo.bar2} to={illo.bar3} delay={300} />
      <Bar h={64} from={illo.bar1} to={illo.bar3} delay={600} />
    </View>
  );
}

/** Quả địa cầu. */
export function GlobeArt() {
  const v = useLoop(3000);
  return (
    <Animated.View style={[{ width: 76, height: 80 }, bobStyle(v)]}>
      <View style={[styles.abs, { left: 4, top: 2, width: 68, height: 68, borderRadius: 34, overflow: 'hidden', boxShadow: `0px 6px 0px ${illo.globeEdge}` }]}>
        <Grad id="globe" from={illo.globeHi} to={illo.globeLo} radial />
        <View style={[styles.abs, { left: 20, top: -2, width: 28, height: 72, borderRadius: 36, borderWidth: 2, borderColor: illo.globeLine }]} />
        <View style={[styles.abs, { left: -2, top: 22, width: 72, height: 24, borderRadius: 12, borderWidth: 2, borderColor: illo.globeLine }]} />
        <View style={[styles.abs, { left: 0, top: 33, width: 68, height: 2, backgroundColor: illo.globeLine }]} />
      </View>
    </Animated.View>
  );
}

export const exploreArt: Record<ExploreIllustration, () => React.JSX.Element> = {
  chat: ChatArt,
  clock: ClockArt,
  bars: BarsArt,
  globe: GlobeArt,
};

// ------------------------------------------------------------------ Ô nhỏ 64px (Đang học)

const bigArt: Record<CourseIllustration, () => React.JSX.Element> = {
  bulb: BulbIllustration,
  web: WebIllustration,
  trophy: TrophyIllustration,
};

/** Thu nhỏ minh hoạ khoá học vào ô 64×64. */
export function CourseThumb({ illustration, bg }: { illustration: CourseIllustration; bg: string }) {
  const Art = bigArt[illustration];
  return (
    <View style={[styles.thumb, { backgroundColor: bg }]}>
      <View style={{ transform: [{ scale: illustration === 'bulb' ? 0.56 : 0.66 }] }}>
        <Art />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  dots: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: illo.white },
  // Đuôi bong bóng: tam giác vẽ bằng border
  tailLeft: {
    width: 0,
    height: 0,
    borderTopWidth: 14,
    borderRightWidth: 14,
    borderRightColor: 'transparent',
  },
  tailRight: {
    width: 0,
    height: 0,
    borderTopWidth: 12,
    borderLeftWidth: 12,
    borderLeftColor: 'transparent',
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});