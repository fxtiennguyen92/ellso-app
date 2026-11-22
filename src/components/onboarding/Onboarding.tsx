import { usePathname } from 'expo-router';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Modal, Platform, StyleSheet, Text, useWindowDimensions, View, type ViewInstance } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useAuth } from '@/auth/AuthProvider';
import { PrimaryButton, TextLink } from '@/components/auth/AuthUI';
import { Mascot } from '@/components/mascots/Mascot';
import { apiMarkTip, apiResetTips } from '@/data/account';
import { NATIVE_DRIVER } from '@/hooks/useLoop';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { illo } from '@/theme/tokens';
import { type } from '@/theme/typography';

/**
 * Hướng dẫn cho người mới (tất cả bỏ qua được, mỗi thứ hiện một lần — lưu trên server theo tài khoản, đổi máy không hiện lại):
 * 1. Màn chào mừng (key "welcome"): Thỏ + giới thiệu ngắn → "Xem hướng dẫn nhanh" / "Bỏ qua".
 * 2. Tour Trang chủ ("tour-home"): tô sáng từng chỗ trên màn thật (ô tìm kiếm, tab Khoá học, Tài liệu, Hồ sơ), Thỏ nói trong bong bóng.
 *    Chỗ cần tô sáng gắn bằng `useTourTarget(id)` (ref callback, không đổi bố cục).
 * 3. Gợi ý đúng lúc (`<Hint tip="hint-…">`): thẻ nhỏ trong màn, lần đầu vào màn đó, bấm "Đã hiểu" là tắt.
 * Hồ sơ › Hỗ trợ › Xem lại hướng dẫn → `reset()`.
 */

type Rect = { x: number; y: number; w: number; h: number };
type Step = { id: string; title: string; text: string; pad?: number; radius?: number };

const TOUR: Step[] = [
  { id: 'home-search', title: 'Tìm nhanh', text: 'Gõ tên khoá học, tài liệu, sách hoặc người hướng dẫn để tìm ngay.', radius: 18 },
  { id: 'tab-courses', title: 'Khoá học', text: 'Học theo lộ trình phù hợp với năng lực của bạn. Khoá đang học nằm ở mục Tiếp tục khoá học.', radius: 24 },
  { id: 'tab-documents', title: 'Tài liệu', text: 'Video, PDF và sách. Tài liệu đang khoá sẽ chỉ cho bạn cách mở.', radius: 24 },
  { id: 'tab-profile', title: 'Hồ sơ', text: 'Gói thành viên, ảnh đại diện mascot, mã QR giới thiệu bạn bè và cài đặt của bạn.', radius: 24 },
];

type Ctx = {
  isSeen: (key: string) => boolean;
  /** false khi chưa biết danh sách đã xem (chưa tải /me) → chưa hiện gì. */
  ready: boolean;
  mark: (key: string) => void;
  reset: () => Promise<void>;
  register: (id: string, node: ViewInstance | null) => void;
};

const OnboardingContext = createContext<Ctx | null>(null);

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding phải nằm trong <OnboardingProvider>');
  return ctx;
}

/** Ref callback gắn vào phần tử cần tô sáng trong tour (vd ô tìm kiếm). */
export function useTourTarget(id: string) {
  const ctx = useContext(OnboardingContext);
  return useCallback((node: ViewInstance | null) => ctx?.register(id, node), [ctx, id]);
}

/** Đăng ký nhiều chỗ tô sáng trong một vòng lặp (vd các nút tab): register(id, node). */
export function useTourRegister() {
  const ctx = useContext(OnboardingContext);
  return useCallback((id: string, node: ViewInstance | null) => ctx?.register(id, node), [ctx]);
}

