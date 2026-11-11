import { router } from 'expo-router';
import { type GestureResponderEvent, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { InstructorTag } from '@/components/InstructorTag';
import { type CatalogCourse, formatPrice, studyLabel } from '@/data/courses';
import { useTheme } from '@/theme/ThemeProvider';
import { illo } from '@/theme/tokens';
import { fonts, type } from '@/theme/typography';

import { CourseCover, coursePalette } from './CourseCover';

/**
 * Thẻ khoá học ở mục Khoá học E-learning — thẻ bao trọn (viền + bóng như thẻ lịch huấn luyện): ảnh bìa sát mép trên, nhãn giá chữ nhật ở
 * góc dưới PHẢI, nền hơi trong (chữ theo màu bìa; Miễn phí / Đã sở hữu = xanh lá); dưới ảnh: danh mục · số bài, tên (2 dòng),
 * người hướng dẫn + nút "Thêm vào" (thêm vào giỏ) → đã trong giỏ thì "Xem giỏ hàng" (mở trang giỏ).
 * Đã sở hữu / miễn phí: chỉ nút "Bắt đầu học" / "Tiếp tục học" (bấm ảnh / tên khoá để xem trang giới thiệu).
 */
export function CourseCard({
  course,
  inCart,
  busy,
  onAddToCart,
  onOpen,
  onStart,
}: {
  course: CatalogCourse;
  inCart: boolean;
  busy: boolean;
  onAddToCart: (e: GestureResponderEvent) => void;
  onOpen: () => void;
  /** Bắt đầu / tiếp tục học (khoá đã sở hữu hoặc miễn phí). */
  onStart: () => void;
}) {
  const { colors } = useTheme();
  const pal = coursePalette(course.id);
  const free = course.price === 0;
  // Nhãn giá góc dưới phải ảnh bìa, nền hơi trong (cố định 2 chế độ vì nằm trên ảnh)
  const badge = course.enrolled
    ? { text: 'Đã sở hữu', bg: illo.badgeMintSoft, fg: illo.badgeMintInk }
    : free
      ? { text: 'Miễn phí', bg: illo.badgeMintSoft, fg: illo.badgeMintInk }
      : { text: formatPrice(course.price), bg: illo.badgeSoft, fg: pal.edge };
  const canBuy = !course.enrolled && !free;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line, boxShadow: colors.shadowCard }]}>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${course.title}${course.instructor ? `, ${course.instructor.name}` : ''}, ${badge.text}`}
        onPress={onOpen}
        style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
      >
        <View style={styles.cover}>
          <CourseCover id={course.id} coverUrl={course.coverUrl} />
          <View style={[styles.priceBadge, { backgroundColor: badge.bg }]}>
            {course.enrolled ? <Icon name="check" size={12} strokeWidth={3} color={badge.fg} /> : null}
            <Text style={[styles.priceText, { color: badge.fg }]}>{badge.text}</Text>
          </View>
        </View>

        <View style={styles.info}>
          <Text style={[type.chip, styles.meta, { color: colors.ink600 }]} numberOfLines={1}>
            {[course.category?.name, course.lessonCount > 0 ? `${course.lessonCount} bài học` : null].filter(Boolean).join(' · ').toUpperCase()}
          </Text>
          <Text style={[styles.title, { color: colors.ink900 }]} numberOfLines={2}>
            {course.title}
          </Text>
        </View>
      </Pressable>

      <View style={styles.foot}>
        <View style={styles.grow}>{course.instructor ? <InstructorTag name={course.instructor.name} avatar={course.instructor.avatar} size={32} /> : null}</View>
        {canBuy ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={inCart ? `${course.title} đã có trong giỏ. Xem giỏ hàng` : `Thêm ${course.title} vào giỏ`}
            accessibilityState={{ busy }}
            disabled={busy}
            onPress={(e) => (inCart ? router.navigate('/cart') : onAddToCart(e))}
            style={({ pressed }) => [
              styles.cartBtn,
              inCart
                ? { backgroundColor: colors.mint50, borderColor: colors.mint100 }
                : { backgroundColor: pressed ? colors.mint50 : colors.card, borderColor: colors.emerald700 },
              { opacity: busy ? 0.6 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] },
            ]}
          >
            <Icon name="cart" size={17} strokeWidth={2} color={colors.emerald700} duotone={inCart} />
            <Text style={[type.label, { color: colors.emerald700 }]}>{inCart ? 'Xem giỏ hàng' : 'Thêm vào'}</Text>
          </Pressable>
        ) : (
          // Đã sở hữu / miễn phí: chỉ nút học (bấm ảnh / tên khoá để xem giới thiệu)
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${studyLabel(course)} ${course.title}`}
              accessibilityState={{ busy }}
              disabled={busy}
              onPress={onStart}
              style={({ pressed }) => [
                styles.cartBtn,
                {
                  backgroundColor: pressed ? colors.emerald800 : colors.emerald700,
                  borderColor: colors.emerald700,
                  boxShadow: `0px ${pressed ? 1 : 3}px 0px ${colors.emeraldEdge}`,
                  transform: [{ translateY: pressed ? 2 : 0 }],
                  opacity: busy ? 0.7 : 1,
                },
              ]}
            >
              <Icon name="play" size={15} color={colors.onEmerald} />
              <Text style={[type.label, { color: colors.onEmerald }]}>{studyLabel(course)}</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  // Thẻ bao trọn (ảnh trên + thông tin trong cùng một khung) → ranh giới giữa các khoá rõ ràng
  card: { borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  cover: { aspectRatio: 16 / 9, overflow: 'hidden' },
  info: { paddingHorizontal: 16, paddingTop: 14 },
  priceBadge: { position: 'absolute', right: 10, bottom: 10, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  priceText: { fontFamily: fonts.sans700, fontSize: 13, lineHeight: 18 },
  meta: { letterSpacing: 0.6 },
  title: { fontFamily: fonts.display600, fontSize: 18, lineHeight: 25, marginTop: 2 },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cartBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5 },
});
