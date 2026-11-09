import { router } from 'expo-router';
import { type GestureResponderEvent, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { InstructorTag } from '@/components/InstructorTag';
import { type CatalogCourse, formatPrice } from '@/data/courses';
import { useTheme } from '@/theme/ThemeProvider';
import { illo } from '@/theme/tokens';
import { fonts, type } from '@/theme/typography';

import { CourseCover, coursePalette } from './CourseCover';

/**
 * Thẻ khoá học ở mục Khoá học E-learning — cùng ngôn ngữ với thẻ Sách: ảnh bìa là "thẻ", nhãn giá chữ nhật ở
 * góc dưới PHẢI, nền hơi trong (chữ theo màu bìa; Miễn phí / Đã sở hữu = xanh lá); dưới ảnh: danh mục · số bài, tên (2 dòng),
 * người hướng dẫn + nút "Thêm vào" (thêm vào giỏ) → đã trong giỏ thì "Xem giỏ hàng" (mở trang giỏ).
 */
export function CourseCard({
  course,
  inCart,
  busy,
  onAddToCart,
  onOpen,
}: {
  course: CatalogCourse;
  inCart: boolean;
  busy: boolean;
  onAddToCart: (e: GestureResponderEvent) => void;
  onOpen: () => void;
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
    <View style={styles.card}>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${course.title}${course.instructor ? `, ${course.instructor.name}` : ''}, ${badge.text}`}
        onPress={onOpen}
        style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
      >
        <View style={[styles.cover, { boxShadow: colors.shadowCard }]}>
          <CourseCover id={course.id} coverUrl={course.coverUrl} />
          <View style={[styles.priceBadge, { backgroundColor: badge.bg }]}>
            {course.enrolled ? <Icon name="check" size={12} strokeWidth={3} color={badge.fg} /> : null}
            <Text style={[styles.priceText, { color: badge.fg }]}>{badge.text}</Text>
          </View>
        </View>

        <Text style={[type.chip, styles.meta, { color: colors.ink600 }]} numberOfLines={1}>
          {[course.category?.name, course.lessonCount > 0 ? `${course.lessonCount} bài học` : null].filter(Boolean).join(' · ').toUpperCase()}
        </Text>
        <Text style={[styles.title, { color: colors.ink900 }]} numberOfLines={2}>
          {course.title}
        </Text>
      </Pressable>

      <View style={styles.foot}>
        <View style={styles.grow}>{course.instructor ? <InstructorTag name={course.instructor.name} avatar={course.instructor.avatar} size={32} /> : null}</View>
        {canBuy ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={inCart ? `${course.title} đã có trong giỏ. Xem giỏ hàng` : `Thêm ${course.title} vào giỏ`}
            accessibilityState={{ selected: inCart, busy }}
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
        ) : course.enrolled ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Vào học ${course.title}`}
            onPress={() => router.push(`/courses/${course.id}`)}
            style={({ pressed }) => [styles.cartBtn, { backgroundColor: pressed ? colors.emerald800 : colors.emerald700, borderColor: colors.emerald700 }]}
          >
            <Text style={[type.label, { color: colors.onEmerald }]}>Vào học</Text>
            <Icon name="chevronRight" size={16} strokeWidth={2.4} color={colors.onEmerald} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  card: { gap: 10 },
  cover: { aspectRatio: 16 / 9, borderRadius: 18, overflow: 'hidden' },
  priceBadge: { position: 'absolute', right: 10, bottom: 10, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  priceText: { fontFamily: fonts.sans700, fontSize: 13, lineHeight: 18 },
  meta: { marginTop: 12, letterSpacing: 0.6 },
  title: { fontFamily: fonts.display600, fontSize: 18, lineHeight: 25, marginTop: 2 },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cartBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5 },
});
