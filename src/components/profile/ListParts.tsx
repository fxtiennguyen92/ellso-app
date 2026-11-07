import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { dmy } from '@/data/profile';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/typography';

/** "Hôm nay" · "Hôm qua" · "05/11/2026" */
export function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const y = new Date();
  y.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Hôm nay';
  if (d.toDateString() === y.toDateString()) return 'Hôm qua';
  return dmy(iso);
}

export const hhmm = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/** Chân danh sách tải thêm: đang tải / hết / lỗi tải lần đầu (nút thử lại). */
export function ListFooter({ loading, error, done, empty, onRetry }: { loading: boolean; error: boolean; done: boolean; empty: boolean; onRetry: () => void }) {
  const { colors } = useTheme();
  if (error)
    return (
      <Pressable accessibilityRole="button" onPress={onRetry} style={styles.footer} hitSlop={8}>
        <Text style={[type.label, { color: colors.emerald700 }]}>Không tải được. Thử lại</Text>
      </Pressable>
    );
  if (loading)
    return (
      <View style={styles.footer}>
        <ActivityIndicator color={colors.emerald700} />
      </View>
    );
  if (done && !empty)
    return (
      <View style={styles.footer}>
        <Text style={[type.caption, { color: colors.ink400 }]}>Đã hiển thị tất cả</Text>
      </View>
    );
  return null;
}

/** Tiêu đề nhóm theo ngày trong danh sách dài. */
export function DayHeader({ label }: { label: string }) {
  const { colors } = useTheme();
  return <Text style={[styles.day, { color: colors.ink600 }]}>{label}</Text>;
}

const styles = StyleSheet.create({
  footer: { minHeight: 56, alignItems: 'center', justifyContent: 'center' },
  day: { fontFamily: fonts.sans600, fontSize: 13, lineHeight: 18, paddingTop: 12, paddingBottom: 6, paddingHorizontal: 4 },
});
