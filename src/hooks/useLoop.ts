import { useContext, useEffect, useRef } from 'react';
import { Animated, Easing, Platform } from 'react-native';

import { LoopActiveContext } from './LoopScope';
import { useReducedMotion } from './useReducedMotion';

export const NATIVE_DRIVER = Platform.OS !== 'web';

type LoopKind =
  /** 0 → 1 → 0, ease-in-out (float, bob, eq, twinkle). */
  | 'pingpong'
  /** 0 → 1 rồi về 0 ngay (ping). */
  | 'forward'
  /** Đứng yên 80% thời gian rồi "nảy" (pop của badge). */
  | 'pop';

/**
 * Trả về một Animated.Value chạy lặp vô hạn trong khoảng [0, 1].
 * Tự dừng (giá trị 0) khi hệ thống bật giảm chuyển động, khi `active` = false,
 * hoặc khi màn chứa nó không được focus (xem <LoopScope> bọc ở các file route).
 */
export function useLoop(
  duration: number,
  { kind = 'pingpong', delay = 0, active = true }: { kind?: LoopKind; delay?: number; active?: boolean } = {},
) {
  const value = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();
  const scopeActive = useContext(LoopActiveContext);
  const running = active && scopeActive;

  useEffect(() => {
    if (reduced || !running) {
      value.setValue(0);
      return;
    }
    const ease = Easing.inOut(Easing.ease);
    let cycle: Animated.CompositeAnimation;

    if (kind === 'pingpong') {
      cycle = Animated.sequence([
        Animated.timing(value, { toValue: 1, duration: duration / 2, easing: ease, useNativeDriver: NATIVE_DRIVER }),
        Animated.timing(value, { toValue: 0, duration: duration / 2, easing: ease, useNativeDriver: NATIVE_DRIVER }),
      ]);
    } else if (kind === 'forward') {
      cycle = Animated.sequence([
        Animated.timing(value, { toValue: 1, duration, easing: Easing.out(Easing.ease), useNativeDriver: NATIVE_DRIVER }),
        Animated.timing(value, { toValue: 0, duration: 0, useNativeDriver: NATIVE_DRIVER }),
      ]);
    } else {
      // pop: 0–80% đứng yên, 88% phóng to, 94% thu nhỏ, 100% về 1
      // value: 0 = scale 1, 1 = scale 1.18, -1 = scale 0.95 (xem interpolate ở Badge)
      cycle = Animated.sequence([
        Animated.delay(duration * 0.8),
        Animated.timing(value, { toValue: 1, duration: duration * 0.08, easing: ease, useNativeDriver: NATIVE_DRIVER }),
        Animated.timing(value, { toValue: -1, duration: duration * 0.06, easing: ease, useNativeDriver: NATIVE_DRIVER }),
        Animated.timing(value, { toValue: 0, duration: duration * 0.06, easing: ease, useNativeDriver: NATIVE_DRIVER }),
      ]);
    }

    const loop = Animated.loop(cycle);
    const timer = setTimeout(() => loop.start(), delay);
    return () => {
      clearTimeout(timer);
      loop.stop();
    };
  }, [duration, kind, delay, reduced, running, value]);

  return value;
}