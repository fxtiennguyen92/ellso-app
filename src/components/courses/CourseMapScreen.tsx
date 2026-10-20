import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Animated, type LayoutChangeEvent, Pressable, ScrollView, type ScrollViewInstance, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { BOTTOM_BAR_SPACE } from '@/components/BottomBar';
import { ComingSoon } from '@/components/ComingSoon';
import { Icon } from '@/components/Icon';
import { SCROLL_TOP_SPACE, ScrollTopButton } from '@/components/ScrollTopButton';
import { TUTOR_LABEL } from '@/components/home/TutorSchedule';
import { getCoursePath, type PathChapter, type PathLesson } from '@/data/courses';
import { useLoop } from '@/hooks/useLoop';
import { useScreenTopInset } from '@/hooks/useScreenTopInset';
import { useTheme } from '@/theme/ThemeProvider';
import { chapterPalette, illo } from '@/theme/tokens';
import { fonts, type } from '@/theme/typography';

/** Độ lệch ngang của từng bài để tạo đường uốn lượn (chương lẻ lệch phải trước, chương chẵn lệch trái trước). */
const SNAKE = [0, 56, 84, 56, 0, -56, -84, -56];

type ChapterTheme = { base: string; edge: string; ink: string; ring: string };

/** Màn Lộ trình học của một khoá (kiểu Duolingo). */
export function CourseMapScreen({ courseId }: { courseId: string }) {
  const { colors, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const topInset = useScreenTopInset(12, 28);
  const path = getCoursePath(courseId);

  const scrollRef = useRef<ScrollViewInstance>(null);
  const [scrollY, setScrollY] = useState(0);

  // Mở màn → cuộn tới bài đang học (bài "next").
  // Cần vị trí của khối chương (trong ScrollView) + vị trí bài trong khối; hai onLayout tới theo thứ tự bất kỳ.
  const listY = useRef<Record<string, number>>({});
  const nextPos = useRef<{ chapterId: string; y: number } | null>(null);
  const scrolledToNext = useRef(false);
  const tryScrollToNext = useCallback(() => {
    const next = nextPos.current;
    if (scrolledToNext.current || !next) return;
    const base = listY.current[next.chapterId];
    if (base === undefined) return;
    scrolledToNext.current = true;
    const target = Math.max(0, base + next.y - 220);
    setTimeout(() => scrollRef.current?.scrollTo({ y: target, animated: true }), 350);
  }, []);
  const onListLayout = useCallback(
    (chapterId: string, y: number) => {
      listY.current[chapterId] = y;
      tryScrollToNext();
    },
    [tryScrollToNext],
  );
  const onNextLayout = useCallback(
    (chapterId: string, y: number) => {
      nextPos.current = { chapterId, y };
      tryScrollToNext();
    },
    [tryScrollToNext],
  );

  if (!path) return <ComingSoon title="Không tìm thấy khoá học" back />;

  const all = path.chapters.flatMap((c) => c.lessons);
  const done = all.filter((l) => l.status === 'done').length;
  const total = all.length;

  const themeOf = (ch: PathChapter): ChapterTheme => {
    const p = chapterPalette[ch.color];
    return { base: p.base, edge: p.edge, ring: p.ring, ink: scheme === 'dark' ? p.inkDark : p.base };
  };

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/courses'));

  // Con trực tiếp của ScrollView: [banner chương 1, bài chương 1, banner chương 2, …]
  // → banner ở vị trí chẵn được ghim (sticky); banner chương sau đẩy banner cũ lên.
  const sticky = path.chapters.map((_, i) => i * 2);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      {/* Header cố định */}
      <View style={[styles.header, { paddingTop: topInset, backgroundColor: colors.bg }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại danh sách khoá học"
          onPress={goBack}
          style={({ pressed }) => [styles.back, { backgroundColor: colors.card, borderColor: colors.line, opacity: pressed ? 0.7 : 1 }]}
        >
          <Icon name="chevronLeft" color={colors.ink900} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={[styles.pathLabel, { color: colors.ink600 }]}>Lộ trình: {path.pathName}</Text>
          <Text accessibilityRole="header" style={[styles.courseTitle, { color: colors.ink900 }]} numberOfLines={1}>
            {path.courseTitle}
          </Text>
        </View>
        <Text style={[styles.count, { color: colors.ink600 }]}>
          <Text style={{ color: colors.emerald700 }}>{done}</Text>/{total} bài
        </Text>
        <View
          accessibilityRole="progressbar"
          accessibilityLabel={`Tiến độ khoá học: ${done} trên ${total} bài`}
          accessibilityValue={{ min: 0, max: total, now: done }}
          style={[styles.headerTrack, { backgroundColor: colors.line }]}
        >
          <View style={[styles.headerFill, { width: `${(done / total) * 100}%`, backgroundColor: colors.emerald500 }]} />
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        stickyHeaderIndices={sticky}
        scrollEventThrottle={16}
        onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: BOTTOM_BAR_SPACE + insets.bottom + SCROLL_TOP_SPACE + 8 }}
      >
        {path.chapters.flatMap((ch, ci) => {
          const t = themeOf(ch);
          const chDone = ch.lessons.filter((l) => l.status === 'done').length;
          const sign = ci % 2 === 0 ? 1 : -1;
          return [
            <View key={`${ch.id}-banner`} style={[styles.bannerWrap, { backgroundColor: colors.bg }]}>
              <ChapterBanner index={ci + 1} chapter={ch} done={chDone} theme={t} />
            </View>,
            <View
              key={`${ch.id}-list`}
              onLayout={(e) => onListLayout(ch.id, e.nativeEvent.layout.y)}
              style={styles.list}
            >
              {ch.lessons.map((lesson, li) => (
                <LessonNode
                  key={lesson.id}
                  number={all.indexOf(lesson) + 1}
                  lesson={lesson}
                  theme={t}
                  offset={SNAKE[li % SNAKE.length] * sign}
                  onLayout={lesson.status === 'next' ? (e) => onNextLayout(ch.id, e.nativeEvent.layout.y) : undefined}
                />
              ))}
            </View>,
          ];
        })}
      </ScrollView>

      <ScrollTopButton visible={scrollY > 400} onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })} />
    </View>
  );
}

