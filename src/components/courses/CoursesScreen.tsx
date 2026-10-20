import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, type ScrollViewInstance, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BOTTOM_BAR_SPACE } from '@/components/BottomBar';
import { Icon } from '@/components/Icon';
import { CourseThumb, exploreArt } from '@/components/illustrations/CourseArt';
import { SCROLL_TOP_SPACE, ScrollTopButton } from '@/components/ScrollTopButton';
import { SearchButton } from '@/components/SearchButton';
import {
  categories,
  type EnrolledCourse,
  type ExploreCourse,
  type ExploreTint,
  formatPrice,
  getEnrolledCourses,
  getExploreCourses,
  initialCart,
} from '@/data/courses';
import type { CourseTint } from '@/data/home';
import { useDragScroll } from '@/hooks/useDragScroll';
import { useLoop } from '@/hooks/useLoop';
import { useScreenTopInset } from '@/hooks/useScreenTopInset';
import { useTheme } from '@/theme/ThemeProvider';
import type { ColorTokens } from '@/theme/tokens';
import { fonts, type } from '@/theme/typography';

const enrolledTint = (t: CourseTint, c: ColorTokens) => ({ mint: c.mint50, sky: c.skyTint, sun: c.sunTint })[t];

const exploreTint = (t: ExploreTint, c: ColorTokens) =>
  ({
    orange: { bg: c.orangeTint, text: c.orangeText, avatar: c.orangeTint },
    mint: { bg: c.mint50, text: c.emerald800, avatar: c.mint100 },
    sky: { bg: c.skyTint, text: c.skyText, avatar: c.skyTint },
    violet: { bg: c.violetTint, text: c.violetText, avatar: c.violetTint },
  })[t];

/** Tab Khoá học: khoá đang học + khám phá khoá mới. */
export function CoursesScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const topInset = useScreenTopInset();

  const enrolled = getEnrolledCourses();
  const explore = getExploreCourses();

  const [category, setCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<string[]>(initialCart);
  const [scrollY, setScrollY] = useState(0);
  const scrollRef = useRef<ScrollViewInstance>(null);
  // Hàng chip danh mục cuộn ngang: vuốt trên điện thoại, kéo chuột trên web
  const chipsRef = useRef<ScrollViewInstance>(null);
  useDragScroll(chipsRef);

  const filtered = useMemo(
    () => (category ? explore.filter((c) => c.categoryId === category) : explore),
    [category, explore],
  );

  const toggleCart = (id: string) => setCart((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      {/* Header cố định: tiêu đề + giỏ hàng + tìm kiếm */}
      <View
        style={[
          styles.header,
          { paddingTop: topInset, backgroundColor: colors.bg, borderBottomColor: scrollY > 4 ? colors.line : 'transparent' },
        ]}
      >
        <View style={styles.titleRow}>
          <Text accessibilityRole="header" style={[type.screenTitle, styles.grow, { color: colors.ink900 }]}>
            Khoá học
          </Text>
          <CartButton count={cart.length} />
        </View>
        <SearchButton placeholder="Tìm khoá học, giảng viên…" />
      </View>

      <ScrollView
        ref={scrollRef}
        scrollEventThrottle={16}
        onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: BOTTOM_BAR_SPACE + insets.bottom + SCROLL_TOP_SPACE + 8 }}
      >
        {/* ĐANG HỌC */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text accessibilityRole="header" style={[type.h2, styles.grow, { color: colors.ink900 }]}>
              Đang học
            </Text>
            <Text style={[type.caption, { color: colors.ink600 }]}>{enrolled.length} khoá</Text>
          </View>
          {enrolled.map((c) => (
            <EnrolledRow key={c.id} course={c} />
          ))}
        </View>

        {/* KHÁM PHÁ */}
        <View style={[styles.section, { paddingTop: 32, paddingHorizontal: 0 }]}>
          <View style={styles.pad}>
            <Text accessibilityRole="header" style={[type.h2, { color: colors.ink900 }]}>
              Khám phá khoá học
            </Text>
            <Text style={[type.caption, { color: colors.ink600 }]}>Chọn khoá tiếp theo cho bạn</Text>
          </View>

          <ScrollView
            ref={chipsRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
            accessibilityLabel="Lọc theo danh mục"
          >
            <Chip label="Tất cả" active={category === null} onPress={() => setCategory(null)} />
            {categories.map((cat) => (
              <Chip key={cat.id} label={cat.name} active={category === cat.id} onPress={() => setCategory(cat.id)} />
            ))}
          </ScrollView>

          <View style={[styles.pad, { gap: 16, paddingTop: 4 }]}>
            {filtered.map((c) => (
              <ExploreCard key={c.id} course={c} inCart={cart.includes(c.id)} onToggleCart={() => toggleCart(c.id)} />
            ))}
            {filtered.length === 0 && (
              <Text style={[type.caption, styles.empty, { color: colors.ink600 }]}>
                Chưa có khoá học trong danh mục này.
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      <ScrollTopButton visible={scrollY > 400} onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })} />
    </View>
  );
}

