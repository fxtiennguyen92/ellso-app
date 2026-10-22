import { Stack } from 'expo-router';

import { useTheme } from '@/theme/ThemeProvider';

/**
 * Tab Tài liệu: một Stack riêng. DocumentsProvider (trạng thái đã lưu, bảng "Cách mở tài liệu", toast)
 * nằm ở (tabs)/_layout.tsx để Home (mục Sách) dùng chung.
 */
export const unstable_settings = {
  anchor: 'index',
};

export default function DocumentsLayout() {
  const { colors } = useTheme();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />;
}