import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent, Pressable, type ScrollViewInstance, StyleSheet, Text, View } from 'react-native';

import { useRevealStyle } from '@/components/splash/RevealContext';
import type { HomeCampaign } from '@/data/home';
import { LoopActiveContext } from '@/hooks/LoopScope';
import { useDragScroll } from '@/hooks/useDragScroll';
import { NATIVE_DRIVER } from '@/hooks/useLoop';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/typography';

/** Tự chuyển sang banner kế tiếp sau mỗi 10 giây (chỉ khi có từ 2 banner). */
export const AUTO_ADVANCE_MS = 10_000;
/** Từ 3 banner: banner chính ở giữa, 2 bên ló banner trước / sau, cuộn vòng trái – phải. */
export const CENTER_MODE_FROM = 3;
const SIDE = 16; // lề trang (1–2 banner)
const GAP = 12;
const PEEK = 34; // phần ló ra của banner hai bên (chế độ giữa)
const CENTER_GAP = 10;

/**
 * Khuyến mãi đầu Home: carousel banner chiến dịch (GET /v1/campaigns), banner 16:9 bo góc 24 (khớp CMS).
 * - 1–2 banner: banner rộng hết lề, vuốt qua lại.
 * - Từ 3 banner: banner chính ở giữa, hai bên ló banner kế bên (thu nhỏ, mờ hơn); cuộn vòng vô tận cả hai phía
 *   (danh sách được nhân 3, cuộn ra bản sao thì nhảy thầm về bản giữa).
 * - Có từ 2 banner: tự chuyển sau 10 giây; vuốt tay thì đếm lại; màn Home không hiện thì dừng.
 * - Bấm banner → /campaign/[id].
 */
export function CampaignCarousel({ campaigns }: { campaigns: HomeCampaign[] }) {
  const { colors } = useTheme();
  const reveal = useRevealStyle(1);
  const screenActive = useContext(LoopActiveContext);
  const scrollRef = useRef<ScrollViewInstance | null>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const count = campaigns.length;
  const loop = count >= CENTER_MODE_FROM;
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState(0); // banner thật đang xem (0…count-1)
  const [interactedAt, setInteractedAt] = useState(0);
  const pos = useRef(0); // vị trí ảo trong danh sách đã nhân bản
  const settleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const side = loop ? PEEK + CENTER_GAP : SIDE;
  const gap = loop ? CENTER_GAP : GAP;
  const cardW = Math.max(0, width - side * 2);
  const step = cardW + gap;
  const base = loop ? count : 0; // bản giữa bắt đầu từ đây
  useDragScroll(scrollRef, step > 0 ? step : undefined);

  const items = useMemo(
    () => (loop ? [0, 1, 2].flatMap((copy) => campaigns.map((c) => ({ c, key: `${copy}-${c.id}` }))) : campaigns.map((c) => ({ c, key: c.id }))),
    [campaigns, loop],
  );

  const scrollToPos = useCallback(
    (i: number, animated: boolean) => {
      pos.current = i;
      scrollRef.current?.scrollTo({ x: i * step, animated });
    },
    [step],
  );

  // Đo xong / đổi danh sách → đặt về banner đang xem trong bản giữa
  useEffect(() => {
    if (!step || count === 0) return;
    const real = Math.min(active, count - 1);
    const id = requestAnimationFrame(() => scrollToPos(base + real, false));
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ khi đổi kích thước / số banner
  }, [step, count, base]);

  /** Cuộn dừng hẳn: tính banner đang xem; ra khỏi bản giữa thì nhảy thầm về bản giữa. */
  const settle = useCallback(
    (x: number) => {
      if (!step || count === 0) return;
      let i = Math.round(x / step);
      if (loop && (i < count || i >= count * 2)) {
        i = count + (((i % count) + count) % count);
        scrollToPos(i, false);
      }
      pos.current = Math.max(0, Math.min(items.length - 1, i));
      setActive(pos.current % count);
    },
    [step, count, loop, items.length, scrollToPos],
  );

  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
        useNativeDriver: NATIVE_DRIVER,
        listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
          const x = e.nativeEvent.contentOffset.x;
          clearTimeout(settleTimer.current);
          settleTimer.current = setTimeout(() => settle(x), 140);
        },
      }),
    [scrollX, settle],
  );
  useEffect(() => () => clearTimeout(settleTimer.current), []);

  // Tự chuyển sau 10 giây; vuốt / bấm chấm thì tính lại từ đầu
  useEffect(() => {
    if (count < 2 || !screenActive || !step) return;
    const timer = setTimeout(() => {
      const next = loop ? pos.current + 1 : (pos.current + 1) % count;
      scrollToPos(next, true);
      setActive(next % count);
    }, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [active, count, loop, screenActive, step, interactedAt, scrollToPos]);

  const goToReal = (j: number) => {
    setInteractedAt(Date.now());
    const target = loop ? pos.current - (pos.current % count) + j : j;
    scrollToPos(target, true);
    setActive(j);
  };

  if (count === 0) return null;

  return (
    <Animated.View style={[styles.section, reveal]} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={step || undefined}
        decelerationRate="fast"
        disableIntervalMomentum
        contentContainerStyle={{ paddingHorizontal: side, gap }}
        onScrollBeginDrag={() => setInteractedAt(Date.now())}
        onScroll={onScroll}
        scrollEventThrottle={16}
        accessibilityRole="adjustable"
        accessibilityLabel={`Khuyến mãi, ${active + 1} trên ${count}`}
      >
        {items.map(({ c, key }, k) => {
          // Banner hai bên thu nhỏ + mờ hơn (chỉ chế độ giữa)
          const range = [(k - 1) * step, k * step, (k + 1) * step];
          const anim = loop && step
            ? {
                transform: [{ scale: scrollX.interpolate({ inputRange: range, outputRange: [0.92, 1, 0.92], extrapolate: 'clamp' }) }],
                opacity: scrollX.interpolate({ inputRange: range, outputRange: [0.7, 1, 0.7], extrapolate: 'clamp' }),
              }
            : null;
          return (
            <Animated.View key={key} style={[{ width: cardW || undefined }, anim]}>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={`${c.title}${c.summary ? `. ${c.summary}` : ''}`}
                onPress={() => router.push(`/campaign/${c.id}`)}
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
                  <Image
                    source={{ uri: c.bannerUrl }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    transition={200}
                    accessibilityIgnoresInvertColors
                    priority={k === base ? 'high' : 'normal'}
                  />
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
      </Animated.ScrollView>

      {count > 1 && (
        <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {campaigns.map((c, j) => (
            <Pressable key={c.id} hitSlop={6} onPress={() => goToReal(j)}>
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
  card: { aspectRatio: 16 / 9, borderRadius: 24, overflow: 'hidden' },
  noImage: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  noImageText: { fontFamily: fonts.display600, fontSize: 18, lineHeight: 24, textAlign: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingTop: 12 },
  dot: { width: 6, height: 6, borderRadius: 9999 },
  dotOn: { width: 18 },
});
