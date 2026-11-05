import { Image } from 'expo-image';
import { router } from 'expo-router';
import { type ComponentRef, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, type LayoutChangeEvent, PanResponder, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useRevealStyle } from '@/components/splash/RevealContext';
import type { HomeCampaign } from '@/data/home';
import { LoopActiveContext } from '@/hooks/LoopScope';
import { NATIVE_DRIVER } from '@/hooks/useLoop';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/typography';

/** Tự chuyển sang banner kế tiếp sau mỗi 10 giây (chỉ khi có từ 2 banner). */
export const AUTO_ADVANCE_MS = 10_000;
/** Từ 3 banner: cuộn vòng (sau banner cuối là banner đầu). 2 banner: không vòng, chỉ ló banner kia. */
export const LOOP_FROM = 3;
const SIDE = 16; // lề trang khi chỉ có 1 banner
const PEEK = 34; // phần ló ra của banner hai bên
const GAP = 10;
const SHADOW = 8; // chừa chỗ cho bóng dưới banner

/**
 * Khuyến mãi đầu Home: banner chiến dịch (GET /v1/campaigns), 16:9 bo góc 24 (khớp CMS).
 * - 1 banner: rộng hết lề.
 * - Từ 2 banner: banner chính ở giữa, hai bên ló banner kế bên (thu nhỏ, mờ hơn).
 *   2 banner: không vòng (đang ở banner 1 thì bên trái trống). Từ 3 banner: vòng vô tận cả hai phía.
 * - Vị trí là một Animated.Value "p" (đơn vị: banner); mỗi banner tự tính khoảng cách tới p (có modulo khi vòng)
 *   → chuyển 3 → 1 chỉ là trượt thêm một bước, không có cú nhảy vị trí nào (hết giật).
 * - Vuốt (PanResponder trên native) / kéo chuột hoặc vuốt trên web (pointer event) để đổi; tự chuyển sau 10 giây, vuốt tay hoặc bấm chấm thì đếm lại;
 *   màn Home không hiện thì dừng. Bấm banner → /campaign/[id].
 */
