import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useAuth } from '@/auth/AuthProvider';
import { PrimaryButton } from '@/components/auth/AuthUI';
import { CourseCover } from '@/components/courses/CourseCover';
import { FloatingAction, floatingActionSpace } from '@/components/FloatingAction';
import { Icon } from '@/components/Icon';
import { apiPlacementResult, type PlacementResult } from '@/data/placement';
import { NATIVE_DRIVER, useLoop } from '@/hooks/useLoop';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/typography';

import { Confetti } from './Confetti';

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
};

const close = () => (router.canGoBack() ? router.back() : router.replace('/courses'));

/**
 * Kết quả bài kiểm tra đầu vào — màn "thành tựu": không header; hero xanh tràn viền với huy chương cúp bật ra (lò xo),
 * tia sáng xoay chậm, quầng sáng thở, sao lấp lánh, pháo giấy rơi một lượt; tiêu đề hiện dần. Bên dưới: từng năng lực
 * (sao theo mức, thanh % chạy lên + số đếm tăng, lần lượt), khoá học gợi ý. Nút nổi "Đóng" ở đáy.
 * Máy bật "Giảm chuyển động": bỏ pháo giấy / vòng lặp, chỉ hiện dần.
 */
export function PlacementResultScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { id, fresh } = useLocalSearchParams<{ id: string; fresh?: string }>();
  const { token } = useAuth();
  const [result, setResult] = useState<PlacementResult | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'none' | 'error'>('loading');

  useEffect(() => {
    if (!token || !id) return;
    apiPlacementResult(token, id)
      .then((r) => {
        setResult(r);
        setState(r ? 'ready' : 'none');
      })
      .catch(() => setState('error'));
  }, [token, id]);

  if (state !== 'ready' || !result) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: colors.bg }]}>
        {state === 'loading' ? (
          <ActivityIndicator color={colors.emerald700} />
        ) : (
          <Text style={[type.body, { color: colors.ink600, textAlign: 'center' }]}>
            {state === 'none' ? 'Bạn chưa làm bài kiểm tra này.' : 'Không tải được kết quả, thử lại sau.'}
          </Text>
        )}
        <FloatingAction>
          <PrimaryButton label="Đóng" onPress={close} />
        </FloatingAction>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: floatingActionSpace(insets.bottom) }} showsVerticalScrollIndicator={false}>
        <Hero result={result} fresh={!!fresh} topInset={insets.top} />

        <View style={styles.body}>
          {result.dimensions.length > 0 && (
            <View style={styles.section}>
              <Text accessibilityRole="header" style={[type.h2, { color: colors.ink900 }]}>
                Năng lực của bạn
              </Text>
              <View style={[styles.dims, { backgroundColor: colors.card, borderColor: colors.line }]}>
                {result.dimensions.map((d, i) => (
                  <DimensionRow key={d.id} dim={d} index={i} />
                ))}
              </View>
            </View>
          )}

          {result.recommendedCourses.length > 0 && (
            <View style={styles.section}>
              <Text accessibilityRole="header" style={[type.h2, { color: colors.ink900 }]}>
                Khoá học gợi ý cho bạn
              </Text>
              <View>
                {result.recommendedCourses.map((c, i) => (
                  <View key={c.id} style={[styles.course, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line }]}>
                    <View style={styles.courseThumb}>
                      <CourseCover id={c.id} coverUrl={c.coverUrl} iconSize={28} />
                    </View>
                    <View style={styles.grow}>
                      <Text style={[styles.courseTitle, { color: colors.ink900 }]} numberOfLines={2}>
                        {c.title}
                      </Text>
                      {c.shortDescription ? (
                        <Text style={[type.caption, { color: colors.ink600 }]} numberOfLines={2}>
                          {c.shortDescription}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <Confetti />

      <FloatingAction>
        <PrimaryButton label="Đóng" onPress={close} />
      </FloatingAction>
    </View>
  );
}

// ------------------------------------------------------------------ Hero thành tựu

const STAGE = 220;
const RAYS = 14;

/** Tia sáng hình quạt quanh tâm (SVG), xoay chậm phía sau huy chương. */
function rayPath() {
  const c = STAGE / 2;
  const r = STAGE / 2;
  let d = '';
  for (let i = 0; i < RAYS; i++) {
    const a = (i / RAYS) * Math.PI * 2;
    const w = (Math.PI / RAYS) * 0.45;
    d += `M${c},${c} L${c + r * Math.cos(a - w)},${c + r * Math.sin(a - w)} L${c + r * Math.cos(a + w)},${c + r * Math.sin(a + w)} Z `;
  }
  return d;
}
const RAY_D = rayPath();

const SPARKS = [
  { x: 18, y: 40, s: 18, d: 0 },
  { x: 188, y: 26, s: 14, d: 500 },
  { x: 196, y: 150, s: 20, d: 900 },
  { x: 10, y: 160, s: 12, d: 1300 },
  { x: 150, y: 196, s: 10, d: 700 },
];

function Hero({ result, fresh, topInset }: { result: PlacementResult; fresh: boolean; topInset: number }) {
  const reduced = useReducedMotion();
  const pop = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  const textIn = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  const spin = useLoop(24000, { kind: 'forward' });
  const breathe = useLoop(2400);

  useEffect(() => {
    if (reduced) return;
    Animated.sequence([
      Animated.delay(150),
      Animated.spring(pop, { toValue: 1, stiffness: 180, damping: 9, mass: 1, useNativeDriver: NATIVE_DRIVER }),
    ]).start();
    Animated.timing(textIn, { toValue: 1, duration: 600, delay: 550, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE_DRIVER }).start();
  }, [reduced, pop, textIn]);

  return (
    <View style={[styles.hero, { paddingTop: topInset + 28 }]}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="resHero" x1="0" y1="0" x2="0.4" y2="1">
            <Stop offset="0" stopColor="#065f46" />
            <Stop offset="0.55" stopColor="#047857" />
            <Stop offset="1" stopColor="#10b981" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#resHero)" />
      </Svg>

      {/* Sân khấu huy chương */}
      <View style={styles.stage}>
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }]}>
          <Svg width={STAGE} height={STAGE}>
            <Path d={RAY_D} fill="#ffffff" fillOpacity={0.1} />
          </Svg>
        </Animated.View>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.center,
            { opacity: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }), transform: [{ scale: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] }) }] },
          ]}
        >
          <Svg width={STAGE} height={STAGE}>
            <Defs>
              <RadialGradient id="resGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor="#fde68a" stopOpacity={0.75} />
                <Stop offset="0.5" stopColor="#fbbf24" stopOpacity={0.18} />
                <Stop offset="1" stopColor="#fbbf24" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={STAGE / 2} cy={STAGE / 2} r={STAGE / 2} fill="url(#resGlow)" />
          </Svg>
        </Animated.View>

        {SPARKS.map((s, i) => (
          <Spark key={i} {...s} />
        ))}

        <Animated.View
          style={[
            styles.medal,
            {
              opacity: pop.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 1] }),
              transform: [
                { scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) },
                { rotate: pop.interpolate({ inputRange: [0, 1], outputRange: ['-35deg', '0deg'] }) },
              ],
            },
          ]}
        >
          <Svg width={120} height={120} style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="resMedal" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#fef3c7" />
                <Stop offset="0.5" stopColor="#fbbf24" />
                <Stop offset="1" stopColor="#d97706" />
              </LinearGradient>
            </Defs>
            <Circle cx={60} cy={60} r={60} fill="url(#resMedal)" />
            <Circle cx={60} cy={60} r={47} fill="#ffffff" />
            <Circle cx={60} cy={60} r={47} fill="none" stroke="#fde68a" strokeWidth={3} />
          </Svg>
          {/* absolute + đứng sau SVG để nằm trên vòng tròn (web xếp lớp absolute trên phần tử thường) */}
          <View style={[StyleSheet.absoluteFill, styles.center]}>
            <Icon name="trophy" size={50} strokeWidth={1.8} color="#d97706" fill="#fde68a" fillOpacity={0.9} />
          </View>
        </Animated.View>
      </View>

      <Animated.View
        style={[
          styles.heroText,
          { opacity: textIn, transform: [{ translateY: textIn.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] },
        ]}
      >
        <Text style={styles.heroEyebrow}>{fresh ? 'CHÚC MỪNG BẠN!' : 'THÀNH TỰU CỦA BẠN'}</Text>
        <Text style={styles.heroTitle}>{fresh ? 'Bạn đã hoàn thành bài test' : 'Đã hoàn thành bài test'}</Text>
        <Text style={styles.heroSub} numberOfLines={2}>
          {result.testTitle ?? 'Bài kiểm tra đầu vào'}
        </Text>
        <View style={styles.datePill}>
          <Icon name="calendarEnd" size={13} strokeWidth={2.2} color="#ecfdf5" />
          <Text style={styles.dateText}>Ngày làm: {fmtDate(result.completedAt)}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

function Spark({ x, y, s, d }: { x: number; y: number; s: number; d: number }) {
  const tw = useLoop(1400, { delay: d });
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x,
        top: y,
        opacity: tw.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }),
        transform: [{ scale: tw.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.15] }) }, { rotate: tw.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) }],
      }}
    >
      <Icon name="sparkles" size={s} strokeWidth={2} color="#fde68a" fill="#fde68a" fillOpacity={0.9} />
    </Animated.View>
  );
}

