import { Stack } from 'expo-router';

import { useTheme } from '@/theme/ThemeProvider';

/** Tab Hồ sơ có ngăn xếp riêng: Hồ sơ → các trang con (thông tin cá nhân, quản lý gói…). */
export const unstable_settings = {
  anchor: 'index',
};

export default function ProfileLayout() {
  const { colors } = useTheme();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />;
}