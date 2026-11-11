import { useFocusEffect } from 'expo-router';
import { type RefObject, useCallback, useRef } from 'react';
import { Platform, type ScrollViewInstance } from 'react-native';

/**
 * Giữ vị trí cuộn của một màn khi mở màn khác chồng lên rồi quay lại.
 * Web: màn bên dưới bị ẩn (display: none) nên trình duyệt đưa vùng cuộn về 0 → khi màn được focus lại thì cuộn về chỗ cũ.
 * Gọi `track(y)` trong onScroll. Native giữ sẵn vị trí nên hook không làm gì.
 */
export function useKeepScroll(ref: RefObject<ScrollViewInstance | null>) {
  const lastY = useRef(0);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'web' || lastY.current <= 0) return;
      const y = lastY.current;
      // Chờ màn hiện lại (display) rồi mới cuộn
      const id = requestAnimationFrame(() => ref.current?.scrollTo({ y, animated: false }));
      return () => cancelAnimationFrame(id);
    }, [ref]),
  );

  return useCallback((y: number) => {
    lastY.current = y;
  }, []);
}
