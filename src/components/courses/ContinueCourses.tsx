import { router } from 'expo-router';
import { useRef } from 'react';
import { Pressable, ScrollView, type ScrollViewInstance, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Icon } from '@/components/Icon';
import type { ContinueCourse } from '@/data/learning';
import { dmy } from '@/data/profile';
import { useDragScroll } from '@/hooks/useDragScroll';
import { useTheme } from '@/theme/ThemeProvider';
import { WEB_MAX_WIDTH } from '@/theme/tokens';
import { fonts, type } from '@/theme/typography';

import { CourseCover } from './CourseCover';

/**
 * Mục "Tiếp tục khoá học" (trên Khoá học E-learning): khoá đã mua / được cấp + khoá miễn phí đã học ≥ 1 bài.
 * Thẻ ngang cuộn được (khoá sau ló ra một chút), mỗi thẻ: ảnh bìa nhỏ · tên · bài tiếp theo · thanh tiến độ.
 * Bấm → bản đồ lộ trình /courses/[id]. Một khoá thì thẻ rộng hết hàng.
 */
export function ContinueCourses({ courses }: { courses: ContinueCourse[] }) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const rowRef = useRef<ScrollViewInstance>(null);
  useDragScroll(rowRef);

  const screenW = Math.min(width, WEB_MAX_WIDTH);
  const single = courses.length === 1;
  const cardW = single ? screenW - 32 : Math.min(screenW - 56, 340);

  return (
    <View style={[styles.section, !courses.length && styles.hidden]}>
      <View style={styles.head}>
        <Text accessibilityRole="header" style={[type.h2, { color: colors.ink900 }]}>
          Tiếp tục khoá học
        </Text>
      </View>
      {/* Luôn render ScrollView để useDragScroll gắn được ngay từ đầu (web) */}
      <ScrollView
        ref={rowRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={single ? undefined : cardW + 12}
        decelerationRate="fast"
        contentContainerStyle={styles.row}
      >
        {courses.map((c) => (
          <ContinueCard key={c.id} course={c} width={cardW} />
        ))}
      </ScrollView>
    </View>
  );
}

/** Thẻ một khoá đang học / đã xong (dùng ở mục Tiếp tục khoá học và màn Khoá học của tôi). `width` bỏ trống = rộng hết hàng. */
export function ContinueCard({ course: c, width }: { course: ContinueCourse; width?: number }) {
  const { colors } = useTheme();
  const status = c.done
    ? c.completedAt
      ? `Hoàn thành ngày ${dmy(c.completedAt)}`
      : 'Đã hoàn thành khoá học'
    : c.needsPlacementTest
      ? 'Cần làm bài đánh giá năng lực'
      : c.needsPath
        ? 'Chọn lộ trình để bắt đầu'
        : c.nextLesson
          ? `${c.started ? 'Tiếp theo' : 'Bắt đầu'}: ${c.nextLesson}`
          : 'Mở lộ trình';
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${c.title}. ${status}. Hoàn thành ${c.percent}%`}
      onPress={() => router.push({ pathname: '/courses/[id]', params: { id: String(c.id) } })}
      style={({ pressed }) => [
        styles.card,
        { width: width ?? '100%', backgroundColor: colors.card, borderColor: colors.line, boxShadow: colors.shadowCard, transform: [{ scale: pressed ? 0.985 : 1 }] },
      ]}
    >
      <View style={styles.top}>
        <View style={styles.thumb}>
          <CourseCover id={c.id} coverUrl={c.coverUrl} iconSize={26} />
        </View>
        <View style={styles.text}>
          <Text style={[styles.title, { color: colors.ink900 }]} numberOfLines={2}>
            {c.title}
          </Text>
          <Text style={[type.caption, { color: colors.ink600 }]} numberOfLines={1}>
            {status}
          </Text>
        </View>
        <View style={[styles.play, { backgroundColor: c.done ? colors.mint50 : colors.emerald700 }]}>
          <Icon name={c.done ? 'check' : 'play'} size={16} strokeWidth={c.done ? 3 : 2} color={c.done ? colors.emerald700 : colors.onEmerald} />
        </View>
      </View>
      <View style={styles.progressRow}>
        <View style={[styles.track, { backgroundColor: colors.line }]}>
          <View style={[styles.fill, { width: `${c.percent}%`, backgroundColor: colors.emerald500 }]} />
        </View>
        <Text style={[type.chip, { color: colors.emerald700 }]}>{c.percent}%</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { paddingTop: 32, gap: 12 },
  hidden: { display: 'none' },
  head: { paddingHorizontal: 16 },
  row: { gap: 12, paddingHorizontal: 16, paddingTop: 2, paddingBottom: 8 },
  card: { borderRadius: 20, borderWidth: 1, padding: 14, gap: 12 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 64, height: 64, borderRadius: 14, overflow: 'hidden' },
  text: { flex: 1, minWidth: 0, gap: 2 },
  title: { fontFamily: fonts.display600, fontSize: 15, lineHeight: 21 },
  play: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', paddingLeft: 2 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  track: { flex: 1, height: 6, borderRadius: 9999, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 9999 },
});
