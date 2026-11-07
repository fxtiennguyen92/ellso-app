import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';

const BUTTON_H = 52;
const GAP = 12;

/**
 * Nút chính ở đáy màn — NỔI trên nội dung (không làm thanh footer có nền / đường kẻ).
 * Đặt làm con của một View `flex: 1` chứa luôn ScrollView (nằm TRONG KeyboardAvoidingView), để khi bàn phím mở
 * khung co lại và nút nổi ngay trên bàn phím. ScrollView nhớ chừa `paddingBottom: floatingActionSpace(insets.bottom)`.
 * keyboardOpen (từ useKeyboardForm): bàn phím đang che phần home indicator → bỏ khoảng đó.
 */
export function FloatingAction({ children, keyboardOpen = false }: { children: ReactNode; keyboardOpen?: boolean }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: keyboardOpen ? GAP : Math.max(insets.bottom, GAP) }]}>
      <View style={[styles.shadow, { boxShadow: colors.floatShadow }]}>{children}</View>
    </View>
  );
}

/** Khoảng cần chừa cuối nội dung cuộn để nút nổi không che dòng cuối. */
export const floatingActionSpace = (bottomInset: number) => BUTTON_H + Math.max(bottomInset, GAP) + 28;

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 20, right: 20, gap: 8 },
  shadow: { borderRadius: 16 },
});
