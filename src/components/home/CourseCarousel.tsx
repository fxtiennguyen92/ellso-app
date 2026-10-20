import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Animated, Platform, Pressable, ScrollView, type ScrollViewInstance, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { BulbIllustration, TrophyIllustration, WebIllustration } from '@/components/illustrations/Illustrations';
import { useRevealStyle } from '@/components/splash/RevealContext';
import type { Course } from '@/data/home';
import { useDragScroll } from '@/hooks/useDragScroll';
import { useTheme } from '@/theme/ThemeProvider';
import type { ColorTokens } from '@/theme/tokens';
import { type } from '@/theme/typography';

import { SectionTitle } from './SectionTitle';

const CARD_WIDTH = 248;
const GAP = 12;
const isWeb = Platform.OS === 'web';

const tintOf = (course: Course, c: ColorTokens) =>
  ({
    mint: { bg: c.mint50, text: c.emerald800 },
    sky: { bg: c.skyTint, text: c.skyText },
    sun: { bg: c.sunTint, text: c.sunText },
  })[course.tint];

const illustrations = {
  bulb: BulbIllustration,
  web: WebIllustration,
  trophy: TrophyIllustration,
};

export function CourseCarousel({ courses }: { courses: Course[] }) {
  const reveal = useRevealStyle(1);
  const scrollRef = useRef<ScrollViewInstance>(null);
  useDragScroll(scrollRef, CARD_WIDTH + GAP);

  // Vị trí cuộn (px) — dùng cho hàng chấm chỉ báo
  const scrollX = useRef(new Animated.Value(0)).current;
  const [viewportW, setViewportW] = useState(0);
  const [contentW, setContentW] = useState(0);
  const maxScroll = Math.max(0, contentW - viewportW);

  return (
    <Animated.View style={[styles.section, reveal]}>
      <View style={styles.titleWrap}>
        <SectionTitle title="Khóa học của bạn" subtitle={`${courses.length} khóa đang học`} action={{ label: 'Tất cả' }} />
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + GAP}
        snapToAlignment="start"
        snapToEnd
        decelerationRate="fast"
        contentContainerStyle={styles.list}
        scrollEventThrottle={16}
        onScroll={(e) => scrollX.setValue(e.nativeEvent.contentOffset.x)}
        onLayout={(e) => setViewportW(e.nativeEvent.layout.width)}
        onContentSizeChange={(w) => setContentW(w)}
        // Trên web dùng CSS scroll-snap (snapToInterval chỉ có ở native)
        style={isWeb ? ({ scrollSnapType: 'x mandatory', scrollPaddingInline: 16 } as object) : undefined}
      >
        {courses.map((course, index) => (
          <CourseCard key={course.id} course={course} primary={index === 0} last={index === courses.length - 1} />
        ))}
      </ScrollView>

      {maxScroll > 0 && (
        <PageDots
          count={courses.length}
          scrollX={scrollX}
          maxScroll={maxScroll}
          onSelect={(x) => scrollRef.current?.scrollTo({ x, animated: true })}
        />
      )}
    </Animated.View>
  );
}

const DOT = 6;
const DOT_ACTIVE = 22;

/**
 * Hàng chấm dưới danh sách khóa học: số chấm = số thẻ, chấm của thẻ đang ở đầu dài ra.
 * Chấm co giãn liên tục theo vị trí cuộn (không đợi thả tay). Bấm vào chấm để tới thẻ đó.
 */
