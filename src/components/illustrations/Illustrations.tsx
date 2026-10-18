import { useId } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useLoop } from '@/hooks/useLoop';
import { illo } from '@/theme/tokens';
import { fonts } from '@/theme/typography';

/** id duy nhất cho gradient/clipPath của từng instance SVG. */
function useSvgId(prefix: string) {
  return `${prefix}-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
}

/** Path hình tròn để ghép với fillRule="evenodd" (tạo bóng đổ bên trong). */
const circlePath = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z`;

// ---------------------------------------------------------------------------
// Khóa học: bóng đèn · cửa sổ web · cúp  (có animation bob)
// ---------------------------------------------------------------------------

function useBob(duration = 3000, delay = 0) {
  const v = useLoop(duration, { delay });
  return { transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) }] };
}

export function BulbIllustration() {
  const id = useSvgId('bulb');
  const bob = useBob();
  return (
    <Animated.View style={bob}>
      <Svg width={76} height={92} viewBox="-8 -8 76 92">
        <Defs>
          <RadialGradient id={`${id}-glow`} cx="30" cy="26" r="36" gradientUnits="userSpaceOnUse">
            <Stop offset="0.6" stopColor={illo.bulbLo} stopOpacity={0.45} />
            <Stop offset="1" stopColor={illo.bulbLo} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id={`${id}-glass`} cx="22" cy="18" r="40" fx="22" fy="18" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={illo.bulbHi} />
            <Stop offset="0.12" stopColor={illo.bulbHi} />
            <Stop offset="0.4" stopColor={illo.bulbMid} />
            <Stop offset="0.9" stopColor={illo.bulbLo} />
          </RadialGradient>
          <LinearGradient id={`${id}-m1`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={illo.metalHi} />
            <Stop offset="1" stopColor={illo.metalLo} />
          </LinearGradient>
          <LinearGradient id={`${id}-m2`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={illo.metalMid} />
            <Stop offset="1" stopColor={illo.metalDk} />
          </LinearGradient>
          <ClipPath id={`${id}-clip`}>
            <Circle cx="30" cy="26" r="26" />
          </ClipPath>
        </Defs>
        <Circle cx="30" cy="26" r="36" fill={`url(#${id}-glow)`} />
        <Circle cx="30" cy="26" r="26" fill={`url(#${id}-glass)`} />
        <G clipPath={`url(#${id}-clip)`}>
          <Path d={`M-10 -10H80V80H-10Z ${circlePath(25, 19, 26)}`} fillRule="evenodd" fill={illo.bulbShade} />
        </G>
        <Rect x="17" y="49" width="26" height="9" rx="3" fill={`url(#${id}-m1)`} />
        <Rect x="19" y="59" width="22" height="7" rx="3" fill={`url(#${id}-m2)`} />
        <Path d="M24 67H36A6 6 0 0 1 30 73A6 6 0 0 1 24 67Z" fill={illo.metalBase} />
      </Svg>
    </Animated.View>
  );
}

export function WebIllustration() {
  const id = useSvgId('web');
  const bob = useBob(3400, 600);
  return (
    <Animated.View style={[{ width: 72, height: 65 }, bob]}>
      <Svg width={72} height={65} viewBox="0 0 72 65" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={`${id}-bg`} x1="0.35" y1="0" x2="0.65" y2="1">
            <Stop offset="0" stopColor={illo.white} />
            <Stop offset="1" stopColor={illo.webBg} />
          </LinearGradient>
          <ClipPath id={`${id}-clip`}>
            <Rect x="0" y="0" width="72" height="60" rx="12" />
          </ClipPath>
        </Defs>
        <Rect x="0" y="5" width="72" height="60" rx="12" fill={illo.webEdge} />
        <Rect x="0" y="0" width="72" height="60" rx="12" fill={`url(#${id}-bg)`} />
        <G clipPath={`url(#${id}-clip)`}>
          <Rect x="0" y="0" width="72" height="13" fill={illo.webTop} />
        </G>
        <Circle cx="8.5" cy="6.5" r="2.5" fill={illo.white} />
        <Circle cx="16.5" cy="6.5" r="2.5" fill={illo.white} />
        <Circle cx="24.5" cy="6.5" r="2.5" fill={illo.white} />
      </Svg>
      <View style={styles.webCode}>
        <Text style={styles.webCodeText}>{'</>'}</Text>
      </View>
    </Animated.View>
  );
}

const trophyBody = (dx = 0, dy = 0) =>
  `M${14 + dx} ${dy}H${46 + dx}A6 6 0 0 1 ${52 + dx} ${6 + dy}V${14 + dy}A22 22 0 0 1 ${30 + dx} ${36 + dy}A22 22 0 0 1 ${8 + dx} ${14 + dy}V${6 + dy}A6 6 0 0 1 ${14 + dx} ${dy}Z`;

export function TrophyIllustration() {
  const id = useSvgId('cup');
  const bob = useBob();
  return (
    <Animated.View style={bob}>
      <Svg width={60} height={66} viewBox="0 0 60 66">
        <Defs>
          <LinearGradient id={`${id}-cup`} x1="0" y1="0.2" x2="1" y2="0.8">
            <Stop offset="0" stopColor={illo.cupHi} />
            <Stop offset="0.75" stopColor={illo.cupLo} />
          </LinearGradient>
          <LinearGradient id={`${id}-base`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={illo.cupBaseHi} />
            <Stop offset="1" stopColor={illo.cupBaseLo} />
          </LinearGradient>
          <ClipPath id={`${id}-clip`}>
            <Path d={trophyBody()} />
          </ClipPath>
        </Defs>
        <Path d="M12 7H8A6 6 0 0 0 8 19H12" stroke={illo.cupLo} strokeWidth={4} fill="none" />
        <Path d="M48 7H52A6 6 0 0 1 52 19H48" stroke={illo.cupLo} strokeWidth={4} fill="none" />
        <Path d={trophyBody()} fill={`url(#${id}-cup)`} />
        <G clipPath={`url(#${id}-clip)`}>
          <Path d={`M-5 -5H70V50H-5Z ${trophyBody(-5, -4)}`} fillRule="evenodd" fill={illo.cupShade} />
        </G>
        <Rect x="25" y="36" width="10" height="14" fill={illo.cupStem} />
        <Rect x="13" y="54" width="34" height="12" rx="4" fill={illo.cupBaseEdge} />
        <Rect x="13" y="50" width="34" height="12" rx="4" fill={`url(#${id}-base)`} />
      </Svg>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Hoạt động hằng ngày: khối "?" (float) · micro (bob) · sao lấp lánh · sóng âm
// ---------------------------------------------------------------------------

export function QuizBlock() {
  const id = useSvgId('quiz');
  const v = useLoop(3400);
  const style = {
    transform: [
      { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) },
      { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['-8deg', '-5deg'] }) },
    ],
  };
  return (
    <Animated.View style={[styles.quizBlock, style]}>
      <Svg width={84} height={84} viewBox="0 0 84 84" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={`${id}-g`} x1="0.25" y1="0" x2="0.75" y2="1">
            <Stop offset="0" stopColor={illo.quizHi} />
            <Stop offset="0.55" stopColor={illo.quizMid} />
            <Stop offset="1" stopColor={illo.quizLo} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="84" height="84" rx="24" fill={`url(#${id}-g)`} />
      </Svg>
      <Text style={styles.quizMark}>?</Text>
    </Animated.View>
  );
}

const MIC_CAPSULE = { x: 21, y: 0, w: 42, h: 58, r: 21 };

export function MicIllustration() {
  const id = useSvgId('mic');
  const bob = useBob();
  const grille = Array.from({ length: 9 }, (_, i) => MIC_CAPSULE.h - 2 - i * 7);
  return (
    <Animated.View style={bob}>
      <Svg width={84} height={96} viewBox="0 0 84 96">
        <Defs>
          <RadialGradient id={`${id}-cap`} cx="33.6" cy="14.5" r="48" fx="33.6" fy="14.5" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={illo.white} />
            <Stop offset="0.1" stopColor={illo.white} />
            <Stop offset="0.45" stopColor={illo.metalHi} />
            <Stop offset="1" stopColor={illo.metalLo} />
          </RadialGradient>
          <LinearGradient id={`${id}-base`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={illo.micBaseHi} />
            <Stop offset="1" stopColor={illo.micBaseLo} />
          </LinearGradient>
          <ClipPath id={`${id}-clip`}>
            <Rect x={MIC_CAPSULE.x} y={MIC_CAPSULE.y} width={MIC_CAPSULE.w} height={MIC_CAPSULE.h} rx={MIC_CAPSULE.r} />
          </ClipPath>
        </Defs>
        <Rect x={MIC_CAPSULE.x} y={MIC_CAPSULE.y} width={MIC_CAPSULE.w} height={MIC_CAPSULE.h} rx={MIC_CAPSULE.r} fill={`url(#${id}-cap)`} />
        <G clipPath={`url(#${id}-clip)`}>
          {grille.map((y) => (
            <Rect key={y} x="0" y={y} width="84" height="2" fill={illo.grille} />
          ))}
          <Path d="M0 -10H84V70H0Z M17 16A21 21 0 0 1 59 16V32A21 21 0 0 1 17 32Z" fillRule="evenodd" fill={illo.metalShade} />
        </G>
        <Path d="M16.5 30V38A25.5 25.5 0 0 0 67.5 38V30" stroke={illo.micRing} strokeWidth={5} fill="none" />
        <Rect x="39" y="66" width="6" height="14" fill={illo.micRing} />
        <Rect x="24" y="83" width="36" height="10" rx="5" fill={illo.micEdge} />
        <Rect x="24" y="79" width="36" height="10" rx="5" fill={`url(#${id}-base)`} />
      </Svg>
    </Animated.View>
  );
}

const STAR = 'M12 0l3 9 9 3-9 3-3 9-3-9-9-3 9-3z';

export function Sparkle({ size, color, delay = 0, style }: { size: number; color: string; delay?: number; style?: object }) {
  const v = useLoop(2200, { delay });
  const anim = {
    opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }),
    transform: [
      { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.1] }) },
      { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '20deg'] }) },
    ],
  };
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: size, height: size }, style, anim]}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d={STAR} fill={color} />
      </Svg>
    </Animated.View>
  );
}

