import { type ReactNode, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SubpageHeader } from '@/components/SubpageHeader';
import { floatingActionSpace } from '@/components/FloatingAction';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Khung chung cho màn con của Hồ sơ không có ô nhập: header (nút quay lại + tiêu đề, kẻ mảnh khi cuộn) + nội dung cuộn.
 * `floating`: nút chính nổi ở đáy (FloatingAction) — nội dung chừa chỗ cho nút. `overlay`: sheet / toast vẽ trên cùng.
 */
export function SubpageShell({ title, children, floating, overlay }: { title: string; children: ReactNode; floating?: ReactNode; overlay?: ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [scrolled, setScrolled] = useState(false);
  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <SubpageHeader title={title} scrolled={scrolled} />
      <View style={styles.screen}>
        <ScrollView
          scrollEventThrottle={16}
          onScroll={(e) => setScrolled(e.nativeEvent.contentOffset.y > 4)}
          contentContainerStyle={[styles.content, { paddingBottom: floating ? floatingActionSpace(insets.bottom) : insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
        {floating}
      </View>
      {overlay}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingTop: 8, paddingHorizontal: 16, gap: 24 },
});