export function CampaignCarousel({ campaigns }: { campaigns: HomeCampaign[] }) {
  const { colors } = useTheme();
  const reveal = useRevealStyle(1);
  const reduced = useReducedMotion();
  const screenActive = useContext(LoopActiveContext);

  const count = campaigns.length;
  const loop = count >= LOOP_FROM;
  const center = count >= 2;
  const [width, setWidth] = useState(0);
  const side = center ? PEEK + GAP : SIDE;
  const cardW = Math.max(0, width - side * 2);
  const step = cardW + GAP;

  const p = useRef(new Animated.Value(0)).current;
  const target = useRef(0); // vị trí đích (số nguyên; khi vòng có thể âm / vượt count)
  const [active, setActive] = useState(0);
  const [interactedAt, setInteractedAt] = useState(0);

  const realOf = useCallback((i: number) => ((i % count) + count) % count, [count]);

  const animateTo = useCallback(
    (i: number) => {
      const clamped = loop ? i : Math.max(0, Math.min(count - 1, i));
      target.current = clamped;
      setActive(realOf(clamped));
      Animated.timing(p, {
        toValue: clamped,
        duration: reduced ? 0 : 520,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        useNativeDriver: NATIVE_DRIVER,
      }).start();
    },
    [loop, count, p, realOf, reduced],
  );

  // Đổi số banner (làm mới) → về banner đầu
  useEffect(() => {
    target.current = 0;
    p.setValue(0);
    setActive(0);
  }, [count, p]);

  // Tự chuyển sau 10 giây
  useEffect(() => {
    if (count < 2 || !screenActive || !step) return;
    const timer = setTimeout(() => animateTo(loop ? target.current + 1 : (target.current + 1) % count), AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [active, count, loop, screenActive, step, interactedAt, animateTo]);

  // ---- Kéo / vuốt ngang: logic chung ----
  const dragStart = useCallback(() => {
    p.stopAnimation();
    setInteractedAt(Date.now());
  }, [p]);
  const dragMove = useCallback(
    (dx: number) => {
      if (!step) return;
      let v = target.current - dx / step;
      if (!loop) v = Math.max(-0.25, Math.min(count - 0.75, v)); // kéo quá mép thì chỉ nhích nhẹ
      p.setValue(v);
    },
    [step, loop, count, p],
  );
  const dragEnd = useCallback(
    (dx: number, vx: number) => {
      const moved = step ? dx / step : 0;
      const dir = Math.abs(moved) > 0.18 || Math.abs(vx) > 0.35 ? -Math.sign(dx) : 0;
      animateTo(target.current + dir);
    },
    [step, animateTo],
  );
  const isHorizontal = (dx: number, dy: number) => Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.2;

  // iOS / Android: PanResponder — chỉ nhận khi kéo ngang rõ ràng (cuộn dọc trang vẫn mượt); chạm nhẹ vẫn là bấm banner.
  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => count > 1 && isHorizontal(g.dx, g.dy),
        onMoveShouldSetPanResponderCapture: (_, g) => count > 1 && isHorizontal(g.dx, g.dy),
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: dragStart,
        onPanResponderMove: (_, g) => dragMove(g.dx),
        onPanResponderRelease: (_, g) => dragEnd(g.dx, g.vx),
        onPanResponderTerminate: () => animateTo(target.current),
      }),
    [count, dragStart, dragMove, dragEnd, animateTo],
  );

  // Web: hệ responder của react-native-web không nhận kéo chuột ở đây → nghe pointer event trực tiếp trên vùng banner.
  const trackRef = useRef<ComponentRef<typeof View>>(null);
  useEffect(() => {
    if (Platform.OS !== 'web' || count < 2) return;
    const node = trackRef.current as unknown as HTMLElement | null;
    if (!node) return;
    let down = false;
    let dragging = false;
    let x0 = 0;
    let y0 = 0;
    let lastX = 0;
    let lastT = 0;
    let vx = 0;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      down = true;
      dragging = false;
      x0 = lastX = e.clientX;
      y0 = e.clientY;
      lastT = e.timeStamp;
      vx = 0;
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - x0;
      if (!dragging) {
        if (!isHorizontal(dx, e.clientY - y0)) return;
        dragging = true;
        dragStart();
        node.setPointerCapture?.(e.pointerId);
      }
      e.preventDefault();
      const dt = e.timeStamp - lastT;
      if (dt > 0) vx = (e.clientX - lastX) / dt;
      lastX = e.clientX;
      lastT = e.timeStamp;
      dragMove(dx);
    };
    const onUp = (e: PointerEvent) => {
      if (!down) return;
      down = false;
      if (dragging) dragEnd(e.clientX - x0, vx);
    };
    // Vừa kéo xong thì chặn cú click để không mở banner ngoài ý muốn
    const onClick = (e: MouseEvent) => {
      if (dragging) {
        e.stopPropagation();
        e.preventDefault();
        dragging = false;
      }
    };
    const noDrag = (e: Event) => e.preventDefault(); // không kéo-thả ảnh gốc của trình duyệt
    node.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    node.addEventListener('click', onClick, true);
    node.addEventListener('dragstart', noDrag);
    node.style.touchAction = 'pan-y';
    return () => {
      node.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      node.removeEventListener('click', onClick, true);
      node.removeEventListener('dragstart', noDrag);
    };
  }, [count, dragStart, dragMove, dragEnd]);

  if (count === 0) return null;
  const cardH = cardW * (9 / 16);
  const half = count / 2;

  return (
    <Animated.View style={[styles.section, reveal]} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
      <View
        ref={trackRef}
        {...(Platform.OS === 'web' ? null : pan.panHandlers)}
        style={[styles.track, { height: cardH + SHADOW }]}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={`Khuyến mãi: ${campaigns[active]?.title ?? ''}, ${active + 1} trên ${count}`}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }, { name: 'activate' }]}
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === 'increment') animateTo(target.current + 1);
          else if (e.nativeEvent.actionName === 'decrement') animateTo(target.current - 1);
          else router.push(`/campaign/${campaigns[active].id}`);
        }}
      >
        {width > 0 &&
          campaigns.map((c, j) => {
            // d = khoảng cách (đơn vị banner) từ banner j tới vị trí đang xem; vòng: đưa về [-count/2, count/2)
            const d = loop
              ? Animated.add(Animated.modulo(Animated.add(Animated.multiply(p, -1), j + half + count * 1000), count), -half)
              : Animated.add(Animated.multiply(p, -1), j);
            const style = {
              transform: [
                { translateX: Animated.multiply(d, step) },
                { scale: d.interpolate({ inputRange: [-1, 0, 1], outputRange: [0.92, 1, 0.92], extrapolate: 'clamp' }) },
              ],
              opacity: d.interpolate({ inputRange: [-2, -1, 0, 1, 2], outputRange: [0, 0.75, 1, 0.75, 0], extrapolate: 'clamp' }),
            };
            return (
              <Animated.View key={c.id} style={[styles.slot, { left: side, width: cardW, height: cardH }, style]} importantForAccessibility="no-hide-descendants">
                <Pressable
                  accessibilityElementsHidden
                  onPress={() => {
                    if (realOf(target.current) === j) router.push(`/campaign/${c.id}`);
                    else {
                      // Bấm banner bên cạnh → trượt tới nó
                      setInteractedAt(Date.now());
                      const diff = loop ? ((j - realOf(target.current) + count + half) % count) - half : j - target.current;
                      animateTo(target.current + Math.round(diff));
                    }
                  }}
                  style={({ pressed }) => [
                    styles.card,
                    {
                      backgroundColor: colors.mint50,
                      boxShadow: `0px ${pressed ? 2 : 6}px 0px ${colors.pillGlow}`,
                      transform: [{ translateY: pressed ? 4 : 0 }],
                    },
                  ]}
                >
                  {c.bannerUrl ? (
                    // pointerEvents none: web không kéo-thả ảnh gốc (làm mất thao tác vuốt)
                    <View style={StyleSheet.absoluteFill} pointerEvents="none">
                      <Image source={{ uri: c.bannerUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} priority={j === 0 ? 'high' : 'normal'} />
                    </View>
                  ) : (
                    <View style={styles.noImage}>
                      <Text style={[styles.noImageText, { color: colors.emerald700 }]} numberOfLines={3}>
                        {c.title}
                      </Text>
                    </View>
                  )}
                </Pressable>
              </Animated.View>
            );
          })}
      </View>

      {count > 1 && (
        <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {campaigns.map((c, j) => (
            <Pressable
              key={c.id}
              hitSlop={6}
              onPress={() => {
                setInteractedAt(Date.now());
                const diff = loop ? ((j - realOf(target.current) + count + half) % count) - half : j - target.current;
                animateTo(target.current + Math.round(diff));
              }}
            >
              <View style={[styles.dot, j === active ? [styles.dotOn, { backgroundColor: colors.emerald700 }] : { backgroundColor: colors.line }]} />
            </Pressable>
          ))}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  section: { paddingTop: 8 },
  track: { overflow: 'hidden' },
  slot: { position: 'absolute', top: 0 },
  card: { flex: 1, borderRadius: 24, overflow: 'hidden' },
  noImage: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  noImageText: { fontFamily: fonts.display600, fontSize: 18, lineHeight: 24, textAlign: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 9999 },
  dotOn: { width: 18 },
});