// ------------------------------------------------------------------

function CartButton({ count }: { count: number }) {
  const { colors } = useTheme();
  const pop = useLoop(3000, { kind: 'pop' });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={count > 0 ? `Giỏ hàng, ${count} khoá học` : 'Giỏ hàng'}
      style={({ pressed }) => [styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.line, opacity: pressed ? 0.7 : 1 }]}
    >
      <Icon name="cart" color={colors.ink900} />
      {count > 0 && (
        <Animated.View
          style={[
            styles.cartBadge,
            {
              backgroundColor: colors.emerald700,
              borderColor: colors.bg,
              transform: [{ scale: pop.interpolate({ inputRange: [-1, 0, 1], outputRange: [0.95, 1, 1.18] }) }],
            },
          ]}
        >
          <Text style={[styles.cartBadgeText, { color: colors.onEmerald }]}>{count}</Text>
        </Animated.View>
      )}
    </Pressable>
  );
}

function EnrolledRow({ course }: { course: EnrolledCourse }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${course.title}, chương ${course.chapterNo}, bài ${course.lessonNo} trên ${course.lessonTotal}, hoàn thành ${course.progress}%`}
      onPress={() => router.push(`/courses/${course.id}`)}
      style={({ pressed, hovered }) => [
        styles.enrolled,
        {
          backgroundColor: colors.card,
          borderColor: hovered ? colors.mint100 : colors.line,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
    >
      <CourseThumb illustration={course.illustration} bg={enrolledTint(course.tint, colors)} />
      <View style={styles.enrolledText}>
        <Text style={[styles.enrolledTitle, { color: colors.ink900 }]} numberOfLines={1}>
          {course.title}
        </Text>
        <Text style={[type.caption, { color: colors.ink600 }]}>
          Chương {course.chapterNo} · Bài {course.lessonNo}/{course.lessonTotal}
        </Text>
        <View style={styles.progressRow}>
          <View style={[styles.track, { backgroundColor: colors.line }]}>
            <View style={[styles.fill, { width: `${course.progress}%`, backgroundColor: colors.emerald500 }]} />
          </View>
          <Text style={[type.chip, { color: colors.emerald700 }]}>{course.progress}%</Text>
        </View>
      </View>
      <Icon name="chevronRight" size={20} color={colors.ink400} />
    </Pressable>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active
          ? { backgroundColor: colors.emerald700, borderColor: colors.emerald700 }
          : { backgroundColor: pressed ? colors.mint50 : colors.card, borderColor: colors.line },
      ]}
    >
      <Text style={[active ? type.label : styles.chipText, { color: active ? colors.onEmerald : colors.ink900 }]}>{label}</Text>
    </Pressable>
  );
}

function ExploreCard({ course, inCart, onToggleCart }: { course: ExploreCourse; inCart: boolean; onToggleCart: () => void }) {
  const { colors } = useTheme();
  const tint = exploreTint(course.tint, colors);
  const Art = exploreArt[course.illustration];
  const categoryName = categories.find((c) => c.id === course.categoryId)?.name ?? '';
  const free = course.price === 0;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line }]}>
      <View style={[styles.cover, { backgroundColor: tint.bg }]}>
        <View style={[styles.coverChip, { left: 12, backgroundColor: colors.card }]}>
          <Text style={[type.chip, { color: tint.text }]}>{categoryName}</Text>
        </View>
        {course.isNew && (
          <View style={[styles.coverChip, { right: 12, backgroundColor: colors.amberChip }]}>
            <Text style={[type.chip, styles.newText, { color: colors.amberChipText }]}>MỚI</Text>
          </View>
        )}
        <Art />
      </View>

      <View style={styles.cardBody}>
        <Text accessibilityRole="header" style={[styles.cardTitle, { color: colors.ink900 }]}>
          {course.title}
        </Text>

        <View style={styles.instructor}>
          <View style={[styles.avatar, { backgroundColor: tint.avatar }]}>
            <Text style={[styles.avatarText, { color: tint.text }]}>{course.instructor.initials}</Text>
          </View>
          <Text style={[styles.instructorName, { color: colors.ink900 }]}>{course.instructor.name}</Text>
        </View>

        <View style={styles.meta}>
          <Icon name="book" size={16} color={colors.ink600} />
          <Text style={[type.caption, { color: colors.ink600 }]}>
            {course.chapters} chương · {course.lessons} bài
          </Text>
        </View>

        <View style={[styles.priceRow, { borderTopColor: colors.line }]}>
          <View style={styles.grow}>
            <Text style={[styles.price, { color: free ? colors.emerald700 : colors.ink900 }]}>
              {free ? 'Miễn phí' : formatPrice(course.price)}
            </Text>
            {course.originalPrice ? (
              <Text style={[styles.strike, { color: colors.ink600 }]}>{formatPrice(course.originalPrice)}</Text>
            ) : null}
          </View>

          {free ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Bắt đầu học ${course.title}`}
              style={({ pressed }) => [styles.btn, { paddingHorizontal: 18, backgroundColor: pressed ? colors.emerald800 : colors.emerald700 }]}
            >
              <Text style={[type.label, { color: colors.onEmerald }]}>Bắt đầu học</Text>
            </Pressable>
          ) : inCart ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${course.title} đã có trong giỏ. Bấm để bỏ ra`}
              onPress={onToggleCart}
              style={({ pressed }) => [styles.btn, { backgroundColor: colors.mint50, opacity: pressed ? 0.8 : 1 }]}
            >
              <Icon name="check" size={18} strokeWidth={2.5} color={colors.emerald700} />
              <Text style={[type.label, { color: colors.emerald700 }]}>Trong giỏ</Text>
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Thêm ${course.title} vào giỏ`}
              onPress={onToggleCart}
              style={({ pressed }) => [
                styles.btn,
                { borderWidth: 1.5, borderColor: colors.emerald700, backgroundColor: pressed ? colors.mint50 : 'transparent' },
              ]}
            >
              <Icon name="cart" size={18} color={colors.emerald700} />
              <Text style={[type.label, { color: colors.emerald700 }]}>Thêm vào giỏ</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  pad: { paddingHorizontal: 16 },
  header: { paddingHorizontal: 16, paddingBottom: 20, gap: 20, borderBottomWidth: 1, zIndex: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cartBadge: {
    position: 'absolute',
    right: -7,
    top: -8,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 5,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: { fontFamily: fonts.sans700, fontSize: 11, lineHeight: 14 },

  section: { paddingTop: 16, paddingHorizontal: 16, gap: 12 },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },

  enrolled: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, borderRadius: 20, borderWidth: 1 },
  enrolledText: { flex: 1, minWidth: 0, gap: 2 },
  enrolledTitle: { fontFamily: fonts.display600, fontSize: 16, lineHeight: 22 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  track: { flex: 1, height: 6, borderRadius: 9999, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 9999 },

  chips: { gap: 8, paddingHorizontal: 16, paddingVertical: 4 },
  chip: { height: 40, paddingHorizontal: 16, borderRadius: 9999, borderWidth: 1, justifyContent: 'center' },
  chipText: { fontFamily: fonts.sans500, fontSize: 14, lineHeight: 20 },

  card: { borderRadius: 22, borderWidth: 1, overflow: 'hidden' },
  cover: { height: 120, alignItems: 'center', justifyContent: 'center' },
  coverChip: { position: 'absolute', top: 12, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 9999, zIndex: 1 },
  newText: { fontFamily: fonts.sans700, letterSpacing: 0.96 },
  cardBody: { paddingTop: 14, paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  cardTitle: { fontFamily: fonts.display600, fontSize: 18, lineHeight: 24 },
  instructor: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.display600, fontSize: 11, lineHeight: 14 },
  instructorName: { fontFamily: fonts.sans500, fontSize: 14, lineHeight: 20 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 10, borderTopWidth: 1 },
  price: { fontFamily: fonts.display600, fontSize: 18, lineHeight: 24 },
  strike: { fontFamily: fonts.sans400, fontSize: 12, lineHeight: 16, textDecorationLine: 'line-through' },
  btn: { height: 44, paddingHorizontal: 14, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 6 },
  empty: { textAlign: 'center', paddingVertical: 24 },
});