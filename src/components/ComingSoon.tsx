import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';

/** Màn tạm cho các trang chưa làm. `back` = hiện nút quay lại (trang ngoài tab). */
export function ComingSoon({ title, back = false }: { title: string; back?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <Text accessibilityRole="header" style={[type.sectionTitle, { color: colors.ink900 }]}>
        {title}
      </Text>
      <Text style={[type.caption, { color: colors.ink600 }]}>Màn hình này sẽ làm ở bước sau.</Text>
      {back && (
        <Pressable
          accessibilityRole="button"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          style={({ pressed }) => [styles.back, { borderColor: pressed ? colors.emerald800 : colors.emerald700 }]}
        >
          <Text style={[type.label, { color: colors.emerald700 }]}>Quay lại</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, padding: 16 },
  back: { marginTop: 16, height: 44, paddingHorizontal: 20, borderRadius: 14, borderWidth: 1.5, justifyContent: 'center' },
});