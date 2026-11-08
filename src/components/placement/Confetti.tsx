import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';

import { NATIVE_DRIVER } from '@/hooks/useLoop';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const COLORS = ['#10b981', '#34d399', '#fbbf24', '#f59e0b', '#fb7185', '#60a5fa', '#a78bfa', '#ffffff'];

/** Pháo giấy rơi một lượt khi mở màn (chúc mừng). Tắt khi máy bật "Giảm chuyển động". Không chặn chạm. */
export function Confetti({ count = 42, delay = 250 }: { count?: number; delay?: number }) {
  const { width, height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: Math.random() * width,
        drift: (Math.random() - 0.5) * 160,
        size: 6 + Math.random() * 7,
        long: Math.random() > 0.5,
        round: Math.random() > 0.75,
        color: COLORS[i % COLORS.length],
        spin: (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 540),
        duration: 2200 + Math.random() * 1600,
        start: Math.random() * 700,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count],
  );
  const values = useRef(pieces.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (reduced) return;
    Animated.parallel(
      values.map((v, i) =>
        Animated.timing(v, { toValue: 1, duration: pieces[i].duration, delay: delay + pieces[i].start, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE_DRIVER }),
      ),
    ).start();
  }, [reduced, values, pieces, delay]);

  if (reduced) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => {
        const v = values[i];
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: p.x,
              top: -20,
              width: p.size,
              height: p.long ? p.size * 1.8 : p.size,
              borderRadius: p.round ? p.size : 2,
              backgroundColor: p.color,
              opacity: v.interpolate({ inputRange: [0, 0.05, 0.8, 1], outputRange: [0, 1, 1, 0] }),
              transform: [
                { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, height * 0.95] }) },
                { translateX: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, p.drift, p.drift * 0.6] }) },
                { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.spin}deg`] }) },
              ],
            }}
          />
        );
      })}
    </View>
  );
}
