import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/typography';

/** Khối có tiêu đề nhỏ in hoa (+ nút phụ bên phải) dùng cho các màn con của Hồ sơ (Thông tin cá nhân, Mật khẩu & Bảo mật). */
export function InfoSection({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.ink600 }]}>
          {title}
        </Text>
        {action}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 32, paddingHorizontal: 4 },
  title: { fontFamily: fonts.sans600, fontSize: 13, lineHeight: 18, textTransform: 'uppercase', letterSpacing: 0.6 },
});