export function OnboardingProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const { user, token, status, updateUser } = useAuth();
  const pathname = usePathname();
  const targets = useRef(new Map<string, ViewInstance>());
  const [local, setLocal] = useState<Set<string>>(new Set());

  const seenList = user?.tipsSeen;
  const ready = status === 'signedIn' && !!token && Array.isArray(seenList);
  const isSeen = useCallback((key: string) => !!seenList?.includes(key) || local.has(key), [seenList, local]);

  const mark = useCallback(
    (key: string) => {
      setLocal((s) => new Set(s).add(key));
      if (token) apiMarkTip(token, key).catch(() => {}); // lỗi mạng: lần sau có thể hiện lại, không sao
    },
    [token],
  );

  const reset = useCallback(async () => {
    if (!token) return;
    const u = await apiResetTips(token);
    setLocal(new Set());
    updateUser(u);
  }, [token, updateUser]);

  const register = useCallback((id: string, node: ViewInstance | null) => {
    if (node) targets.current.set(id, node);
    else targets.current.delete(id);
  }, []);

  // Chỉ chạy ở Trang chủ, sau splash, khi đã biết danh sách đã xem
  const onHome = enabled && ready && pathname === '/';
  const showWelcome = onHome && !isSeen('welcome');
  const [touring, setTouring] = useState(false);
  useEffect(() => {
    if (onHome && isSeen('welcome') && !isSeen('tour-home')) {
      const t = setTimeout(() => setTouring(true), 600); // đợi Trang chủ vẽ xong để đo vị trí
      return () => clearTimeout(t);
    }
    setTouring(false);
  }, [onHome, isSeen]);

  const value = useMemo(() => ({ isSeen, ready, mark, reset, register }), [isSeen, ready, mark, reset, register]);

  return (
    <OnboardingContext.Provider value={value}>
      {children}
      <WelcomeModal
        visible={showWelcome}
        onStart={() => mark('welcome')}
        onSkip={() => {
          mark('welcome');
          mark('tour-home');
        }}
      />
      {touring && <TourOverlay steps={TOUR} targets={targets.current} onDone={() => mark('tour-home')} />}
    </OnboardingContext.Provider>
  );
}

// ------------------------------------------------------------------ 1. Chào mừng

function WelcomeModal({ visible, onStart, onSkip }: { visible: boolean; onStart: () => void; onSkip: () => void }) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onSkip}>
      <View style={[styles.scrimFull, { backgroundColor: illo.scrim }]}>
        <View style={[styles.welcome, { backgroundColor: colors.card }]} accessibilityViewIsModal>
          <View style={[styles.welcomeArt, { backgroundColor: colors.mint50 }]}>
            <Mascot name="tho" size={150} actionEvery={4000} accessibilityLabel="Thỏ chào bạn" />
          </View>
          <Text style={[type.h2, styles.center, { color: colors.ink900 }]}>Chào mừng bạn đến với Ellso!</Text>
          <Text style={[type.body, styles.center, { color: colors.ink600 }]}>
            Mình là Thỏ. Ellso đồng hành cùng bạn khám phá và phát triển năng lực qua các khoá học theo lộ trình, tài liệu và workshop.
          </Text>
          <View style={styles.welcomeActions}>
            <View style={styles.stretch}>
              <PrimaryButton label="Xem hướng dẫn nhanh" onPress={onStart} />
            </View>
            <TextLink label="Bỏ qua" muted onPress={onSkip} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ------------------------------------------------------------------ 2. Tour tô sáng

const measure = (node: ViewInstance | undefined) =>
  new Promise<Rect | null>((resolve) => {
    if (!node) return resolve(null);
    node.measureInWindow((x: number, y: number, w: number, h: number) => resolve(w > 0 && h > 0 ? { x, y, w, h } : null));
  });

/** Đường bao cả màn trừ một ô bo góc (fillRule evenodd → lỗ thủng). */
function holePath(W: number, H: number, r: Rect, rad: number) {
  const { x, y, w, h } = r;
  const k = Math.min(rad, w / 2, h / 2);
  return (
    `M0 0H${W}V${H}H0Z ` +
    `M${x + k} ${y}H${x + w - k}A${k} ${k} 0 0 1 ${x + w} ${y + k}V${y + h - k}A${k} ${k} 0 0 1 ${x + w - k} ${y + h}` +
    `H${x + k}A${k} ${k} 0 0 1 ${x} ${y + h - k}V${y + k}A${k} ${k} 0 0 1 ${x + k} ${y}Z`
  );
}

