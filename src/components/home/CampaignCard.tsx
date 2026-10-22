import { router } from 'expo-router';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { Icon } from '@/components/Icon';
import { useRevealStyle } from '@/components/splash/RevealContext';
import type { Campaign } from '@/data/home';
import { useLoop } from '@/hooks/useLoop';
import { illo } from '@/theme/tokens';
import { fonts, type } from '@/theme/typography';

const pad = (n: number) => String(n).padStart(2, '0');
const endLabel = (iso: string) => {
  const d = new Date(iso);
  return `Đến hết ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
};

/** Hạt tuyết trang trí: [left %, top px, size]. */
const SNOW: [number, number, number][] = [
  [6, 18, 4],
  [18, 128, 3],
  [34, 10, 3],
  [47, 140, 4],
  [58, 26, 5],
  [66, 104, 3],
  [78, 12, 3],
  [92, 64, 4],
  [86, 146, 3],
  [27, 72, 2],
];

/**
 * Thẻ chiến dịch marketing lớn dưới ô tìm kiếm (Home). Bấm → /campaign/[id]
 * (trang chi tiết chiến dịch làm sau, tạm là ComingSoon).
 */
export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const reveal = useRevealStyle(1);
  const fall = useLoop(5200);
  const bob = useLoop(2400, { delay: 300 });

  return (
    <Animated.View style={[styles.section, reveal]}>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${campaign.eyebrow}. ${campaign.title}. ${endLabel(campaign.endsAt)}. ${campaign.cta}`}
        onPress={() => router.push(`/campaign/${campaign.id}`)}
        style={({ pressed }) => [
          styles.card,
          {
            boxShadow: `0px ${pressed ? 2 : 6}px 0px ${illo.xmasEdge}`,
            transform: [{ translateY: pressed ? 4 : 0 }],
          },
        ]}
      >
        {/* Nền chuyển màu */}
        <Svg width="100%" height="100%" style={styles.fill} preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="xmasBg" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={illo.xmasTop} />
              <Stop offset="1" stopColor={illo.xmasBottom} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#xmasBg)" />
        </Svg>

        {/* Tuyết rơi nhẹ */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.fill,
            {
              transform: [
                {
                  translateY: fall.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-4, 6],
                  }),
                },
              ],
            },
          ]}
        >
          {SNOW.map(([l, t, s], i) => (
            <View
              key={i}
              style={[
                styles.snow,
                {
                  left: `${l}%`,
                  top: t,
                  width: s,
                  height: s,
                  borderRadius: s / 2,
                },
              ]}
            />
          ))}
        </Animated.View>

        {/* Hộp quà */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.gift,
            {
              transform: [
                {
                  translateY: bob.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -5],
                  }),
                },
                { rotate: '8deg' },
              ],
            },
          ]}
        >
          <Gift />
        </Animated.View>

        {/* Nội dung (zIndex để luôn nằm trên các lớp absolute ở web) */}
        <View style={styles.content}>
          <View style={styles.eyebrowRow}>
            <Icon name="tag" size={14} color={illo.xmasGold} />
            <Text style={[type.eyebrow, { color: illo.xmasGold }]}>{campaign.eyebrow}</Text>
          </View>

          <View style={styles.headline}>
            <Text style={styles.highlight}>{campaign.highlight}</Text>
            <Text style={styles.title} numberOfLines={2}>
              {campaign.title}
            </Text>
          </View>

          <Text style={styles.desc} numberOfLines={2}>
            {campaign.description}
          </Text>

          <View style={styles.footer}>
            <View style={styles.chip}>
              <Icon name="clock" size={13} strokeWidth={2.2} color="#ffffff" />
              <Text style={styles.chipText}>{endLabel(campaign.endsAt)}</Text>
            </View>
            <View style={styles.cta}>
              <Text style={styles.ctaText}>{campaign.cta}</Text>
              <Icon name="chevronRight" size={16} strokeWidth={2.4} color={illo.xmasInk} />
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

/** Hộp quà xanh, nơ vàng. */
function Gift() {
  return (
    <Svg width={112} height={112} viewBox="0 0 112 112">
      <Defs>
        <LinearGradient id="giftBody" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={illo.xmasGift} />
          <Stop offset="1" stopColor={illo.xmasGiftDark} />
        </LinearGradient>
      </Defs>
      <Ellipse cx="56" cy="104" rx="40" ry="5" fill="rgba(0,0,0,0.18)" />
      <Rect x="18" y="48" width="76" height="54" rx="6" fill="url(#giftBody)" />
      <Rect x="12" y="36" width="88" height="18" rx="5" fill={illo.xmasGift} />
      <Rect x="12" y="50" width="88" height="4" fill="rgba(0,0,0,0.12)" />
      <Rect x="49" y="36" width="14" height="66" fill={illo.xmasGold} />
      <Rect x="49" y="36" width="5" height="66" fill="rgba(255,255,255,0.35)" />
      <G>
        <Path d="M56 36 C40 18 22 24 30 34 C34 39 46 38 56 36Z" fill={illo.xmasGold} />
        <Path d="M56 36 C72 18 90 24 82 34 C78 39 66 38 56 36Z" fill={illo.xmasGoldDeep} />
        <Circle cx="56" cy="35" r="6" fill={illo.xmasGoldDeep} />
      </G>
    </Svg>
  );
}

const styles = StyleSheet.create({
  section: { paddingTop: 8, paddingHorizontal: 16 },
  card: {
    minHeight: 184,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: illo.xmasBottom,
  },
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  snow: { position: 'absolute', backgroundColor: illo.xmasSnow },
  gift: { position: 'absolute', right: -6, top: 14 },
  content: {
    position: 'relative',
    zIndex: 1,
    padding: 20,
    paddingRight: 112,
    gap: 8,
  },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headline: { gap: 2 },
  highlight: {
    color: illo.xmasGold,
    fontFamily: fonts.display700,
    fontSize: 40,
    lineHeight: 46,
  },
  title: {
    color: '#ffffff',
    fontFamily: fonts.display600,
    fontSize: 18,
    lineHeight: 24,
  },
  desc: {
    color: illo.xmasMuted,
    fontFamily: fonts.sans400,
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
    marginRight: -92,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 9999,
    backgroundColor: illo.xmasChip,
  },
  chipText: {
    color: '#ffffff',
    fontFamily: fonts.sans600,
    fontSize: 12,
    lineHeight: 16,
  },
  cta: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 36,
    paddingLeft: 16,
    paddingRight: 12,
    borderRadius: 9999,
    backgroundColor: illo.xmasGold,
  },
  ctaText: {
    color: illo.xmasInk,
    fontFamily: fonts.sans700,
    fontSize: 14,
    lineHeight: 20,
  },
});