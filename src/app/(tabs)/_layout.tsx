import Tabs from 'expo-router/js-tabs';

import { BottomBar } from '@/components/BottomBar';
import { useTheme } from '@/theme/ThemeProvider';

export default function TabsLayout() {
  const { colors } = useTheme();
  // DocumentsProvider (trạng thái đã lưu / bảng cách mở tài liệu) bọc ở root layout để cả màn ngoài tab (trang sách) dùng chung.
  return (
      <Tabs
        tabBar={(props) => <BottomBar {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: colors.bg },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Trang chủ' }} />
        <Tabs.Screen name="courses" options={{ title: 'Khoá học' }} />
        <Tabs.Screen name="documents" options={{ title: 'Tài liệu' }} />
        <Tabs.Screen name="profile" options={{ title: 'Hồ sơ' }} />
      </Tabs>
  );
}