function TourOverlay({ steps, targets, onDone }: { steps: Step[]; targets: Map<string, ViewInstance>; onDone: () => void }) {
  const { colors } = useTheme();
  const { width: W, height: H } = useWindowDimensions();
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const fade = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  // Đo vị trí chỗ cần tô sáng; không có (chưa vẽ / bị ẩn) thì bỏ qua bước đó
  useEffect(() => {
    let alive = true;
    const step = steps[index];
    if (!step) {
      onDone();
      return;
    }
    measure(targets.get(step.id)).then((r) => {
      if (!alive) return;
      if (!r) {
        setIndex((i) => i + 1);
        return;
      }
      const pad = step.pad ?? 6;
      setRect({ x: r.x - pad, y: r.y - pad, w: r.w + pad * 2, h: r.h + pad * 2 });
      fade.setValue(0);
      Animated.timing(fade, { toValue: 1, duration: 220, easing: Easing.out(Easing.ease), useNativeDriver: NATIVE_DRIVER }).start();
    });
    return () => {
      alive = false;
    };
  }, [index, steps, targets, onDone, fade]);

  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: NATIVE_DRIVER }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: NATIVE_DRIVER }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, reduced]);

  const step = steps[index];
  if (!step || !rect) return null;
  const last = index === steps.length - 1;
  const below = rect.y + rect.h / 2 < H / 2; // chỗ tô sáng ở nửa trên → bong bóng ở dưới
  const bubblePos = below ? { top: rect.y + rect.h + 14 } : { bottom: H - rect.y + 14 };
  const tailLeft = Math.min(Math.max(rect.x + rect.w / 2 - 16 - 9, 18), W - 32 - 36);

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onDone}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade }]} accessibilityViewIsModal>
        <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
          <Path d={holePath(W, H, rect, step.radius ?? 16)} fill={illo.scrim} fillRule="evenodd" />
        </Svg>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ring,
            {
              left: rect.x - 3,
              top: rect.y - 3,
              width: rect.w + 6,
              height: rect.h + 6,
              borderRadius: (step.radius ?? 16) + 3,
              borderColor: colors.emerald500,
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.45] }),
              transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] }) }],
            },
          ]}
        />

        <View style={[styles.bubble, bubblePos, { backgroundColor: colors.card }]} accessibilityLiveRegion="polite">
          <View style={[styles.tail, below ? styles.tailTop : styles.tailBottom, { left: tailLeft, backgroundColor: colors.card }]} />
          <View style={styles.bubbleHead}>
            <View style={[styles.face, { backgroundColor: colors.mint50 }]}>
              <Mascot name="tho" size={46} crop="face" motion="subtle" />
            </View>
            <View style={styles.grow}>
              <Text style={[type.cardTitle, { color: colors.ink900 }]}>{step.title}</Text>
              <Text style={[type.body, { color: colors.ink600 }]}>{step.text}</Text>
            </View>
          </View>
          <View style={styles.bubbleFoot}>
            <TextLink label="Bỏ qua" muted onPress={onDone} />
            <View style={styles.dots}>
              {steps.map((s, i) => (
                <View key={s.id} style={[styles.dot, { backgroundColor: i === index ? colors.emerald700 : colors.line, width: i === index ? 16 : 6 }]} />
              ))}
            </View>
            <View style={styles.next}>
              <PrimaryButton label={last ? 'Bắt đầu học' : 'Tiếp'} onPress={() => (last ? onDone() : setIndex(index + 1))} />
            </View>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

// ------------------------------------------------------------------ 3. Gợi ý đúng lúc

/**
 * Gợi ý nhỏ trong màn, lần đầu vào màn đó (vd bản đồ bài học, Workshop, vé chương trình, tài liệu đang khoá).
 * Thẻ phẳng (thông tin), chỉ nút "Đã hiểu" bấm được.
 */
export function Hint({ tip, text, style }: { tip: string; text: string; style?: object }) {
  const { colors } = useTheme();
  const ctx = useContext(OnboardingContext);
  const [gone, setGone] = useState(false);
  if (!ctx || !ctx.ready || gone || ctx.isSeen(tip)) return null;
  return (
    <View style={[styles.hint, { backgroundColor: colors.mint50, borderColor: colors.mint100 }, style]} accessibilityRole="summary">
      <View style={[styles.hintFace, { backgroundColor: colors.card }]}>
        <Mascot name="tho" size={36} crop="face" motion="subtle" />
      </View>
      <Text style={[type.caption, styles.grow, { color: colors.ink900 }]}>{text}</Text>
      <TextLink
        label="Đã hiểu"
        onPress={() => {
          setGone(true);
          ctx.mark(tip);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  center: { textAlign: 'center' },
  stretch: { alignSelf: 'stretch' },
  scrimFull: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  welcome: { width: '100%', maxWidth: 400, borderRadius: 28, padding: 22, gap: 12, alignItems: 'center' },
  welcomeArt: { width: 190, height: 190, borderRadius: 95, alignItems: 'center', justifyContent: 'flex-end', marginBottom: 4, overflow: 'hidden' },
  welcomeActions: { alignSelf: 'stretch', gap: 10, alignItems: 'center', marginTop: 6 },
  ring: { position: 'absolute', borderWidth: 3 },
  bubble: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 22,
    padding: 16,
    gap: 14,
    ...(Platform.OS === 'web' ? { maxWidth: 480 } : null),
  },
  tail: { position: 'absolute', width: 18, height: 18, transform: [{ rotate: '45deg' }] },
  tailTop: { top: -8 },
  tailBottom: { bottom: -8 },
  bubbleHead: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  face: { width: 46, height: 46, borderRadius: 23, overflow: 'hidden' },
  bubbleFoot: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dots: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 5 },
  dot: { height: 6, borderRadius: 3 },
  next: { minWidth: 112 },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 16, paddingVertical: 10, paddingLeft: 10, paddingRight: 14 },
  hintFace: { width: 36, height: 36, borderRadius: 18, overflow: 'hidden' },
});
