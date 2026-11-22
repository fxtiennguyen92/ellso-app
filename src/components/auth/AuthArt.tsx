import { useEffect, useId, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { Icon, type IconName } from '@/components/Icon';
import { Sparkle } from '@/components/illustrations/Illustrations';
import { Mascot } from '@/components/mascots/Mascot';
import { NATIVE_DRIVER, useLoop } from '@/hooks/useLoop';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { illo } from '@/theme/tokens';
import { fonts } from '@/theme/typography';

/** Minh hoạ 3D cho các màn tài khoản (đúng theo canvas thiết kế). Tự dừng khi "Giảm chuyển động". */

/** id hợp lệ cho url(#…) của gradient SVG (useId có dấu ":"). */
const useSvgId = (p: string) => p + useId().replace(/[^a-zA-Z0-9]/g, '');

/** Xoay đều vô hạn (tuyến tính). */
function useSpin(duration: number) {
  const v = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(Animated.timing(v, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: NATIVE_DRIVER }));
    loop.start();
    return () => loop.stop();
  }, [v, duration, reduced]);
  return v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
}

/** Huy hiệu tròn vàng (check / chìa khoá). */
function GoldBadge({ size, icon }: { size: number; icon: IconName }) {
  const id = useSvgId('gold');
  return (
    <View style={{ width: size, height: size + 3 }}>
      <Svg width={size} height={size + 3} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id={id} cx="35%" cy="30%" r="80%">
            <Stop offset="0" stopColor={illo.goldHi} />
            <Stop offset="0.8" stopColor={illo.goldLo} />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2 + 3} r={size / 2} fill={illo.goldEdge} />
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
      </Svg>
      <View style={[styles.badgeIcon, { width: size, height: size }]}>
        <Icon name={icon} size={size * 0.48} strokeWidth={icon === 'check' ? 3 : 2.4} color="#ffffff" />
      </View>
    </View>
  );
}

// ------------------------------------------------------------------ Đăng nhập

/** Header màn Đăng nhập: quầng sáng + vòng nét đứt xoay chậm + mascot Thỏ cử động + 3 ngôi sao. */
export function LoginHeroArt() {
  const { colors } = useTheme();
  const glow = useSvgId('glow');
  const spin = useSpin(40000);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={360} height={360} style={styles.glow}>
        <Defs>
          <RadialGradient id={glow} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={colors.mint100} />
            <Stop offset="0.55" stopColor={colors.mint50} />
            <Stop offset="0.72" stopColor={colors.mint50} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={180} cy={180} r={180} fill={`url(#${glow})`} />
      </Svg>
      <Animated.View style={[styles.ring, { transform: [{ rotate: spin }] }]}>
        <Svg width={230} height={230}>
          <Circle cx={115} cy={115} r={114} stroke={colors.authRing} strokeWidth={1.5} strokeDasharray="5 5" fill="none" />
        </Svg>
      </Animated.View>

      {/* Thỏ (mascot chính): tai đung đưa, chớp mắt, thỉnh thoảng nhảy 2 nhịp */}
      <View style={styles.rabbit}>
        <Mascot name="tho" size={150} actionEvery={6500} accessibilityLabel="Thỏ, mascot của Ellso" />
      </View>

      <Sparkle size={14} color={illo.goldLo} style={{ right: 186, top: 92 }} />
      <Sparkle size={10} color={colors.emerald500} delay={800} style={{ right: 36, top: 70 }} />
      <Sparkle size={12} color={illo.authBookHi} delay={1600} style={{ right: 30, top: 196 }} />
    </View>
  );
}

// ------------------------------------------------------------------ Đăng ký

/** Mascot Mầm cạnh tiêu đề "Tạo tài khoản": lá đung đưa, chớp mắt, thỉnh thoảng bật lên + lá xoay một vòng + vẫy tay. */
export function SproutArt() {
  const { colors } = useTheme();
  return (
    <View pointerEvents="none" style={styles.sproutBox}>
      <Mascot name="mam" size={100} actionEvery={6000} accessibilityLabel="Mầm, mascot của Ellso" />
      <Sparkle size={14} color={illo.goldLo} style={{ right: -2, top: 6 }} />
      <Sparkle size={10} color={colors.emerald500} delay={800} style={{ left: -2, bottom: 18 }} />
    </View>
  );
}