function EqBar({ color, delay }: { color: string; delay: number }) {
  const v = useLoop(1100, { delay });
  return (
    <Animated.View
      style={{
        width: 3,
        height: 20,
        borderRadius: 9999,
        backgroundColor: color,
        transformOrigin: 'bottom',
        transform: [{ scaleY: v.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }) }],
      }}
    />
  );
}

/** Cụm 3 vạch sóng âm. `order` đổi thứ tự độ trễ cho cụm bên phải. */
export function EqBars({ color, order = [0, 200, 450], style }: { color: string; order?: number[]; style?: object }) {
  return (
    <View pointerEvents="none" style={[styles.eq, style]}>
      {order.map((delay, i) => (
        <EqBar key={i} color={color} delay={delay} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  webCode: { position: 'absolute', left: 0, right: 0, top: 13, height: 47, alignItems: 'center', justifyContent: 'center' },
  webCodeText: { fontFamily: fonts.display700, fontSize: 17, lineHeight: 22, color: illo.webText },
  quizBlock: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: illo.quizLo,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0px 8px 0px ${illo.quizEdge}, 0px 18px 22px ${illo.quizGlow}`,
  },
  quizMark: {
    fontFamily: fonts.display700,
    fontSize: 50,
    lineHeight: 62,
    color: illo.white,
    textShadowColor: illo.quizEdge,
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 0,
  },
  eq: { position: 'absolute', flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 20 },
});
