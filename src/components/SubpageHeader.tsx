import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { useScreenTopInset } from '@/hooks/useScreenTopInset';
import { useTheme } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';

/** Thanh đầu trang con (ngoài tab): nút quay lại + tiêu đề; đã cuộn thì hiện đường kẻ mảnh phía dưới. */
export function SubpageHeader({ title, scrolled = false, fallback = '/profile' }: { title: string; scrolled?: boolean; fallback?: '/profile' | '/' }) {
  const { colors } = useTheme();
  const topInset = useScreenTopInset(8, 20);
  return (
    <View style={[styles.bar, { paddingTop: topInset, backgroundColor: colors.bg, borderBottomColor: scrolled ? colors.line : 'transparent' }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Quay lại"
        hitSlop={6}
        onPress={() => (router.canGoBack() ? router.back() : router.replace(fallback))}
        style={({ pressed }) => [styles.back, { backgroundColor: colors.card, borderColor: colors.line, opacity: pressed ? 0.7 : 1 }]}
      >
        <Icon name="chevronLeft" size={22} color={colors.ink900} />
      </Pressable>
      <Text accessibilityRole="header" style={[type.h2, styles.title, { color: colors.ink900 }]} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth, zIndex: 10 },
  back: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, minWidth: 0 },
});