// ------------------------------------------------------------------ Đặt mật khẩu mới

/** Chìa khoá vàng lắc nhẹ trong băng "Bạn đang dùng mật khẩu tạm". `hole` = màu nền băng (lỗ chìa). */
export function KeyArt({ hole }: { hole: string }) {
  const id = useSvgId('key');
  const wig = useLoop(2600);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        width: 52,
        height: 52,
        transform: [
          { rotate: wig.interpolate({ inputRange: [0, 1], outputRange: ['-12deg', '4deg'] }) },
          { translateY: wig.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) },
        ],
      }}
    >
      <Svg width={56} height={56} viewBox="0 0 56 56">
        <Defs>
          <RadialGradient id={id} cx="35%" cy="30%" r="80%">
            <Stop offset="0" stopColor={illo.goldHi} />
            <Stop offset="0.8" stopColor={illo.goldLo} />
          </RadialGradient>
        </Defs>
        {/* thân + răng (mép đậm lệch xuống 3px) */}
        <G transform="rotate(45 24 24)">
          <Rect x={24} y={22.5} width={26} height={9} rx={3} fill={illo.goldEdge} />
          <Rect x={24} y={19.5} width={26} height={9} rx={3} fill={illo.goldMid} />
          <Rect x={40} y={26} width={6} height={8} rx={2} fill={illo.goldLo} />
        </G>
        <Circle cx={17} cy={20} r={15} fill={illo.goldEdge} />
        <Circle cx={17} cy={17} r={15} fill={`url(#${id})`} />
        <Circle cx={17} cy={17} r={6} fill={hole} />
      </Svg>
    </Animated.View>
  );
}

// ------------------------------------------------------------------ Quên mật khẩu

/** Mascot Cú Minh màn Quên mật khẩu: nghiêng đầu, tua mũ lắc; thỉnh thoảng gật đầu 2 lần + nháy mắt. */
export function OwlArt() {
  const { colors } = useTheme();
  return (
    <View pointerEvents="none" style={styles.owlBox}>
      <View style={[styles.owlHalo, { backgroundColor: colors.mint50 }]} />
      <Mascot name="cuMinh" size={150} actionEvery={6500} accessibilityLabel="Cú Minh, mascot của Ellso" />
      <Sparkle size={14} color={illo.goldLo} style={{ right: 8, top: 18 }} />
      <Sparkle size={10} color={colors.emerald500} delay={800} style={{ left: 10, top: 64 }} />
    </View>
  );
}

// ------------------------------------------------------------------ Đã gửi email

