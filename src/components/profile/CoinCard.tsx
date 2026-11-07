import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { Icon } from '@/components/Icon';
import { groupThousands } from '@/data/profile';
import { useTheme } from '@/theme/ThemeProvider';
import { illo } from '@/theme/tokens';
import { fonts, type } from '@/theme/typography';

/** Thẻ "Xu của bạn": đồng xu vàng + số xu (không quy đổi tiền, không dùng chữ "credit") + nút Lịch sử. */
export function CoinCard({ coins, onHistory }: { coins: number; onHistory: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line }]}>
      <CoinBadge />
      <View style={styles.grow}>
        <Text style={[type.caption, { color: colors.ink600 }]}>Số xu đang có</Text>
        <Text style={[styles.value, { color: colors.ink900 }]} numberOfLines={1} accessibilityLabel={`${groupThousands(coins)} xu`}>
          {groupThousands(coins)}
          <Text style={[styles.unit, { color: colors.ink600 }]}> xu</Text>
        </Text>
      </View>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Xem lịch sử xu"
        onPress={onHistory}
        hitSlop={6}
        style={({ pressed }) => [styles.history, { backgroundColor: colors.mint50, opacity: pressed ? 0.75 : 1 }]}
      >
        <Icon name="history" size={15} color={colors.emerald700} />
        <Text style={[type.captionStrong, { color: colors.emerald700 }]}>Lịch sử</Text>
      </Pressable>
    </View>
  );
}

/** Đồng xu vàng (gradient) chứa icon Lucide "coins". */
function CoinBadge() {
  return (
    <View style={[styles.coin, { boxShadow: `0px 4px 0px ${illo.goldEdge}` }]}>
      <Svg width={52} height={52} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="coinBg" x1="0.15" y1="0" x2="0.85" y2="1">
            <Stop offset="0" stopColor={illo.goldHi} />
            <Stop offset="1" stopColor={illo.goldLo} />
          </LinearGradient>
        </Defs>
        <Circle cx="26" cy="26" r="26" fill="url(#coinBg)" />
      </Svg>
      {/* bọc để icon nằm trên lớp gradient (web vẽ lớp absolute đè phần tử thường) */}
      <View style={styles.onTop}>
        <Icon name="coins" size={24} strokeWidth={2.2} color={illo.goldEdge} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 20, borderWidth: 1 },
  grow: { flex: 1, minWidth: 0 },
  coin: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  onTop: { position: 'relative', zIndex: 1 },
  value: { fontFamily: fonts.display700, fontSize: 28, lineHeight: 34 },
  unit: { fontFamily: fonts.sans600, fontSize: 15 },
  history: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, height: 34, borderRadius: 9999 },
});
