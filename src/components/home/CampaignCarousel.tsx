import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  Animated,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useRevealStyle } from '@/components/splash/RevealContext';
import type { HomeCampaign } from '@/data/home';
import { useDragScroll } from '@/hooks/useDragScroll';
import { LoopActiveContext } from '@/hooks/LoopScope';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/typography';


/** Tự chuyển sang banner kế tiếp sau mỗi 10 giây (chỉ khi có từ 2 banner). */
export const AUTO_ADVANCE_MS = 10_000;
const GAP = 12;
const SIDE = 16;

/**
 * Khuyến mãi đầu Home: carousel banner chiến dịch (GET /v1/campaigns), banner 16:9 bo góc 24 (khớp CMS).
 * - Vuốt / kéo chuột để đổi, chấm chỉ báo bên dưới (chấm đang xem dài hơn).
 * - Có từ 2 banner: tự chuyển sau 10 giây; người dùng vừa vuốt thì đếm lại từ đầu; màn Home không hiện thì dừng.
 * - Bấm banner → /campaign/[id].
 */
export function CampaignCarousel({ campaigns }: { campaigns: HomeCampaign[] }) {
  const { colors } = useTheme();
  const reveal = useRevealStyle(1);
  const active = useContext(LoopActiveContext);
  const scrollRef = useRef<ScrollViewInstance | null>(null);
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const [interactedAt, setInteractedAt] = useState(0);

  const cardW = Math.max(0, width - SIDE * 2);
  const step = cardW + GAP;
  useDragScroll(scrollRef, step > 0 ? step : undefined);

  const count = campaigns.length;
  const goTo = useCallback(
    (i: number, animated = true) => {
      if (!step) return;
      scrollRef.current?.scrollTo({ x: i * step, animated });
      setIndex(i);
    },
    [step],
  );

  // Danh sách đổi (làm mới) → giữ trong phạm vi
  useEffect(() => {
    if (index >= count && count > 0) goTo(0, false);
  }, [count, index, goTo]);

  // Tự chuyển sau 10 giây; vuốt tay thì tính lại từ lúc vuốt
  useEffect(() => {
    if (count < 2 || !active || !step) return;
    const timer = setTimeout(() => goTo((index + 1) % count), AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [index, count, active, step, interactedAt, goTo]);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!step) return;
    const i = Math.round(e.nativeEvent.contentOffset.x / step);
    setIndex(Math.max(0, Math.min(count - 1, i)));
  };

  if (count === 0) return null;

  return (
    <Animated.View style={[styles.section, reveal]} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={step || undefined}
        decelerationRate="fast"
        disableIntervalMomentum
        contentContainerStyle={{ paddingHorizontal: SIDE, gap: GAP }}
        onScrollBeginDrag={() => setInteractedAt(Date.now())}
        onMomentumScrollEnd={onScrollEnd}
        onScrollEndDrag={onScrollEnd}
        scrollEventThrottle={16}
        accessibilityRole="adjustable"
        accessibilityLabel={`Khuyến mãi, ${index + 1} trên ${count}`}
      >
        {campaigns.map((c, i) => (
          <Pressable
            key={c.id}
            accessibilityRole="link"
            accessibilityLabel={`${c.title}${c.summary ? `. ${c.summary}` : ''}`}
            onPress={() => router.push(`/campaign/${c.id}`)}
            style={({ pressed }) => [
              styles.card,
              {
                width: cardW || undefined,
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
                priority={i === 0 ? 'high' : 'normal'}
              />
            ) : (
              <View style={styles.noImage}>
                <Text style={[styles.noImageText, { color: colors.emerald700 }]} numberOfLines={3}>
                  {c.title}
                </Text>
              </View>
            )}
          </Pressable>
        ))}
      </ScrollView>

      {count > 1 && (
        <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {campaigns.map((c, i) => (
            <Pressable key={c.id} hitSlop={6} onPress={() => { setInteractedAt(Date.now()); goTo(i); }}>
              <View style={[styles.dot, i === index ? [styles.dotOn, { backgroundColor: colors.emerald700 }] : { backgroundColor: colors.line }]} />
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