/** Phong bì 3D có lá thư nhô lên (mật khẩu tạm "•••••••"). tone mint = đăng ký, violet = quên mật khẩu. */
export function EnvelopeArt({ tone, badge }: { tone: 'mint' | 'violet'; badge: 'check' | 'key' }) {
  const { colors } = useTheme();
  const gid = useSvgId('env');
  const cid = useSvgId('envclip');
  const float = useLoop(3200);
  const rise = useLoop(2600);
  const mint = tone === 'mint';
  const c = mint
    ? { hi: illo.authEnvMintHi, lo: illo.authEnvMintLo, dark: illo.authEnvMintDark, edge: illo.authEnvMintEdge, line: illo.authEnvMintLine }
    : {
        hi: illo.authEnvVioletHi,
        lo: illo.authEnvVioletLo,
        dark: illo.authEnvVioletDark,
        edge: illo.authEnvVioletEdge,
        line: illo.authEnvVioletLine,
      };
  const front = 'M0 0 L70 38.5 L140 0 L140 60 Q140 74 126 74 L14 74 Q0 74 0 60 Z';

  return (
    <View pointerEvents="none" style={[styles.envCircle, { backgroundColor: mint ? colors.mint50 : colors.violetTint }]}>
      <View style={[styles.envInner, { backgroundColor: mint ? colors.mint100 : colors.violetLine }]} />
      <Animated.View style={[styles.env, { transform: [{ translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }] }]}>
        {/* lá thư */}
        <Animated.View style={[styles.letter, { transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [0, -14] }) }] }]}>
          <View style={[styles.letterLine, { width: '60%', height: 6, backgroundColor: c.hi }]} />
          <View style={[styles.letterLine, { backgroundColor: c.line }]} />
          {mint && <View style={[styles.letterLine, { width: '80%', backgroundColor: c.line }]} />}
          <View style={styles.pwPill}>
            <Text style={styles.pwText}>•••••••</Text>
          </View>
        </Animated.View>
        {/* thân phong bì */}
        <Svg width={140} height={81} style={styles.envBody}>
          <Defs>
            <LinearGradient id={gid} x1="0" y1="0" x2="0.6" y2="1">
              <Stop offset="0" stopColor={c.hi} />
              <Stop offset="1" stopColor={c.lo} />
            </LinearGradient>
            <ClipPath id={cid}>
              <Path d={front} />
            </ClipPath>
          </Defs>
          <Path d={front} fill={c.edge} transform="translate(0 7)" />
          <Path d={front} fill={`url(#${gid})`} />
          <G clipPath={`url(#${cid})`}>
            <Path d="M0 0 L70 38.5 L0 74 Z" fill={c.dark} opacity={mint ? 0.55 : 0.5} />
            <Path d="M140 0 L70 38.5 L140 74 Z" fill={c.dark} opacity={mint ? 0.4 : 0.35} />
          </G>
        </Svg>
        <View style={styles.envBadge}>
          <GoldBadge size={36} icon={badge} />
        </View>
      </Animated.View>
      <Sparkle size={16} color={illo.goldLo} style={{ left: 30, top: 40 }} />
      <Sparkle size={12} color={mint ? colors.emerald500 : c.lo} delay={700} style={{ right: 36, top: 30 }} />
      {mint && <Sparkle size={10} color={illo.goldLo} delay={1400} style={{ right: 26, bottom: 50 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  badgeIcon: { position: 'absolute', left: 0, top: 0, alignItems: 'center', justifyContent: 'center' },

  glow: { position: 'absolute', right: -120, top: -110 },
  ring: { position: 'absolute', right: -38, top: 2, width: 230, height: 230 },
  rabbit: { position: 'absolute', right: 2, top: 30 },
  sproutBox: { width: 104, height: 112, alignItems: 'center' },
  owlBox: { width: 190, height: 172, alignItems: 'center', justifyContent: 'flex-end' },
  owlHalo: { position: 'absolute', width: 168, height: 168, borderRadius: 84, top: 0 },



  envCircle: { width: 220, height: 220, borderRadius: 110, alignItems: 'center', justifyContent: 'center' },
  envInner: { position: 'absolute', top: 22, left: 22, right: 22, bottom: 22, borderRadius: 9999 },
  env: { width: 140, height: 117 },
  letter: {
    position: 'absolute',
    left: 16,
    top: 0,
    width: 108,
    height: 86,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    boxShadow: `0px 2px 6px ${illo.authLetterShadow}`,
    paddingTop: 14,
    paddingHorizontal: 14,
    gap: 7,
  },
  letterLine: { height: 5, borderRadius: 3 },
  pwPill: { alignSelf: 'flex-start', marginTop: 2, paddingHorizontal: 6, borderRadius: 4, backgroundColor: illo.goldHi },
  pwText: { fontFamily: fonts.display700, fontSize: 9, lineHeight: 14, letterSpacing: 0.9, color: illo.goldEdge },
  envBody: { position: 'absolute', left: 0, top: 36 },
  envBadge: { position: 'absolute', right: -10, bottom: 37 },
});
