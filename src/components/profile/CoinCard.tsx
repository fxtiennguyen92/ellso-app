import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Pattern, Rect, Stop } from 'react-native-svg';

import { Icon } from '@/components/Icon';
import { groupThousands } from '@/data/profile';
import { useLoop } from '@/hooks/useLoop';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { illo } from '@/theme/tokens';
import { fonts } from '@/theme/typography';

export const COIN_HERO_ROW = 52;
/** Phần hero cao thêm (dưới hàng tiêu đề) khi mở rộng / thu gọn. */
export const COIN_HERO_BODY = 214;
export const COIN_HERO_BODY_MIN = 64;

type Props = {
  topInset: number;
  coins: number;
  earnedMonth: number | null;
  spentMonth: number | null;
  /** 0 = mở rộng, 1 = thu gọn (theo độ cuộn danh sách). */
  collapse: Animated.AnimatedInterpolation<number>;
};

/**
 * Hero "Xu của tôi" — điểm nhấn của màn, nhưng chỉ là THÔNG TIN nên phẳng (không bóng / mép 3D, không gợi ý bấm):
 * - Nền vàng gradient tràn viền (dưới status bar), lưới chấm, vòng tròn đồng tâm, vài đốm lấp lánh, vệt sáng lướt chéo định kỳ.
 * - Số xu rất to, đếm tăng dần lần đầu hiện (tắt khi "Giảm chuyển động").
 * - Hàng số liệu tháng này: đã nhận / đã dùng (dải kính mờ phẳng).
 * - Cuộn danh sách: hero thu gọn (chiều cao do màn điều khiển), số xu thu nhỏ nhưng luôn còn thấy; nhãn + số liệu tháng mờ đi.
 */
