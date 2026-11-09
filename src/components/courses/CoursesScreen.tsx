import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, type GestureResponderEvent, Pressable, ScrollView, type ScrollViewInstance, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { BOTTOM_BAR_SPACE } from '@/components/BottomBar';
import { useCart } from '@/components/cart/CartContext';
import { useDocuments } from '@/components/documents/DocumentsContext';
import { Icon } from '@/components/Icon';
import { SCROLL_TOP_SPACE, ScrollTopButton } from '@/components/ScrollTopButton';
import {
  apiCatalog,
  apiCourseCategories,
  type CatalogCourse,
  type Category,
} from '@/data/courses';
import { apiPlacementTests, type PlacementTestSummary } from '@/data/placement';
import { useDragScroll } from '@/hooks/useDragScroll';
import { useScreenTopInset } from '@/hooks/useScreenTopInset';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/typography';

import { CourseCard } from './CourseCard';
import { PlacementTests } from './PlacementTests';


/**
 * Tab Khoá học: header (tiêu đề + nút tìm kiếm) · Đánh giá năng lực (bài test đầu vào, lưới 2 cột) · Khoá học E-learning
 * (nối CMS, lọc danh mục, tải thêm khi cuộn gần cuối; bấm thẻ → /catalog/[id]). Mục "Đang học" tạm ẩn. Giỏ hàng nằm ở tab riêng (BottomBar).
 */
