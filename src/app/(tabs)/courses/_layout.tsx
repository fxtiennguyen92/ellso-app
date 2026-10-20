import { Stack } from 'expo-router';

import { useTheme } from '@/theme/ThemeProvider';

/** Tab Khoá học có ngăn xếp riêng: danh sách → lộ trình học của một khoá. */
export const unstable_settings = {
  // Mở thẳng /courses/[id] (vd. từ Home) thì nút quay lại vẫn về danh sách
  anchor: 'index',
};

export default function CoursesLayout() {
  const { colors } = useTheme();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />;
}