export function CoinHero({ topInset, coins, earnedMonth, spentMonth, collapse }: Props) {
  const reduced = useReducedMotion();
  const shine = useLoop(4200, { kind: 'forward' });
  const shown = useCountUp(coins, reduced);
  const [w, setW] = useState(0);

  const fade = collapse.interpolate({ inputRange: [0, 0.5], outputRange: [1, 0], extrapolate: 'clamp' });
  const numberScale = collapse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.58], extrapolate: 'clamp' });
  const numberShift = collapse.interpolate({ inputRange: [0, 1], outputRange: [0, -34], extrapolate: 'clamp' });

  return (
    <View style={StyleSheet.absoluteFill} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {/* nền */}
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <LinearGradient id="coinHeroBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={illo.goldHi} />
            <Stop offset="0.5" stopColor={illo.goldMid} />
            <Stop offset="1" stopColor={illo.goldLo} />
          </LinearGradient>
          <Pattern id="coinHeroDots" width={16} height={16} patternUnits="userSpaceOnUse">
            <Circle cx={2} cy={2} r={1} fill={illo.goldInk} fillOpacity={0.09} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#coinHeroBg)" />
        <Rect width="100%" height="100%" fill="url(#coinHeroDots)" />
        {w > 0 &&
          [56, 96, 136, 176, 216].map((r) => (
            <Circle key={r} cx={w - 30} cy={topInset + 30} r={r} stroke={illo.goldHi} strokeOpacity={0.7} strokeWidth={1.3} fill="none" />
          ))}
        {w > 0 &&
          [
            [0.12, 0.62, 3],
            [0.22, 0.3, 2],
            [0.8, 0.72, 2.5],
            [0.9, 0.42, 1.8],
            [0.66, 0.2, 2],
          ].map(([x, y, r], i) => <Circle key={i} cx={w * x} cy={(topInset + COIN_HERO_ROW + COIN_HERO_BODY) * y} r={r} fill="#ffffff" fillOpacity={0.75} />)}
      </Svg>

      {/* vệt sáng lướt chéo */}
      {!reduced && w > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.shine,
            { transform: [{ translateX: shine.interpolate({ inputRange: [0, 0.6, 1], outputRange: [-160, w + 160, w + 160] }) }, { rotate: '18deg' }] },
          ]}
        >
          <Svg width={90} height={600}>
            <Defs>
              <LinearGradient id="coinShine" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#ffffff" stopOpacity={0} />
                <Stop offset="0.5" stopColor="#ffffff" stopOpacity={0.45} />
                <Stop offset="1" stopColor="#ffffff" stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Rect width={90} height={600} fill="url(#coinShine)" />
          </Svg>
        </Animated.View>
      )}

      {/* hàng tiêu đề */}
      <View style={[styles.row, { paddingTop: topInset, height: topInset + COIN_HERO_ROW }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile'))}
          hitSlop={6}
          style={({ pressed }) => [styles.back, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Icon name="chevronLeft" size={22} color={illo.goldInk} />
        </Pressable>
        <Text accessibilityRole="header" style={[styles.title, { color: illo.goldInk }]}>
          Xu của tôi
        </Text>
      </View>

      {/* số xu */}
      <View style={[styles.body, { top: topInset + COIN_HERO_ROW }]} accessible accessibilityLabel={`Số xu hiện có: ${groupThousands(coins)} xu`}>
        <Animated.Text style={[styles.label, { color: illo.goldInk, opacity: fade }]}>Số xu hiện có</Animated.Text>
        <Animated.View style={{ transform: [{ translateY: numberShift }, { scale: numberScale }] }}>
          <Text style={[styles.value, { color: illo.goldInk }]} numberOfLines={1} adjustsFontSizeToFit>
            {groupThousands(shown)}
            <Text style={styles.unit}> xu</Text>
          </Text>
        </Animated.View>

        {/* số liệu tháng này */}
        <Animated.View style={[styles.stats, { opacity: fade }]}>
          <Stat label="Nhận trong tháng" value={earnedMonth == null ? '—' : `+${groupThousands(earnedMonth)}`} />
          <View style={styles.statDivider} />
          <Stat label="Dùng trong tháng" value={spentMonth == null ? '—' : `−${groupThousands(spentMonth)}`} />
        </Animated.View>
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: illo.goldInk }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: illo.goldInk }]}>{label}</Text>
    </View>
  );
}

/** Đếm tăng dần tới `target` (lần đầu và mỗi khi số đổi); giảm chuyển động → hiện ngay. */
function useCountUp(target: number, reduced: boolean) {
  const [shown, setShown] = useState(reduced ? target : 0);
  const v = useRef(new Animated.Value(0)).current;
  const from = useRef(0);
  useEffect(() => {
    if (reduced) {
      setShown(target);
      return;
    }
    const start = from.current;
    v.setValue(0);
    const id = v.addListener(({ value }) => setShown(Math.round(start + (target - start) * value)));
    Animated.timing(v, { toValue: 1, duration: 1100, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start(() => {
      from.current = target;
    });
    return () => v.removeListener(id);
  }, [target, reduced, v]);
  return shown;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16 },
  back: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.35)' },
  title: { fontFamily: fonts.display600, fontSize: 20, lineHeight: 28 },
  body: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  label: { fontFamily: fonts.sans600, fontSize: 14, lineHeight: 20, marginTop: 6, opacity: 0.85 },
  value: { fontFamily: fonts.display700, fontSize: 60, lineHeight: 72, letterSpacing: -1 },
  unit: { fontFamily: fonts.display600, fontSize: 22, letterSpacing: 0 },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.32)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontFamily: fonts.display600, fontSize: 18, lineHeight: 24 },
  statLabel: { fontFamily: fonts.sans500, fontSize: 12, lineHeight: 16, opacity: 0.8 },
  statDivider: { width: 1, alignSelf: 'stretch', backgroundColor: 'rgba(120,53,15,0.18)' },
  shine: { position: 'absolute', top: -200, left: 0 },
});

