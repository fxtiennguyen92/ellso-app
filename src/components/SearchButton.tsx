import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { useTheme } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';

/** Ô tìm kiếm giả: chỉ là nút, bấm vào mở trang tìm kiếm riêng (/search). */
export function SearchButton({ placeholder }: { placeholder: string }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="search"
      accessibilityLabel={placeholder.replace('…', '')}
      accessibilityHint="Mở trang tìm kiếm"
      onPress={() => router.push('/search')}
      style={({ pressed, hovered }) => [
        styles.search,
        {
          backgroundColor: colors.card,
          borderColor: pressed || hovered ? colors.emerald700 : colors.line,
          boxShadow: colors.shadowCard,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
      ]}
    >
      <Icon name="search" size={20} color={colors.ink600} />
      <Text style={[type.input, styles.placeholder, { color: colors.ink600 }]} numberOfLines={1}>
        {placeholder}
      </Text>
      <View style={[styles.filter, { backgroundColor: colors.mint50 }]}>
        <Icon name="filter" size={18} color={colors.emerald700} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    paddingLeft: 16,
    paddingRight: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  placeholder: { flex: 1, minWidth: 0 },
  filter: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});