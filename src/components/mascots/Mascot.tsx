import { useContext, useEffect, useId, useMemo, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { LoopActiveContext } from '@/hooks/LoopScope';
import { NATIVE_DRIVER } from '@/hooks/useLoop';
import { useReducedMotion } from '@/hooks/useReducedMotion';

import { MASCOT_ART, type MascotName } from './mascotArt.generated';

export type { MascotName } from './mascotArt.generated';

/** Tên hiển thị + vai trò (tài liệu claude/ellso-mascots.md). */
export const MASCOTS: { name: MascotName; label: string; role: string }[] = [
  { name: 'tho', label: 'Thỏ', role: 'Bạn thử thách' },
  { name: 'mam', label: 'Mầm', role: 'Bạn học đồng hành' },
  { name: 'tia', label: 'Tia', role: 'Tia lửa ý tưởng' },
  { name: 'cuMinh', label: 'Cú Minh', role: 'Người dẫn dắt' },
  { name: 'so', label: 'Sổ', role: 'Người giữ ghi chú' },
];

type Box = [x: number, y: number, w: number, h: number];
const FULL: Box = [0, 0, 400, 440];
/** Khung vuông quanh mặt — dùng làm ảnh đại diện. */
const FACE: Record<MascotName, Box> = {
  tho: [50, 84, 300, 300],
  mam: [44, 74, 312, 312],
  tia: [46, 74, 308, 308],
  cuMinh: [44, 72, 312, 312],
  so: [36, 62, 328, 328],
};

/** Điểm xoay (toạ độ canvas 400 × 440) của các lớp động. */
const PIVOT: Record<string, [number, number]> = {
  'tho:ear-l': [150, 188],
  'tho:ear-r': [254, 192],
  'mam:leaves': [200, 100],
  'mam:arm-r': [306, 276],
  'tia:arm-r': [300, 250],
  'cuMinh:wing-r': [316, 236],
  'cuMinh:tassel': [200, 108],
  'so:bookmark': [256, 108],
  'so:arm-r': [294, 236],
};
/** Điểm gốc của cả thân (nhún / co giãn / nghiêng quanh chân). */
const BODY_PIVOT: [number, number] = [200, 404];

type Motion = 'lively' | 'subtle' | 'none';

type Props = {
  name: MascotName;
  /** Chiều rộng (px). Toàn thân: cao = rộng × 1.1; `crop="face"`: vuông. */
  size: number;
  crop?: 'full' | 'face';
  /**
   * lively: chuyển động nhẹ liên tục + chớp mắt + hành động riêng mỗi `actionEvery` ms (màn đăng nhập…).
   * subtle: đứng yên, chớp mắt 3–5 giây / lần, thỉnh thoảng (~8 giây) cử động một nhịp (ảnh đại diện).
   */
  motion?: Motion;
  actionEvery?: number;
  /** Đổi số này để chạy hành động ngay (vd khi đăng nhập sai / gửi thành công). */
  actionKey?: number;
  /** Bấm vào mascot cũng chạy hành động. */
  pressable?: boolean;
  /** Đồ vật cầm trên tay (hiện có: kính lúp — chỉ cho Thỏ, màn Tìm kiếm). */
  holding?: 'magnifier';
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

const IDLE_MS = 2400;
const ACTION_MS: Record<MascotName, number> = { tho: 1100, mam: 1300, tia: 1200, cuMinh: 1300, so: 1300 };

/**
 * Mascot chibi 2.5D của Ellso, vẽ bằng react-native-svg và cử động bằng Animated (native driver):
 * - Thỏ: tai đung đưa lệch pha + nhún; hành động: nhảy 2 nhịp, cười tươi.
 * - Mầm: lá đung đưa; hành động: bật lên, lá xoay một vòng, vẫy tay.
 * - Tia: thân co giãn như lửa, tia sáng nhấp nháy; hành động: bùng to + vẫy tay.
 * - Cú Minh: nghiêng đầu, tua mũ lắc; hành động: gật đầu 2 lần + nháy mắt.
 * - Sổ: dải đánh dấu phất, tay vẫy nhẹ; hành động: nhảy nhẹ + vẫy tay.
 * Tự đứng yên khi bật "Giảm chuyển động" hoặc khi màn chứa nó không được focus (LoopScope).
 */
export function Mascot({
  name,
  size,
  crop = 'full',
  motion = 'lively',
  actionEvery = 6000,
  actionKey,
  pressable = false,
  holding,
  style,
  accessibilityLabel,
}: Props) {
  const box = crop === 'face' ? FACE[name] : FULL;
  const width = size;
  const height = (size * box[3]) / box[2];
  const k = width / box[2]; // px trên mỗi đơn vị canvas
  const prefix = 'm' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const reduced = useReducedMotion();
  const active = useContext(LoopActiveContext);
  const live = motion !== 'none' && !reduced && active;

  const idle = useRef(new Animated.Value(0)).current; // 0 → 1 một chu kỳ
  const blink = useRef(new Animated.Value(0)).current; // 1 = nhắm
  const wink = useRef(new Animated.Value(0)).current; // 1 = nhắm mắt phải
  const act = useRef(new Animated.Value(0)).current; // tiến độ hành động 0 → 1
  const grin = useRef(new Animated.Value(0)).current; // 1 = cười tươi
  const playing = useRef(false);

  const play = useMemo(
    () => () => {
      if (!live || playing.current) return;
      playing.current = true;
      act.setValue(0);
      const d = ACTION_MS[name];
      Animated.parallel([
        Animated.timing(act, { toValue: 1, duration: d, easing: Easing.linear, useNativeDriver: NATIVE_DRIVER }),
        Animated.sequence([
          Animated.timing(grin, { toValue: 1, duration: 120, useNativeDriver: NATIVE_DRIVER }),
          Animated.delay(d - 120),
          Animated.timing(grin, { toValue: 0, duration: 200, useNativeDriver: NATIVE_DRIVER }),
        ]),
        name === 'cuMinh'
          ? Animated.sequence([
              Animated.delay(d * 0.55),
              Animated.timing(wink, { toValue: 1, duration: 90, useNativeDriver: NATIVE_DRIVER }),
              Animated.delay(260),
              Animated.timing(wink, { toValue: 0, duration: 120, useNativeDriver: NATIVE_DRIVER }),
            ])
          : Animated.delay(0),
      ]).start(() => {
        act.setValue(0);
        playing.current = false;
      });
    },
    [live, name, act, grin, wink],
  );

  // Chuyển động nền: lively = lặp liên tục; subtle = một nhịp mỗi ~8 giây
  useEffect(() => {
    if (!live) {
      idle.setValue(0);
      return;
    }
    if (motion === 'lively') {
      const loop = Animated.loop(Animated.timing(idle, { toValue: 1, duration: IDLE_MS, easing: Easing.linear, useNativeDriver: NATIVE_DRIVER }));
      loop.start();
      return () => loop.stop();
    }
    let t: ReturnType<typeof setTimeout>;
    const once = () => {
      idle.setValue(0);
      Animated.timing(idle, { toValue: 1, duration: IDLE_MS, easing: Easing.linear, useNativeDriver: NATIVE_DRIVER }).start(() => {
        t = setTimeout(once, 6000 + Math.random() * 4000);
      });
    };
    t = setTimeout(once, 1500 + Math.random() * 3000);
    return () => clearTimeout(t);
  }, [live, motion, idle]);

  // Chớp mắt ngẫu nhiên 3–5 giây / lần
  useEffect(() => {
    if (!live) {
      blink.setValue(0);
      return;
    }
    let t: ReturnType<typeof setTimeout>;
    const next = () => {
      t = setTimeout(() => {
        Animated.sequence([
          Animated.timing(blink, { toValue: 1, duration: 70, useNativeDriver: NATIVE_DRIVER }),
          Animated.delay(70),
          Animated.timing(blink, { toValue: 0, duration: 110, useNativeDriver: NATIVE_DRIVER }),
        ]).start(next);
      }, 3000 + Math.random() * 2000);
    };
    next();
    return () => clearTimeout(t);
  }, [live, blink]);

  // Hành động tự động (lively) + khi actionKey đổi
  useEffect(() => {
    if (!live || motion !== 'lively' || !actionEvery) return;
    const first = setTimeout(play, 1400);
    const every = setInterval(play, actionEvery);
    return () => {
      clearTimeout(first);
      clearInterval(every);
    };
  }, [live, motion, actionEvery, play]);
  const firstKey = useRef(actionKey);
  useEffect(() => {
    if (actionKey !== undefined && actionKey !== firstKey.current) play();
  }, [actionKey, play]);

  // ---- nội suy dùng chung
  const sinA = idle.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, 1, 0, -1, 0] });
  const sinB = idle.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [1, 0, -1, 0, 1] });
  const deg = (v: Animated.AnimatedInterpolation<number>, a: number) =>
    v.interpolate<string>({ inputRange: [-1, 1], outputRange: [`${-a}deg`, `${a}deg`] });
  const steps = (input: number[], output: number[]) => act.interpolate({ inputRange: input, outputRange: output });
  const rotSteps = (input: number[], output: number[]) =>
    act.interpolate({ inputRange: input, outputRange: output.map((d) => `${d}deg`) });

  const origin = (pt: [number, number]) => `${((pt[0] - box[0]) / box[2]) * 100}% ${((pt[1] - box[1]) / box[3]) * 100}%`;

  // ---- thân (mọi lớp trừ bóng)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- transform động của Animated
  let bodyTransform: any[] = [];
  let shadowScale: Animated.AnimatedInterpolation<number> | number = 1;
  if (name === 'tho') {
    const hop = steps([0, 0.22, 0.44, 0.66, 0.88, 1], [0, -34, 0, -24, 0, 0]);
    bodyTransform = [{ translateY: Animated.add(Animated.multiply(sinA, 2.5 * k), Animated.multiply(hop, k)) }];
    shadowScale = steps([0, 0.22, 0.44, 0.66, 0.88, 1], [1, 0.78, 1, 0.84, 1, 1]);
  } else if (name === 'mam') {
    const pop = steps([0, 0.3, 0.55, 0.7, 1], [0, -30, 0, -8, 0]);
    bodyTransform = [{ translateY: Animated.add(Animated.multiply(sinB, 2 * k), Animated.multiply(pop, k)) }];
    shadowScale = steps([0, 0.3, 0.55, 1], [1, 0.8, 1, 1]);
  } else if (name === 'tia') {
    const flame = sinA.interpolate({ inputRange: [-1, 1], outputRange: [0.97, 1.03] });
    const burst = steps([0, 0.25, 0.55, 1], [1, 1.15, 0.98, 1]);
    bodyTransform = [{ scaleY: Animated.multiply(flame, burst) }, { scaleX: burst }];
  } else if (name === 'cuMinh') {
    const nod = steps([0, 0.2, 0.4, 0.6, 0.8, 1], [0, 9, 0, 9, 0, 0]);
    bodyTransform = [{ translateY: Animated.multiply(nod, k) }, { rotate: deg(sinA, 3) }];
  } else {
    const jump = steps([0, 0.25, 0.5, 1], [0, -20, 0, 0]);
    bodyTransform = [{ translateY: Animated.add(Animated.multiply(sinA, 2 * k), Animated.multiply(jump, k)) }];
    shadowScale = steps([0, 0.25, 0.5, 1], [1, 0.86, 1, 1]);
  }

  // ---- từng lớp
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- style động của Animated
  const partStyle = (key: string): any => {
    const eyesClosedR = Animated.add(blink, wink).interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' });
    switch (key) {
      case 'eye-open-l':
        return { opacity: blink.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) };
      case 'eye-closed-l':
        return { opacity: blink };
      case 'eye-open-r':
        return { opacity: eyesClosedR.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) };
      case 'eye-closed-r':
        return { opacity: eyesClosedR };
      case 'mouth-smile':
        return { opacity: grin.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) };
      case 'mouth-grin':
        return { opacity: grin };
    }
    const pivot = PIVOT[`${name}:${key}`];
    const o = pivot ? origin(pivot) : undefined;
    switch (`${name}:${key}`) {
      case 'tho:ear-l':
        return { transformOrigin: o, transform: [{ rotate: deg(sinA, 4) }, { rotate: rotSteps([0, 0.22, 0.44, 0.66, 0.88, 1], [0, -10, 0, -8, 0, 0]) }] };
      case 'tho:ear-r':
        return { transformOrigin: o, transform: [{ rotate: deg(sinB, 4) }, { rotate: rotSteps([0, 0.22, 0.44, 0.66, 0.88, 1], [0, 10, 0, 8, 0, 0]) }] };
      case 'mam:leaves':
        return { transformOrigin: o, transform: [{ rotate: deg(sinA, 6) }, { rotate: rotSteps([0, 0.15, 0.75, 1], [0, 0, 360, 360]) }] };
      case 'mam:arm-r':
      case 'tia:arm-r':
      case 'so:arm-r':
        return {
          transformOrigin: o,
          transform: [
            { rotate: deg(sinB, key === 'arm-r' && name === 'so' ? 6 : 3) },
            { rotate: rotSteps([0, 0.2, 0.35, 0.5, 0.65, 0.8, 1], [0, -22, 6, -22, 6, -12, 0]) },
          ],
        };
      case 'cuMinh:wing-r':
        return { transformOrigin: o, transform: [{ rotate: rotSteps([0, 0.15, 0.3, 0.45, 1], [0, -14, 0, -14, 0]) }] };
      case 'cuMinh:tassel':
        return { transformOrigin: o, transform: [{ rotate: deg(sinB, 7) }] };
      case 'so:bookmark':
        return { transformOrigin: o, transform: [{ rotate: deg(sinB, 6) }] };
      case 'tia:spark-a':
        return { opacity: sinA.interpolate({ inputRange: [-1, 1], outputRange: [0.35, 1] }) };
      case 'tia:spark-b':
        return { opacity: sinB.interpolate({ inputRange: [-1, 1], outputRange: [0.35, 1] }) };
    }
    return null;
  };

  // Kính lúp: lớp trên cùng, xoay quanh bàn tay phải (250, 362) — đung đưa như đang soi tìm; hành động: quét qua lại
  const magnifier =
    holding === 'magnifier' && name === 'tho' ? (
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            transformOrigin: origin([250, 362]),
            transform: [{ rotate: deg(sinA, 7) }, { rotate: rotSteps([0, 0.2, 0.45, 0.7, 0.9, 1], [0, -16, 12, -14, 4, 0]) }],
          },
        ]}
      >
        <Svg width={width} height={height} viewBox={box.join(' ')} style={StyleSheet.absoluteFill}>
          <Rect x="252" y="286" width="16" height="74" rx="8" fill="#065F46" transform="rotate(-18 260 323)" />
          <Rect x="256" y="292" width="5" height="56" rx="2.5" fill="#FFFFFF" opacity="0.25" transform="rotate(-18 260 323)" />
          <Circle cx="240" cy="246" r="46" fill="#ECFDF5" opacity="0.35" />
          <Circle cx="240" cy="246" r="46" fill="none" stroke="#047857" strokeWidth="11" />
          <Circle cx="240" cy="246" r="46" fill="none" stroke="#FFFFFF" strokeOpacity="0.25" strokeWidth="3" />
          <Path d="M214 228 Q222 212 240 208" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.85" />
          <Ellipse cx="214" cy="238" rx="4" ry="4" fill="#FFFFFF" opacity="0.8" />
          <G>
            <Circle cx="250" cy="362" r="20" fill="#FFFFFF" stroke="#10B981" strokeOpacity="0.35" strokeWidth="3" />
          </G>
        </Svg>
      </Animated.View>
    ) : null;

  const layers = MASCOT_ART[name];
  const viewBox = box.join(' ');
  const draw = (layer: (typeof layers)[number]) => (
    <Svg width={width} height={height} viewBox={viewBox} style={StyleSheet.absoluteFill}>
      {layer.render(prefix)}
    </Svg>
  );
  const shadow = layers.find((l) => l.key === 'shadow');

  const content = (
    <View style={[{ width, height }, style]} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel ?? MASCOTS.find((m) => m.name === name)?.label}>
      {shadow && (
        <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: origin([200, 412]), transform: [{ scaleX: shadowScale }] }]} pointerEvents="none">
          {draw(shadow)}
        </Animated.View>
      )}
      <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: origin(BODY_PIVOT), transform: bodyTransform }]} pointerEvents="none">
        {layers
          .filter((l) => l.key !== 'shadow')
          .map((l) => {
            const s = partStyle(l.key);
            return s ? (
              <Animated.View key={l.key} style={[StyleSheet.absoluteFill, s]}>
                {draw(l)}
              </Animated.View>
            ) : (
              <View key={l.key} style={StyleSheet.absoluteFill}>
                {draw(l)}
              </View>
            );
          })}
        {magnifier}
      </Animated.View>
    </View>
  );

  if (!pressable) return content;
  return (
    <Pressable onPress={play} accessibilityRole="button" accessibilityHint="Bấm để mascot cử động">
      {content}
    </Pressable>
  );
}
