import { type RefObject, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, type ScrollViewInstance } from 'react-native';

/** Kéo quá ngưỡng này (px, sau khi đã giảm lực) rồi thả thì làm mới. */
export const PULL_TRIGGER = 64;
const PULL_MAX = 110;
const HOLD = 52; // khoảng hở giữ lại trong lúc đang tải

/**
 * Kéo xuống để làm mới cho WEB (react-native-web không có RefreshControl).
 * Ở đầu danh sách (scrollTop = 0) mà kéo xuống (chạm hoặc giữ chuột) → nội dung trượt theo tay (giảm lực 0.5),
 * thả quá ngưỡng thì gọi onRefresh, giữ khoảng hở có vòng quay đến khi xong rồi trượt về.
 * Native: không làm gì — dùng <RefreshControl> có sẵn.
 * Trả về: pull (Animated.Value, px — dùng cho translateY nội dung + chỉ báo) và refreshing.
 */
export function usePullToRefresh(ref: RefObject<ScrollViewInstance | null>, onRefresh: () => Promise<unknown>) {
  const pull = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = useState(false);
  const busy = useRef(false);
  const cb = useRef(onRefresh);
  cb.current = onRefresh;

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = ref.current?.getScrollableNode?.() as unknown as HTMLElement | undefined;
    if (!node) return;

    let startY: number | null = null;
    let dist = 0;
    const settle = (to: number) => Animated.timing(pull, { toValue: to, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();

    const begin = (y: number) => {
      if (busy.current || node.scrollTop > 0) return;
      startY = y;
      dist = 0;
    };
    const move = (y: number, e: Event) => {
      if (startY === null) return;
      const dy = y - startY;
      if (dy <= 0 || node.scrollTop > 0) {
        if (dist > 0) pull.setValue(0);
        dist = 0;
        return;
      }
      if (e.cancelable) e.preventDefault(); // chặn cuộn / kéo-dội của trình duyệt khi đang kéo làm mới
      if (dist === 0) {
        // Kéo bằng chuột: không bôi đen chữ trong lúc kéo
        node.style.userSelect = 'none';
        window.getSelection?.()?.removeAllRanges();
      }
      dist = Math.min(PULL_MAX, dy * 0.5);
      pull.setValue(dist);
    };
    const end = () => {
      if (startY === null) return;
      startY = null;
      node.style.userSelect = '';
      if (dist < PULL_TRIGGER) {
        settle(0);
        return;
      }
      busy.current = true;
      setRefreshing(true);
      settle(HOLD);
      Promise.resolve(cb.current())
        .catch(() => null)
        .finally(() => {
          busy.current = false;
          setRefreshing(false);
          settle(0);
        });
    };

    const onTouchStart = (e: TouchEvent) => begin(e.touches[0].clientY);
    const onTouchMove = (e: TouchEvent) => move(e.touches[0].clientY, e);
    const onMouseDown = (e: MouseEvent) => e.button === 0 && begin(e.clientY);
    const onMouseMove = (e: MouseEvent) => move(e.clientY, e);

    node.addEventListener('touchstart', onTouchStart, { passive: true });
    node.addEventListener('touchmove', onTouchMove, { passive: false });
    node.addEventListener('touchend', end);
    node.addEventListener('touchcancel', end);
    node.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', end);
    return () => {
      node.removeEventListener('touchstart', onTouchStart);
      node.removeEventListener('touchmove', onTouchMove);
      node.removeEventListener('touchend', end);
      node.removeEventListener('touchcancel', end);
      node.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', end);
    };
  }, [ref, pull]);

  return { pull, refreshing };
}
