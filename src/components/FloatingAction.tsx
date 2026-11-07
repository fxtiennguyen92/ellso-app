import { Children, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';

const BUTTON_H = 52;
/** Lề trái / phải của nút = khoảng cách tới mép dưới màn (máy có thanh home: lấy insets.bottom nếu lớn hơn). */
export const FLOATING_EDGE = 20;

/**
 * Nút chính ở đáy màn — NỔI trên nội dung (không làm thanh footer có nền / đường kẻ).
 * Đặt làm con của một View `flex: 1` chứa luôn ScrollView (nằm TRONG KeyboardAvoidingView), để khi bàn phím mở
 * khung co lại và nút nổi ngay trên bàn phím. ScrollView nhớ chừa `paddingBottom: floatingActionSpace(insets.bottom)`.
 * Cách mép dưới = FLOATING_EDGE (bằng lề trái / phải); keyboardOpen (từ useKeyboardForm): bàn phím đang che thanh home
 * → cách mép trên bàn phím đúng FLOATING_EDGE.
 */
export function FloatingAction({ children, keyboardOpen = false, row = false }: { children: ReactNode; keyboardOpen?: boolean; row?: boolean }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: keyboardOpen ? FLOATING_EDGE : Math.max(insets.bottom, FLOATING_EDGE) }]}>
      {/* Bóng đổ gắn vào TỪNG nút (không bọc chung một khối quanh nhiều nút). row: các nút nằm ngang, chia đều. */}
      <View style={row ? styles.row : styles.col}>
        {Children.toArray(children).map((child, i) => (
          <View key={i} style={[styles.shadow, row && styles.cell, { boxShadow: colors.floatShadow }]}>
            {child}
          </View>
        ))}
      </View>
    </View>
  );
}

/** Khoảng cần chừa cuối nội dung cuộn để nút nổi không che dòng cuối. */
export const floatingActionSpace = (bottomInset: number) => BUTTON_H + Math.max(bottomInset, FLOATING_EDGE) + 24;

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: FLOATING_EDGE, right: FLOATING_EDGE, gap: 8 },
  shadow: { borderRadius: 16 },
  col: { gap: 8 },
  row: { flexDirection: 'row', gap: 10 },
  cell: { flex: 1 },
});
