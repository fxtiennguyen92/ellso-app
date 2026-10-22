import { router } from 'expo-router';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

import { Icon } from '@/components/Icon';
import { creditToVnd, type Profile } from '@/data/profile';
import { useLoop } from '@/hooks/useLoop';
import { useTheme } from '@/theme/ThemeProvider';
import { illo } from '@/theme/tokens';
import { fonts, type } from '@/theme/typography';

/** Logo "e" của Ellso (viewBox -11.3 23 209.2 209.2). */
const ELLSO_E =
  'M85.2 221.0C70.8 219.8 58.5 216.4 47.5 210.6C28.4 200.6 13.0 182.9 5.7 162.7C-2.1 141.4 -1.9 114.1 6.1 92.6C13.6 72.6 29.0 54.9 47.8 44.7C61.3 37.5 74.5 34.4 92.2 34.4C101.5 34.4 104.4 34.6 111.4 35.8C144.4 41.3 170.4 63.4 181.2 95.1C184.6 105.3 187.1 121.3 186.7 131.4C186.6 135.4 185.3 137.8 182.6 139.4C180.2 140.8 184.0 140.7 110.9 140.7L43.2 140.8L43.4 141.7C46.7 161.3 60.7 176.3 79.9 180.5C86.1 181.9 96.7 182.4 102.2 181.5C111.2 180.2 118.5 177.7 125.3 173.7C130.5 170.6 134.3 169.3 139.3 169.1C145.2 168.8 148.1 169.6 158.8 174.6C170.7 180.2 172.3 181.0 172.9 182.0C174.0 183.6 173.8 184.3 171.0 187.7C155.5 207.1 135.8 217.6 109.4 220.6C105.3 221.1 89.5 221.3 85.2 221.0ZM141.6 104.8C141.0 101.7 137.7 95.3 135.0 91.6C125.3 78.6 109.3 71.3 92.0 72.1C75.6 72.8 62.1 79.4 53.7 90.6C51.1 94.2 45.2 104.3 45.2 105.4C45.2 105.4 67.0 105.5 93.5 105.5L141.8 105.5L141.6 104.8Z';

type Props = {
  referral: Profile['referral'];
};

/** Khối "Giới thiệu bạn bè": giới thiệu chương trình + số dư credit. Mã / link / chia sẻ nằm trong bảng QR (nút góc phải trên). */
export function ReferralCard({ referral }: Props) {
  const { colors } = useTheme();
  const drift = useLoop(6000);

  return (
    <View
      accessibilityRole="summary"
      style={[styles.card, { backgroundColor: colors.emerald700, boxShadow: `0px 6px 0px ${colors.emeraldEdge}` }]}
    >
      {/* vòng trang trí trôi nhẹ */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.deco,
          {
            borderColor: colors.heroDeco,
            transform: [
              { translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) },
              { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [0, 6] }) },
            ],
          },
        ]}
      />

      <View style={styles.top}>
        <View style={styles.topText}>
          <Text style={[type.eyebrow, { color: colors.onEmeraldMuted }]}>Giới thiệu bạn bè</Text>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.onEmerald }]}>
            Mời bạn học, nhận credit
          </Text>
          <Text style={[styles.desc, { color: colors.onEmeraldMuted }]}>
            Mỗi khi người bạn mời mua gói thành viên, bạn nhận {referral.ratePercent}% giá trị đơn dưới dạng credit. Credit
            không hết hạn và trừ thẳng vào mọi lần thanh toán.
          </Text>
        </View>
        <Coins />
      </View>

      {/* Số dư */}
      <View style={styles.balance}>
        <View style={styles.grow}>
          <Text style={[styles.small, { color: colors.onEmeraldMuted }]}>Số dư credit</Text>
          <View style={styles.amountRow}>
            <Text style={[styles.amount, { color: colors.onEmerald }]}>{referral.creditBalance}</Text>
            <Text style={[type.label, { color: colors.onEmerald }]}>credit</Text>
          </View>
          <Text style={[styles.small, { color: colors.onEmeraldMuted }]}>
            Tương đương {creditToVnd(referral.creditBalance)}
          </Text>
        </View>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Lịch sử credit"
          onPress={() => router.push('/profile/lich-su-credit')}
          style={({ pressed }) => [styles.historyBtn, { borderColor: illo.onCoverLine, opacity: pressed ? 0.75 : 1 }]}
        >
          <Text style={[type.captionStrong, { color: colors.onEmerald }]}>Lịch sử</Text>
          <Icon name="chevronRight" size={16} color={colors.onEmerald} />
        </Pressable>
      </View>

    </View>
  );
}

/** Chồng xu vàng + đồng xu có logo xoay lật. */
function Coins() {
  const spin = useLoop(3200);
  return (
    <View style={styles.coins} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={72} height={76} viewBox="0 0 72 76" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="coinTop" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={illo.goldHi} />
            <Stop offset="1" stopColor={illo.goldMid} />
          </LinearGradient>
        </Defs>
        {[
          { y: 64, fill: illo.goldLo },
          { y: 55, fill: illo.goldMid },
          { y: 46, fill: 'url(#coinTop)' },
        ].map((c) => (
          <G key={c.y}>
            <Ellipse cx="36" cy={c.y + 4} rx="28" ry="8" fill={illo.goldEdge} />
            <Ellipse cx="36" cy={c.y} rx="28" ry="8" fill={c.fill} />
          </G>
        ))}
      </Svg>
      <Animated.View
        style={[
          styles.coin,
          {
            transform: [
              { perspective: 400 },
              { translateY: spin.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) },
              { rotateY: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) },
            ],
          },
        ]}
      >
        <Svg width={36} height={39} viewBox="0 0 36 39">
          <Defs>
            <RadialGradient id="coinFace" cx="35%" cy="30%" r="70%">
              <Stop offset="0" stopColor={illo.goldHi} />
              <Stop offset="1" stopColor={illo.goldLo} />
            </RadialGradient>
          </Defs>
          <Circle cx="18" cy="21" r="18" fill={illo.goldEdge} />
          <Circle cx="18" cy="18" r="18" fill="url(#coinFace)" />
          <Circle cx="18" cy="18" r="16.5" fill="none" stroke={illo.goldMid} strokeWidth={3} />
        </Svg>
        <View style={styles.coinLogo}>
          <Svg width={20} height={20} viewBox="-11.3 23 209.2 209.2">
            <Path d={ELLSO_E} fill={illo.goldInk} />
          </Svg>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  card: { marginTop: 16, marginHorizontal: 16, paddingTop: 20, paddingHorizontal: 18, paddingBottom: 18, borderRadius: 24, gap: 16, overflow: 'hidden' },
  deco: { position: 'absolute', width: 160, height: 160, borderRadius: 80, borderWidth: 24, right: -56, top: -70 },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  topText: { flex: 1, minWidth: 0, gap: 4 },
  title: { fontFamily: fonts.display600, fontSize: 20, lineHeight: 26 },
  desc: { fontFamily: fonts.sans400, fontSize: 13, lineHeight: 19 },
  small: { fontFamily: fonts.sans400, fontSize: 12, lineHeight: 16 },
  balance: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  amount: { fontFamily: fonts.display600, fontSize: 30, lineHeight: 36 },
  historyBtn: { height: 40, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  coins: { width: 72, height: 76 },
  coin: { position: 'absolute', left: 18, top: 0, width: 36, height: 39 },
  coinLogo: { position: 'absolute', left: 8, top: 8, width: 20, height: 20 },
});