function PageDots({
  count,
  scrollX,
  maxScroll,
  onSelect,
}: {
  count: number;
  scrollX: Animated.Value;
  maxScroll: number;
  onSelect: (x: number) => void;
}) {
  const { colors } = useTheme();

  // Điểm dừng của từng thẻ (giống useDragScroll): đầu thẻ, riêng các thẻ cuối dừng ở mép phải.
  // Ép tăng dần để nội suy hợp lệ khi nhiều thẻ cuối cùng dừng ở mép phải.
  const stops = useMemo(() => {
    const step = CARD_WIDTH + GAP;
    const s = Array.from({ length: count }, (_, k) => Math.min(k * step, maxScroll));
    s[count - 1] = maxScroll;
    for (let k = count - 2; k >= 0; k--) s[k] = Math.min(s[k], s[k + 1] - 1);
    return s;
  }, [count, maxScroll]);

  // Chỉ số thẻ đang ở đầu, dạng số thực (0 → count-1)
  const progress = useMemo(
    () =>
      scrollX.interpolate({
        inputRange: count > 1 ? stops : [0, 1],
        outputRange: count > 1 ? stops.map((_, k) => k) : [0, 0],
        extrapolate: 'clamp',
      }),
    [scrollX, stops, count],
  );

  return (
    <View style={styles.dots}>
      {stops.map((x, i) => {
        const near = (a: number, b: number) =>
          progress.interpolate({ inputRange: [i - 1, i, i + 1], outputRange: [a, b, a], extrapolate: 'clamp' });
        return (
          <Pressable
            key={i}
            hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
            accessibilityRole="button"
            accessibilityLabel={`Tới khóa học ${i + 1} trên ${count}`}
            onPress={() => onSelect(Math.max(0, x))}
          >
            <Animated.View
              style={[
                styles.dot,
                {
                  width: near(DOT, DOT_ACTIVE),
                  backgroundColor: progress.interpolate({
                    inputRange: [i - 1, i, i + 1],
                    outputRange: [colors.line, colors.emerald500, colors.line],
                    extrapolate: 'clamp',
                  }),
                },
              ]}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

function CourseCard({ course, primary, last }: { course: Course; primary: boolean; last: boolean }) {
  const { colors } = useTheme();
  const tint = tintOf(course, colors);
  const Illustration = illustrations[course.illustration];

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.line },
        // Thẻ cuối canh theo mép phải để điểm dừng cuối cùng luôn tới được
        isWeb ? ({ scrollSnapAlign: last ? 'end' : 'start' } as object) : null,
      ]}
    >
      <View style={[styles.cover, { backgroundColor: tint.bg }]}>
        <Illustration />
        <View style={[styles.chip, { backgroundColor: colors.card }]}>
          <Text style={[type.chip, { color: tint.text }]}>{course.pathLabel}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={[type.cardTitle, { color: colors.ink900 }]} numberOfLines={1}>
          {course.title}
        </Text>
        <Text style={[type.caption, { color: colors.ink600 }]} numberOfLines={1}>
          Tiếp: Bài {course.nextLesson.number} · {course.nextLesson.title}
        </Text>

        <View style={styles.progressRow}>
          <View
            accessibilityRole="progressbar"
            accessibilityLabel={`Tiến độ ${course.title}`}
            accessibilityValue={{ min: 0, max: 100, now: course.progress }}
            style={[styles.track, { backgroundColor: colors.line }]}
          >
            <View style={[styles.fill, { width: `${course.progress}%`, backgroundColor: colors.emerald500 }]} />
          </View>
          <Text style={[type.captionStrong, { color: colors.emerald700 }]}>{course.progress}%</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Học tiếp ${course.title}`}
          onPress={() => router.push(`/courses/${course.id}`)}
          style={({ pressed }) => [
            styles.cta,
            primary
              ? { backgroundColor: pressed ? colors.emerald800 : colors.emerald700 }
              : { borderWidth: 1.5, borderColor: pressed ? colors.emerald800 : colors.emerald700 },
          ]}
        >
          {primary && <Icon name="play" size={16} color={colors.onEmerald} />}
          <Text style={[type.label, { color: primary ? colors.onEmerald : colors.emerald700 }]}>Học tiếp</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingTop: 16, gap: 12 },
  titleWrap: { paddingHorizontal: 16 },
  list: { gap: GAP, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 4 },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingTop: 2 },
  dot: { height: DOT, borderRadius: 9999 },
  card: { width: CARD_WIDTH, borderRadius: 22, borderWidth: 1, overflow: 'hidden' },
  cover: { height: 104, alignItems: 'center', justifyContent: 'center' },
  chip: { position: 'absolute', left: 12, top: 12, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9999 },
  body: { paddingTop: 14, paddingHorizontal: 16, paddingBottom: 16, gap: 6 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  track: { flex: 1, height: 8, borderRadius: 9999, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 9999 },
  cta: {
    marginTop: 6,
    height: 44,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
});