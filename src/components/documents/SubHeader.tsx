import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { useScreenTopInset } from '@/hooks/useScreenTopInset';
import { useTheme } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';

type Props = {
  title: string;
  /** Ô tìm đang mở (bấm kính lúp để bật/tắt). */
  searchOpen: boolean;
  onToggleSearch: () => void;
  query: string;
  onQuery: (q: string) => void;
  placeholder: string;
  scrolled: boolean;
  /** Nội dung thêm dưới hàng tiêu đề (chip chủ đề, tab…). */
  children?: ReactNode;
};

/** Header dính của các màn con trong Tài liệu: quay lại · tiêu đề · kính lúp (mở ô tìm ngay tại chỗ). */
export function SubHeader({ title, searchOpen, onToggleSearch, query, onQuery, placeholder, scrolled, children }: Props) {
  const { colors } = useTheme();
  const topInset = useScreenTopInset(12, 28);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/documents'));

  return (
    <View style={[styles.header, { paddingTop: topInset, backgroundColor: colors.bg, borderBottomColor: scrolled ? colors.line : 'transparent' }]}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại Tài liệu"
          onPress={back}
          style={({ pressed }) => [styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.line, opacity: pressed ? 0.7 : 1 }]}
        >
          <Icon name="chevronLeft" color={colors.ink900} />
        </Pressable>

        {searchOpen ? (
          <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.emerald700 }]}>
            <Icon name="search" size={18} color={colors.ink600} />
            <TextInput
              autoFocus
              value={query}
              onChangeText={onQuery}
              placeholder={placeholder}
              placeholderTextColor={colors.ink600}
              accessibilityLabel={placeholder}
              returnKeyType="search"
              style={[type.input, styles.input, { color: colors.ink900 }]}
            />
          </View>
        ) : (
          <Text accessibilityRole="header" style={[type.sectionTitle, styles.title, { color: colors.ink900 }]} numberOfLines={1}>
            {title}
          </Text>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={searchOpen ? 'Đóng tìm kiếm' : placeholder}
          onPress={() => {
            if (searchOpen) onQuery('');
            onToggleSearch();
          }}
          style={({ pressed }) => [styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.line, opacity: pressed ? 0.7 : 1 }]}
        >
          <Icon name={searchOpen ? 'close' : 'search'} size={20} color={colors.ink900} />
        </Pressable>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingBottom: 12, gap: 14, borderBottomWidth: 1, zIndex: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20 },
  title: { flex: 1, minWidth: 0 },
  iconBtn: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  search: { flex: 1, minWidth: 0, height: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1.5 },
  input: { flex: 1, minWidth: 0, height: '100%', paddingVertical: 0, ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null) },
});