import { StyleSheet, Text, View } from 'react-native';

import { groupThousands } from '@/data/profile';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/typography';

/**
 * Khối số dư "Số xu hiện có" — chỉ là THÔNG TIN: phẳng (nền nhạt + viền mảnh), không bóng / mép 3D, không icon,
 * không chevron, để người dùng không tưởng bấm được. Không quy đổi tiền, không dùng chữ "credit".
 */
export function CoinBalanceCard({ coins }: { coins: number }) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.box, { backgroundColor: colors.amberChip, borderColor: colors.amberChipLine }]}
      accessible
      accessibilityLabel={`Số xu hiện có: ${groupThousands(coins)} xu`}
    >
      <Text style={[styles.label, { color: colors.amberChipText }]}>Số xu hiện có</Text>
      <Text style={[styles.value, { color: colors.ink900 }]} numberOfLines={1} adjustsFontSizeToFit>
        {groupThousands(coins)}
        <Text style={[styles.unit, { color: colors.ink600 }]}> xu</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 20, paddingVertical: 16, gap: 2 },
  label: { fontFamily: fonts.sans600, fontSize: 13, lineHeight: 18 },
  value: { fontFamily: fonts.display700, fontSize: 36, lineHeight: 44 },
  unit: { fontFamily: fonts.sans600, fontSize: 17 },
});
