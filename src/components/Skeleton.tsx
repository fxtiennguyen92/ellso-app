import { createContext, type ReactNode, useContext } from 'react';
import { Animated, type DimensionValue, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { useLoop } from '@/hooks/useLoop';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Skeleton khi đang tải dữ liệu (quy tắc: chỗ nào chắc chắn sẽ có dữ liệu thì hiện skeleton đúng hình bố cục thật,
 * không dùng vòng xoay). Spinner chỉ còn cho nút đang xử lý và trình phát / trình đọc media.
 *
 * <Skeleton> bọc một nhóm khối, dùng chung MỘT nhịp sáng–mờ (một animation cho cả nhóm, không mỗi khối một cái);
 * <Bone> là một khối xám bo góc. Giảm chuyển động → đứng yên.
 */
const PulseContext = createContext<Animated.AnimatedInterpolation<number> | null>(null);

export function Skeleton({ children, style, label = 'Đang tải' }: { children: ReactNode; style?: StyleProp<ViewStyle>; label?: string }) {
  const v = useLoop(1200);
  const opacity = v.interpolate({ inputRange: [0, 1], outputRange: [1, 0.45] });
  return (
    <PulseContext.Provider value={opacity}>
      <View accessible accessibilityRole="progressbar" accessibilityLabel={label} style={style}>
        {children}
      </View>
    </PulseContext.Provider>
  );
}

export function Bone({
  w = '100%',
  h = 14,
  r = 8,
  style,
  children,
}: {
  w?: DimensionValue;
  /** null = không đặt chiều cao (dùng aspectRatio trong style). */
  h?: DimensionValue | null;
  r?: number;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}) {
  const { colors } = useTheme();
  const opacity = useContext(PulseContext) ?? 1;
  return <Animated.View style={[{ width: w, ...(h === null ? null : { height: h }), borderRadius: r, backgroundColor: colors.line, opacity }, style]}>{children}</Animated.View>;
}

/** Vài dòng chữ (dòng cuối ngắn hơn). */
export function BoneLines({ lines = 3, h = 12, gap = 8, last = '60%' }: { lines?: number; h?: number; gap?: number; last?: DimensionValue }) {
  return (
    <View style={{ gap }}>
      {Array.from({ length: lines }, (_, i) => (
        <Bone key={i} h={h} w={i === lines - 1 && lines > 1 ? last : '100%'} />
      ))}
    </View>
  );
}

/** Khung thẻ (nền card, viền mảnh) để bọc các Bone — giống thẻ thật nhưng phẳng. */
export function SkeletonCard({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
});