export function CoursesScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const topInset = useScreenTopInset();
  const { token } = useAuth();
  const cart = useCart();
  const { showToast } = useDocuments();

  const [tests, setTests] = useState<PlacementTestSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [courses, setCourses] = useState<CatalogCourse[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const loadingRef = useRef(false);
  const reqRef = useRef(0);

  const [scrollY, setScrollY] = useState(0);
  const scrollRef = useRef<ScrollViewInstance>(null);
  // Hàng chip danh mục cuộn ngang: vuốt trên điện thoại, kéo chuột trên web
  const chipsRef = useRef<ScrollViewInstance>(null);
  useDragScroll(chipsRef);

  // Bài test: tải lại mỗi lần quay về tab (vừa làm xong thì thẻ chuyển xanh)
  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      apiPlacementTests(token).then(setTests).catch(() => {});
    }, [token]),
  );

  useEffect(() => {
    if (!token) return;
    apiCourseCategories(token).then(setCategories).catch(() => {});
  }, [token]);

  const loadPage = useCallback(
    async (next: number, cat: string | null) => {
      if (!token || loadingRef.current) return;
      loadingRef.current = true;
      const req = ++reqRef.current;
      setLoadingMore(true);
      setError(false);
      try {
        const res = await apiCatalog(token, next, cat ? Number(cat) : null);
        if (req !== reqRef.current) return;
        setCourses((list) => (next === 1 ? res.items : [...list, ...res.items.filter((c) => !list.some((x) => x.id === c.id))]));
        setPage(res.page);
        setHasMore(res.hasMore);
      } catch {
        if (req === reqRef.current) setError(true);
      } finally {
        loadingRef.current = false;
        if (req === reqRef.current) setLoadingMore(false);
      }
    },
    [token],
  );

  // Đổi danh mục → tải lại từ trang 1
  useEffect(() => {
    loadingRef.current = false;
    setCourses([]);
    setPage(0);
    setHasMore(true);
    loadPage(1, category);
  }, [category, loadPage]);

  const onScroll = (e: { nativeEvent: { contentOffset: { y: number }; layoutMeasurement: { height: number }; contentSize: { height: number } } }) => {
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    setScrollY(contentOffset.y);
    if (hasMore && !loadingRef.current && !error && contentOffset.y + layoutMeasurement.height > contentSize.height - 600) {
      loadPage(page + 1, category);
    }
  };

  // "Thêm vào" → thêm vào giỏ (chấm xanh bay vào tab Giỏ hàng); đã trong giỏ thì thẻ tự đổi thành "Xem giỏ hàng"
  const addToCart = async (c: CatalogCourse, e?: GestureResponderEvent) => {
    setBusyId(c.id);
    const err = await cart.add('course', c.id, { from: e ? { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY } : null });
    setBusyId(null);
    showToast(err ?? 'Đã thêm vào giỏ hàng');
  };

  // Bấm thẻ → trang giới thiệu khoá học
  const openCourse = (c: CatalogCourse) => router.push({ pathname: '/catalog/[id]', params: { id: String(c.id) } });

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      {/* Header cố định: tiêu đề + nút tìm kiếm (đệm dưới ≥ đệm trái/phải) */}
      <View
        style={[
          styles.header,
          { paddingTop: topInset, backgroundColor: colors.bg, borderBottomColor: scrollY > 4 ? colors.line : 'transparent' },
        ]}
      >
        <Text accessibilityRole="header" style={[type.screenTitle, styles.grow, { color: colors.ink900 }]}>
          Khoá học
        </Text>
        <Pressable
          accessibilityRole="search"
          accessibilityLabel="Tìm khoá học, giảng viên"
          onPress={() => router.push('/search')}
          style={({ pressed }) => [styles.iconBtn, { backgroundColor: pressed ? colors.surfaceAlt : colors.card, borderColor: colors.line }]}
        >
          <Icon name="search" color={colors.ink900} />
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        scrollEventThrottle={16}
        onScroll={onScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: BOTTOM_BAR_SPACE + insets.bottom + SCROLL_TOP_SPACE + 8 }}
      >
        {/* BÀI TEST ĐẦU VÀO */}
        <PlacementTests tests={tests} />

        {/* KHOÁ HỌC E-LEARNING */}
        <View style={[styles.section, { paddingTop: 32, paddingHorizontal: 0 }]}>
          <View style={[styles.pad, styles.titleBlock]}>
            <Text accessibilityRole="header" style={[type.h2, { color: colors.ink900 }]}>
              Khoá học E-learning
            </Text>
            <Text style={[type.caption, { color: colors.ink600 }]}>Các khoá học trực tuyến phù hợp với năng lực của bạn</Text>
          </View>

          {categories.length > 0 && (
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
          )}

          <View style={[styles.pad, styles.list]}>
            {courses.map((c) => (
              <CourseCard
                key={c.id}
                course={c}
                inCart={cart.has('course', c.id)}
                busy={busyId === c.id}
                onAddToCart={(e) => addToCart(c, e)}
                onOpen={() => openCourse(c)}
              />
            ))}
            {loadingMore && (
              <View style={styles.loading}>
                <ActivityIndicator color={colors.emerald700} />
              </View>
            )}
            {error && (
              <Pressable accessibilityRole="button" onPress={() => loadPage(page + 1, category)} style={styles.loading}>
                <Text style={[type.label, { color: colors.emerald700 }]}>Không tải được. Bấm để thử lại</Text>
              </Pressable>
            )}
            {!loadingMore && !error && courses.length === 0 && (
              <Text style={[type.caption, styles.empty, { color: colors.ink600 }]}>Chưa có khoá học trong danh mục này.</Text>
            )}
            {!hasMore && courses.length > 3 && (
              <Text style={[type.caption, styles.empty, { color: colors.ink400 }]}>Bạn đã xem hết khoá học</Text>
            )}
          </View>
        </View>
      </ScrollView>

      <ScrollTopButton visible={scrollY > 400} onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })} />
    </View>
  );
}

// ------------------------------------------------------------------

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

const styles = StyleSheet.create({
  screen: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  pad: { paddingHorizontal: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, zIndex: 10 },
  list: { gap: 28, paddingTop: 8 },
  loading: { paddingVertical: 20, alignItems: 'center' },
  iconBtn: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  section: { paddingTop: 24, paddingHorizontal: 16, gap: 12 },
  titleBlock: { gap: 2 },

  chips: { gap: 8, paddingHorizontal: 16, paddingVertical: 4 },
  chip: { height: 40, paddingHorizontal: 16, borderRadius: 9999, borderWidth: 1, justifyContent: 'center' },
  chipText: { fontFamily: fonts.sans500, fontSize: 14, lineHeight: 20 },

  empty: { textAlign: 'center', paddingVertical: 24 },
});