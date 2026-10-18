import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing } from 'react-native';

import { NATIVE_DRIVER } from '@/hooks/useLoop';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/** true khi splash bắt đầu mờ đi → các khối của màn Home lần lượt hiện ra. */
const RevealContext = createContext(true);

export function RevealProvider({ revealed, children }: { revealed: boolean; children: ReactNode }) {
  return <RevealContext.Provider value={revealed}>{children}</RevealContext.Provider>;
}

/**
 * Hiệu ứng xuất hiện của từng khối trên Home: trượt lên 24px + hiện dần,
 * khối sau trễ hơn khối trước 80ms.
 */
export function useRevealStyle(order: number, offset = 24) {
  const revealed = useContext(RevealContext);
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(revealed ? 1 : 0)).current;
  const started = useRef(revealed);

  useEffect(() => {
    if (!revealed || started.current) return;
    started.current = true;
    Animated.timing(progress, {
      toValue: 1,
      duration: reduced ? 200 : 560,
      delay: reduced ? 0 : 120 + order * 80,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  }, [revealed, reduced, order, progress]);

  return {
    opacity: progress,
    transform: [
      {
        translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [reduced ? 0 : offset, 0] }),
      },
    ],
  };
}
