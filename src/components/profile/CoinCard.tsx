import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Icon } from '@/components/Icon';
import { groupThousands } from '@/data/profile';
import { illo } from '@/theme/tokens';
import { fonts } from '@/theme/typography';

/**
 * Thẻ số dư "Xu của tôi": nền vàng gradient + đồng xu lớn, số xu to (không quy đổi tiền, không dùng chữ "credit").
 * Lịch sử nằm ngay bên dưới thẻ (CoinsScreen) nên thẻ không còn nút Lịch sử.
 */
export function CoinBalanceCard({ coins }: { coins: number }) {
  return (
    <View style={[styles.card, { boxShadow: `0px 5px 0px ${illo.goldEdge}` }]} accessible accessibilityLabel={`Bạn đang có ${groupThousands(coins)} xu`}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="coinCardBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={illo.goldHi} />
            <Stop offset="0.55" stopColor={illo.goldMid} />
            <Stop offset="1" stopColor={illo.goldLo} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#coinCardBg)" />
      </Svg>
      {/* vòng trang trí góc phải */}
      <Svg width={220} height={220} style={styles.rings} pointerEvents="none">
        {[50, 80, 110].map((r) => (
          <Circle key={r} cx={160} cy={60} r={r} stroke={illo.goldHi} strokeOpacity={0.55} strokeWidth={1.4} fill="none" />
        ))}
      </Svg>

      <View style={styles.row}>
        <View style={styles.grow}>
          <Text style={[styles.label, { color: illo.goldInk }]}>Số xu hiện có</Text>
          <Text style={[styles.value, { color: illo.goldInk }]} numberOfLines={1} adjustsFontSizeToFit>
            {groupThousands(coins)}
            <Text style={styles.unit}> xu</Text>
          </Text>
        </View>
        <View style={[styles.coin, { backgroundColor: illo.goldHi, borderColor: illo.goldEdge }]}>
          <Icon name="coins" size={30} strokeWidth={2.2} color={illo.goldEdge} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, overflow: 'hidden', paddingHorizontal: 20, paddingVertical: 22 },
  rings: { position: 'absolute', top: -30, right: -40 },
  row: { position: 'relative', zIndex: 1, flexDirection: 'row', alignItems: 'center', gap: 16 },
  grow: { flex: 1, minWidth: 0 },
  label: { fontFamily: fonts.sans600, fontSize: 14, lineHeight: 20 },
  value: { fontFamily: fonts.display700, fontSize: 40, lineHeight: 50 },
  unit: { fontFamily: fonts.sans700, fontSize: 18 },
  coin: { width: 64, height: 64, borderRadius: 32, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
});