// ------------------------------------------------------------------ Năng lực

function DimensionRow({ dim, index }: { dim: PlacementResult['dimensions'][number]; index: number }) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const pct = Math.max(0, Math.min(100, Math.round(dim.percent ?? 0)));
  const v = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  const [shown, setShown] = useState(reduced ? pct : 0);

  useEffect(() => {
    if (reduced) return;
    const sub = v.addListener(({ value }) => setShown(Math.round(value * pct)));
    Animated.timing(v, { toValue: 1, duration: 1100, delay: 900 + index * 260, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    return () => v.removeListener(sub);
  }, [v, pct, index, reduced]);

  const stars = dim.level ? Math.max(0, dim.level.levelCount - dim.level.rank + 1) : 0;

  return (
    <View style={[styles.dim, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line }]}>
      <View style={styles.dimHead}>
        <View style={styles.grow}>
          <Text style={[styles.dimName, { color: colors.ink900 }]}>{dim.name}</Text>
          {dim.level ? (
            <View style={styles.stars} accessibilityLabel={`Mức ${dim.level.name}`}>
              {Array.from({ length: dim.level.levelCount }, (_, i) => (
                <Icon key={i} name="star" size={14} strokeWidth={2} color={i < stars ? '#f59e0b' : colors.ink400} fill={i < stars ? '#fbbf24' : undefined} fillOpacity={i < stars ? 1 : 0} />
              ))}
              <Text style={[type.captionStrong, styles.levelName, { color: colors.emerald700 }]}>{dim.level.name}</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.pct, { color: colors.emerald700 }]}>{shown}%</Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.surfaceAlt }]}>
        <Animated.View style={[styles.fill, { backgroundColor: colors.emerald500, width: v.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${pct}%`] }) }]} />
      </View>
      {dim.level?.description || dim.description ? (
        <Text style={[type.caption, { color: colors.ink600 }]}>{dim.level?.description ?? dim.description}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  center: { alignItems: 'center', justifyContent: 'center' },
  hero: { alignItems: 'center', paddingBottom: 30, paddingHorizontal: 24, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden' },
  stage: { width: STAGE, height: STAGE, alignItems: 'center', justifyContent: 'center' },
  medal: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center', boxShadow: '0px 10px 24px rgba(120,53,15,0.35)', borderRadius: 60 },
  heroText: { alignItems: 'center', gap: 4, marginTop: 4 },
  heroEyebrow: { color: '#fde68a', fontFamily: fonts.sans700, fontSize: 13, lineHeight: 18, letterSpacing: 1.2 },
  heroTitle: { color: '#ffffff', fontFamily: fonts.display600, fontSize: 24, lineHeight: 32, textAlign: 'center' },
  heroSub: { color: '#d1fae5', fontFamily: fonts.sans500, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  datePill: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingHorizontal: 12, height: 30, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.16)' },
  dateText: { color: '#ecfdf5', fontFamily: fonts.sans600, fontSize: 13, lineHeight: 18 },
  body: { paddingHorizontal: 16, paddingTop: 24, gap: 28 },
  section: { gap: 12 },
  dims: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 16 },
  dim: { paddingVertical: 16, gap: 10 },
  dimHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dimName: { fontFamily: fonts.sans600, fontSize: 16, lineHeight: 22 },
  stars: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4 },
  levelName: { marginLeft: 6 },
  pct: { fontFamily: fonts.display600, fontSize: 24, lineHeight: 30 },
  track: { height: 10, borderRadius: 9999, overflow: 'hidden' },
  fill: { height: 10, borderRadius: 9999 },
  course: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  courseThumb: { width: 84, height: 56, borderRadius: 12, overflow: 'hidden' },
  courseTitle: { fontFamily: fonts.display600, fontSize: 15, lineHeight: 21 },
});