// ------------------------------------------------------------------

function ChapterBanner({ index, chapter, done, theme }: { index: number; chapter: PathChapter; done: number; theme: ChapterTheme }) {
  return (
    <View style={[styles.banner, { backgroundColor: theme.base, boxShadow: `0px 5px 0px ${theme.edge}` }]}>
      <View style={styles.bannerText}>
        <Text style={[type.eyebrow, { color: illo.onChapterMuted }]}>
          Chương {index} · {done}/{chapter.lessons.length} bài
        </Text>
        <Text accessibilityRole="header" style={[styles.bannerTitle, { color: illo.onChapter }]}>
          {chapter.title}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Tài liệu chương ${index}`}
        style={({ pressed }) => [styles.bannerBtn, { backgroundColor: illo.onChapterSoft, opacity: pressed ? 0.75 : 1 }]}
      >
        <Icon name="bookOpen" color={illo.onChapter} />
      </Pressable>
    </View>
  );
}

/** Nền gradient cho nút bài gặp gia sư / kiểm tra đã xong. */
function GradientFill({ id, from, to }: { id: string; from: string; to: string }) {
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id={id} x1="0.2" y1="0" x2="0.8" y2="1">
          <Stop offset="0" stopColor={from} />
          <Stop offset="1" stopColor={to} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

function PulseRing({ color }: { color: string }) {
  const v = useLoop(1800, { kind: 'forward' });
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        {
          borderRadius: 9999,
          backgroundColor: color,
          opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }),
          transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] }) }],
        },
      ]}
    />
  );
}

function LessonNode({
  number,
  lesson,
  theme,
  offset,
  onLayout,
}: {
  number: number;
  lesson: PathLesson;
  theme: ChapterTheme;
  offset: number;
  onLayout?: (e: LayoutChangeEvent) => void;
}) {
  const { colors } = useTheme();
  const isDone = lesson.status === 'done';
  const isNext = lesson.status === 'next';
  const square = lesson.kind !== 'lesson';
  const size = square ? 72 : isNext ? 76 : 68;
  const radius = square ? 24 : 9999;
  const iconSize = square ? 30 : isNext ? 32 : 28;

  // --- giao diện nút theo loại + trạng thái
  let nodeStyle: object;
  let iconColor: string;
  let iconOpacity = 1;
  let gradient: { from: string; to: string } | null = null;

  if (lesson.kind === 'meeting') {
    if (isDone) {
      gradient = { from: illo.meetHi, to: illo.meetLo };
      nodeStyle = { boxShadow: `0px 6px 0px ${illo.meetEdge}` };
      iconColor = illo.onChapter;
    } else {
      nodeStyle = { backgroundColor: colors.card, borderWidth: isNext ? 3 : 2, borderColor: colors.meetLine, boxShadow: `0px 6px 0px ${colors.meetLine}` };
      iconColor = colors.meetInk;
    }
  } else if (lesson.kind === 'test') {
    if (isDone) {
      gradient = { from: illo.testHi, to: illo.testLo };
      nodeStyle = { boxShadow: `0px 6px 0px ${illo.testEdge}` };
      iconColor = illo.onChapter;
    } else {
      nodeStyle = { backgroundColor: colors.card, borderWidth: isNext ? 3 : 2, borderColor: colors.testLine, boxShadow: `0px 6px 0px ${colors.testLine}` };
      iconColor = colors.testInk;
    }
  } else if (isDone) {
    nodeStyle = { backgroundColor: theme.base, boxShadow: `0px 6px 0px ${theme.edge}` };
    iconColor = illo.onChapter;
  } else if (isNext) {
    nodeStyle = { backgroundColor: colors.card, borderWidth: 3, borderColor: theme.base, boxShadow: `0px 6px 0px ${theme.edge}` };
    iconColor = theme.ink;
  } else {
    nodeStyle = { backgroundColor: colors.card, borderWidth: 2, borderColor: colors.line, boxShadow: `0px 6px 0px ${colors.line}` };
    iconColor = theme.ink;
    iconOpacity = 0.55;
  }

  const stateText = isDone ? 'Đã hoàn thành' : isNext ? 'Bài tiếp theo' : lesson.meetingDate ? `Đã đặt lịch ${lesson.meetingDate}, chưa hoàn thành` : 'Chưa mở';
  const kindText = lesson.kind === 'meeting' ? `Gặp ${TUTOR_LABEL} — ` : lesson.kind === 'test' ? 'Bài kiểm tra — ' : '';
  const a11y = `Bài ${number}: ${kindText}${lesson.title}. ${stateText}`;
  const open = isDone || isNext;

  const chip =
    lesson.kind === 'meeting'
      ? { text: `Gặp ${TUTOR_LABEL}${lesson.meetingDate && !isDone ? ` · ${lesson.meetingDate}` : ''}`, fg: colors.meetInk, bg: colors.meetTint }
      : lesson.kind === 'test'
        ? { text: 'Kiểm tra', fg: colors.testInk, bg: colors.testTint }
        : null;

  return (
    <View onLayout={onLayout} style={[styles.node, { transform: [{ translateX: offset }] }]}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        {isNext && <PulseRing color={lesson.kind === 'lesson' ? theme.ring : colors.meetLine} />}
        <Pressable
          accessibilityRole={open ? 'link' : 'image'}
          accessibilityLabel={a11y}
          disabled={!open}
          style={({ pressed }) => [
            styles.nodeBtn,
            { width: size, height: size, borderRadius: radius },
            nodeStyle,
            pressed && { transform: [{ translateY: 3 }], boxShadow: 'none' },
          ]}
        >
          {gradient && (
            <View style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]}>
              <GradientFill id={`${lesson.kind}-grad`} from={gradient.from} to={gradient.to} />
            </View>
          )}
          {/* bọc icon để nằm trên lớp gradient (lớp absolute vẽ đè phần tử thường trên web) */}
          <View style={styles.iconLayer}>
            <Icon name={lesson.icon} size={iconSize} color={iconColor} opacity={iconOpacity} />
          </View>
        </Pressable>
      </View>

      <View style={styles.labelBox}>
        {chip && (
          <View style={[styles.kindChip, { backgroundColor: chip.bg }]}>
            <Text style={[styles.kindChipText, { color: chip.fg }]}>{chip.text}</Text>
          </View>
        )}
        <Text
          style={[
            styles.label,
            isNext ? styles.labelNext : isDone ? styles.labelDone : styles.labelLocked,
            { color: open ? colors.ink900 : colors.ink600 },
          ]}
        >
          {lesson.title}
        </Text>
        {isNext && lesson.duration && <Text style={[styles.duration, { color: colors.ink600 }]}>{lesson.duration}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 20,
  },
  back: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, minWidth: 0 },
  pathLabel: { fontFamily: fonts.sans400, fontSize: 12, lineHeight: 16 },
  courseTitle: { fontFamily: fonts.display600, fontSize: 18, lineHeight: 24 },
  count: { position: 'absolute', right: 16, bottom: 10, fontFamily: fonts.sans600, fontSize: 12, lineHeight: 16 },
  headerTrack: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 4 },
  headerFill: { height: 4, borderTopRightRadius: 9999, borderBottomRightRadius: 9999 },

  bannerWrap: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingLeft: 18, paddingRight: 14, borderRadius: 20 },
  bannerText: { flex: 1, minWidth: 0 },
  bannerTitle: { fontFamily: fonts.display600, fontSize: 18, lineHeight: 24 },
  bannerBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  list: { alignItems: 'center', gap: 22, paddingTop: 16, paddingBottom: 28 },
  node: { alignItems: 'center', gap: 8 },
  nodeBtn: { alignItems: 'center', justifyContent: 'center' },
  iconLayer: { position: 'relative', zIndex: 1 },
  labelBox: { alignItems: 'center', gap: 4, maxWidth: 170 },
  kindChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 9999 },
  kindChipText: { fontFamily: fonts.sans700, fontSize: 11, lineHeight: 14, letterSpacing: 0.88, textTransform: 'uppercase' },
  label: { textAlign: 'center', fontSize: 13, lineHeight: 18 },
  labelDone: { fontFamily: fonts.sans600 },
  labelNext: { fontFamily: fonts.sans700 },
  labelLocked: { fontFamily: fonts.sans500 },
  duration: { fontFamily: fonts.sans400, fontSize: 12, lineHeight: 16, marginTop: -4 },
});