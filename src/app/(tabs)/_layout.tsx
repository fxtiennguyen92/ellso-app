import { router } from 'expo-router';
import Tabs from 'expo-router/js-tabs';

import { BottomBar } from '@/components/BottomBar';
import { DocumentsProvider } from '@/components/documents/DocumentsContext';
import { useTheme } from '@/theme/ThemeProvider';

export default function TabsLayout() {
  const { colors } = useTheme();
  // DocumentsProvider bọc cả 4 tab: Home (mục Sách) và tab Tài liệu dùng chung trạng thái đã lưu / bảng cách mở.
  return (
    <DocumentsProvider onView={(doc) => router.push(`/documents/view/${doc.id}`)}>
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
    </DocumentsProvider>
  );
}