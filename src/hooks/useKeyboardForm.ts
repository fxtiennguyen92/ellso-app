import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, type LayoutChangeEvent, type ScrollViewInstance } from 'react-native';

/**
 * Form có bàn phím (dùng cùng <KeyboardAvoidingView behavior="padding">):
 * - Bàn phím bật / bấm vào ô → cuộn để ô đang nhập nằm trong vùng nhìn thấy (KeyboardAvoidingView chỉ thu nhỏ khung,
 *   không tự cuộn tới ô).
 * - `keyboardOpen`: để bỏ khoảng trống home indicator dưới nút khi bàn phím đang che phần đó.
 * Dùng: `ref={form.scrollRef}` cho ScrollView; bọc mỗi ô bằng `<View {...form.field('ten-o').wrap}>` và truyền
 * `onFocus={form.field('ten-o').onFocus}` vào ô nhập. Ô phải là con trực tiếp của nội dung ScrollView (toạ độ y đo theo đó).
 */
export function useKeyboardForm() {
  const scrollRef = useRef<ScrollViewInstance>(null);
  const ys = useRef<Record<string, number>>({});
  const focused = useRef<string | null>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const reveal = useCallback(() => {
    const key = focused.current;
    const y = key ? ys.current[key] : undefined;
    if (y == null) return;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true });
  }, []);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardOpen(true);
      reveal();
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, [reveal]);

  const field = useCallback(
    (key: string) => ({
      wrap: { onLayout: (e: LayoutChangeEvent) => (ys.current[key] = e.nativeEvent.layout.y) },
      onFocus: () => {
        focused.current = key;
        // bàn phím đã mở sẵn (chuyển ô) → không có keyboardDidShow, tự cuộn sau khi khung đổi xong
        setTimeout(reveal, 250);
      },
    }),
    [reveal],
  );

  return { scrollRef, keyboardOpen, field };
}
