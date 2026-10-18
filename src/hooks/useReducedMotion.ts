import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** true khi hệ thống bật "Giảm chuyển động" (iOS, Android, và prefers-reduced-motion trên web). */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => mounted && setReduced(value))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      mounted = false;
      sub?.remove?.();
    };
  }, []);

  return reduced;
}
