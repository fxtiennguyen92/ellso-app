import { router, useLocalSearchParams } from 'expo-router';
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  type GestureResponderEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useAuth } from '@/auth/AuthProvider';
import { PrimaryButton } from '@/components/auth/AuthUI';
import { useCart } from '@/components/cart/CartContext';
import { useStartCourse } from '@/components/catalog/useStartCourse';
import { ContentBlocks } from '@/components/content/ContentBlocks';
import { CourseCover, coursePalette } from '@/components/courses/CourseCover';
import { useDocuments } from '@/components/documents/DocumentsContext';
import { Icon, type IconName } from '@/components/Icon';
import { InstructorTag } from '@/components/InstructorTag';
import { UserAvatar } from '@/components/UserAvatar';
import { apiCourseDetail, type CourseDetail, formatPrice, studyLabel } from '@/data/courses';
import { NATIVE_DRIVER } from '@/hooks/useLoop';
import { ApiError } from '@/lib/api';
import { useTheme } from '@/theme/ThemeProvider';
import { type ChapterColor, chapterPalette, WEB_MAX_WIDTH } from '@/theme/tokens';
import { fonts, type } from '@/theme/typography';

/**
 * Trang giới thiệu khoá học E-learning (/catalog/[id], mở từ thẻ khoá ở tab Khoá học).
 * 1. Hero: ảnh bìa tràn viền (bo 2 góc dưới), lớp tối dưới đáy + danh mục / tên khoá; thanh trên: quay lại (kính mờ → nền khi cuộn).
 * 2. Mô tả ngắn, người hướng dẫn, thông số (bài học / chương / lộ trình).
 * 3. Khối mua (trong nội dung, không nổi): có phí → giá bên phải + 1 nút "Thêm vào giỏ hàng" / "Xem giỏ hàng";
 *    miễn phí / đã sở hữu → không hiện giá, 1 nút "Bắt đầu học" / "Tiếp tục học".
 * 4. Tab Tổng quan: Khoá học gồm (số chương / bài / bài thi; khoá nhiều lộ trình: số lộ trình + thẻ lộ trình riêng) ·
 *    Đánh giá năng lực bắt buộc (nếu có) · Giới thiệu (mô tả CMS) · Người hướng dẫn.
 *    Tab Bài học (chỉ khi khoá liệt kê được): các chương và bài.
 */
export function CourseDetailScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: winW } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const cartApi = useCart();
  const { showToast } = useDocuments();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [buying, setBuying] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const width = Platform.OS === 'web' ? Math.min(winW, WEB_MAX_WIDTH) : winW;
  const topInset = Platform.OS === 'web' ? 12 : insets.top + 4;
  // Thanh trên cùng: nút 40px + đệm dưới 16px (= đệm trái/phải)
  const barH = topInset + 40 + 16;
  const heroH = barH + Math.round(width * 0.62);
  const titleIn = scrollY.interpolate({ inputRange: [heroH - barH - 50, heroH - barH - 10], outputRange: [0, 1], extrapolate: 'clamp' });

  const load = useCallback(() => {
    if (!token || !id) return;
    setError(null);
    apiCourseDetail(token, id)
      .then(setCourse)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Không tải được khoá học. Thử lại sau.'));
  }, [token, id]);
  useEffect(load, [load]);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/courses'));
  const inCart = !!course && cartApi.has('course', course.id);
  const free = course?.price === 0;
  const [tab, setTab] = useState<'overview' | 'lessons'>('overview');
  const chapters = course?.outline.filter((o) => o.type === 'chapter') ?? [];
  const hasLessons = !!course && !course.personalized && chapters.length > 0;
  const examCount = course?.outline.filter((o) => o.type === 'exam').length ?? 0;
  const lessonTotal = course?.personalized
    ? course.lessonCount
    : chapters.reduce((n, c) => n + (c.type === 'chapter' ? c.lessons.length : 0), 0) || (course?.lessonCount ?? 0);
  const pal = coursePalette(course?.id ?? 0);

  const { start, busyId: startingId } = useStartCourse();

  // "Thêm vào giỏ hàng": thêm (chấm xanh bay vào giỏ), ở lại trang; nút tự đổi thành "Xem giỏ hàng"
  const addToCart = async (e?: GestureResponderEvent) => {
    if (!course || buying) return;
    setBuying(true);
    const err = await cartApi.add('course', course.id, { from: e ? { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY } : null });
    setBuying(false);
    showToast(err ?? 'Đã thêm vào giỏ hàng');
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <Animated.ScrollView
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: NATIVE_DRIVER })}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {!course && !error ? (
          <View style={[styles.center, { paddingTop: barH + 80 }]}>
            <ActivityIndicator color={colors.emerald700} />
          </View>
        ) : error ? (
          <View style={[styles.center, { paddingTop: barH + 60, gap: 12 }]}>
            <Icon name="courses" size={34} strokeWidth={1.7} color={colors.ink400} />
            <Text style={[type.body, styles.centerText, { color: colors.ink600 }]}>{error}</Text>
            <Pressable accessibilityRole="button" onPress={load} hitSlop={8}>
              <Text style={[type.label, { color: colors.emerald700 }]}>Thử lại</Text>
            </Pressable>
          </View>
        ) : course ? (
          <View>
            {/* 1. Hero: ảnh bìa + lớp tối + danh mục / tên */}
            <View style={[styles.hero, { height: heroH, backgroundColor: pal.edge }]}>
              <CourseCover id={course.id} coverUrl={course.coverUrl} iconSize={88} />
              <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none" preserveAspectRatio="none">
                <Defs>
                  <LinearGradient id="courseShade" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#0f172a" stopOpacity={0.35} />
                    <Stop offset="0.35" stopColor="#0f172a" stopOpacity={0} />
                    <Stop offset="0.55" stopColor="#0f172a" stopOpacity={0.05} />
                    <Stop offset="1" stopColor="#0f172a" stopOpacity={0.78} />
                  </LinearGradient>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#courseShade)" />
              </Svg>
              <View style={styles.heroInfo}>
                {course.category ? (
                  <View style={styles.heroTag}>
                    <Icon name="courses" size={12} strokeWidth={2.2} color="#ffffff" />
                    <Text style={styles.heroTagText} numberOfLines={1}>
                      {course.category.name}
                    </Text>
                  </View>
                ) : null}
                <Text accessibilityRole="header" style={styles.heroTitle} numberOfLines={3}>
                  {course.title}
                </Text>
              </View>
            </View>

            {/* 2. Mô tả ngắn + người hướng dẫn */}
            <View style={styles.body}>
              {course.shortDescription ? <Text style={[type.body, { color: colors.ink600 }]}>{course.shortDescription}</Text> : null}
              {course.instructor ? <InstructorTag name={course.instructor.name} avatar={course.instructor.avatar} size={36} /> : null}

              {/* 3. Khối mua / học:
                  - Đã sở hữu hoặc miễn phí: không hiện giá, chỉ 1 nút "Bắt đầu học" / "Tiếp tục học".
                  - Có phí: giá bên phải + 1 nút "Thêm vào giỏ hàng" → đã trong giỏ thì "Xem giỏ hàng". */}
              <View style={styles.buy}>
                {course.enrolled || free ? (
                  <PrimaryButton label={studyLabel(course)} icon="play" loading={startingId === course.id} onPress={() => start(course)} />
                ) : (
                  <>
                    <View style={styles.priceRow}>
                      <Text style={[styles.price, { color: colors.ink900 }]}>{formatPrice(course.price)}</Text>
                    </View>
                    <PrimaryButton
                      label={inCart ? 'Xem giỏ hàng' : 'Thêm vào giỏ hàng'}
                      icon="cart"
                      loading={buying}
                      onPress={(e) => (inCart ? router.navigate('/cart') : addToCart(e))}
                    />
                  </>
                )}
              </View>
            </View>

            {/* 4. Tab: Tổng quan · Bài học (Bài học chỉ có khi khoá liệt kê được chương / bài) */}
            <View style={[styles.tabs, { borderBottomColor: colors.line }]} accessibilityRole="tablist">
              {(hasLessons ? (['overview', 'lessons'] as const) : (['overview'] as const)).map((k) => {
                const on = tab === k;
                return (
                  <Pressable key={k} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => setTab(k)} style={styles.tab}>
                    <Text style={[styles.tabText, { color: on ? colors.ink900 : colors.ink600 }]}>{k === 'overview' ? 'Tổng quan' : 'Bài học'}</Text>
                    <View style={[styles.tabLine, { backgroundColor: on ? colors.emerald700 : 'transparent' }]} />
                  </Pressable>
                );
              })}
            </View>

            {tab === 'lessons' && hasLessons ? (
              <View style={styles.tabBody}>
                <View style={styles.outline}>
                  {(() => {
                    let n = 0;
                    return course.outline.map((ch, i) => {
                      if (ch.type === 'exam') {
                        return (
                          <View key={`e${i}`} style={[styles.exam, { backgroundColor: colors.surfaceAlt }]}>
                            <Icon name="award" size={18} color={colors.ink600} />
                            <Text style={[type.label, styles.grow, { color: colors.ink900 }]}>{ch.title}</Text>
                            <Text style={[type.caption, { color: colors.ink600 }]}>Bài thi</Text>
                          </View>
                        );
                      }
                      n += 1;
                      return <ChapterBlock key={`c${i}`} index={n} chapter={ch} />;
                    });
                  })()}
                </View>
              </View>
            ) : (
              <>
                {/* Khoá học gồm: số chương / bài / bài thi (hoặc số lộ trình với khoá nhiều lộ trình) */}
                <Section title="Khoá học gồm">
                  <View style={styles.sizeRow}>
                    {course.personalized ? (
                      <SizeTile value={course.pathsCount} label="lộ trình" />
                    ) : (
                      <SizeTile value={course.chapterCount} label="chương" />
                    )}
                    <SizeTile value={lessonTotal} label="bài học" />
                    {examCount > 0 ? <SizeTile value={examCount} label="bài thi" /> : null}
                  </View>
                  {course.personalized ? (
                    <View style={[styles.personal, { backgroundColor: colors.mint50 }]}>
                      <View style={[styles.personalIcon, { backgroundColor: colors.emerald700 }]}>
                        <Icon name="target" size={20} color={colors.onEmerald} />
                      </View>
                      <View style={styles.grow}>
                        <Text style={[type.label, { color: colors.emerald800 }]}>Lộ trình dành riêng cho bạn</Text>
                        <Text style={[type.caption, { color: colors.emerald700 }]}>
                          Khoá có {course.pathsCount} lộ trình. Sau khi đăng ký, Ellso gợi ý lộ trình phù hợp dựa trên đánh giá năng lực và vài câu hỏi ngắn.
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </Section>

              {/* 4a. Đánh giá năng lực bắt buộc */}
              {course.placementTests.length > 0 ? (
                <Section title="Cần đánh giá năng lực trước">
                  <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line }]}>
                    <Text style={[type.caption, styles.cardNote, { color: colors.ink600 }]}>
                      Khoá này cần kết quả các bài đánh giá dưới đây để gợi ý lộ trình phù hợp. Làm ở mục Đánh giá năng lực (tab Khoá học).
                    </Text>
                    {course.placementTests.map((t) => (
                      <View key={t.id} style={[styles.testRow, { borderTopColor: colors.line }]}>
                        <Icon name={t.completed ? 'checkCircle' : 'clipboard'} size={18} color={t.completed ? colors.emerald700 : colors.ink400} />
                        <Text style={[type.label, styles.grow, { color: colors.ink900 }]} numberOfLines={2}>
                          {t.title}
                        </Text>
                        <Text style={[type.captionStrong, { color: t.completed ? colors.emerald700 : colors.ink600 }]}>{t.completed ? 'Đã làm' : 'Chưa làm'}</Text>
                      </View>
                    ))}
                  </View>
                </Section>
              ) : null}

              {/* 4b. Giới thiệu */}
              {course.blocks.length > 0 ? (
                <Section title="Giới thiệu khoá học">
                  <ContentBlocks blocks={course.blocks} />
                </Section>
              ) : null}

              {/* 4d. Người hướng dẫn */}
              {course.instructor ? (
                <Section title="Người hướng dẫn">
                  <View style={styles.teacher}>
                    <UserAvatar uri={course.instructor.avatar} initials={initials(course.instructor.name)} size={56} bg={colors.mint100} fg={colors.emerald800} />
                    <View style={styles.grow}>
                      <Text style={[styles.teacherName, { color: colors.ink900 }]}>{course.instructor.name}</Text>
                      <Text style={[type.caption, { color: colors.ink600 }]}>Người hướng dẫn tại Ellso</Text>
                    </View>
                  </View>
                  {course.instructorBio ? <Text style={[type.body, { color: colors.ink600 }]}>{course.instructorBio}</Text> : null}
                </Section>
              ) : null}
              </>
            )}
          </View>
        ) : null}
      </Animated.ScrollView>

      {/* Thanh trên (phủ lên hero): quay lại kính mờ; cuộn qua hero thì hiện nền + tên khoá */}
      <View pointerEvents="box-none" style={[styles.topBar, { paddingTop: topInset, height: barH }]}>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.topBarBg, { backgroundColor: colors.bg, borderBottomColor: colors.line, opacity: titleIn }]} />
        <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" onPress={back} hitSlop={6} style={({ pressed }) => [styles.back, { opacity: pressed ? 0.75 : 1 }]}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.backSolid, { backgroundColor: colors.card, borderColor: colors.line, opacity: titleIn }]} />
          <Icon name="chevronLeft" size={22} color={course ? '#ffffff' : colors.ink900} />
          <Animated.View style={[StyleSheet.absoluteFill, styles.backIcon, { opacity: titleIn }]}>
            <Icon name="chevronLeft" size={22} color={colors.ink900} />
          </Animated.View>
        </Pressable>
        <Animated.Text numberOfLines={1} style={[styles.barTitle, { color: colors.ink900, opacity: titleIn }]}>
          {course?.title ?? ''}
        </Animated.Text>
      </View>
    </View>
  );
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

/** Ô số trong "Khoá học gồm": số lớn + nhãn (thông tin, phẳng). */
function SizeTile({ value, label }: { value: number; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.sizeTile, { backgroundColor: colors.mint50 }]}>
      <Text style={[styles.sizeValue, { color: colors.emerald700 }]}>{value}</Text>
      <Text style={[type.caption, { color: colors.emerald800 }]}>{label}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={[type.h2, { color: colors.ink900 }]}>
        {title}
      </Text>
      {children}
    </View>
  );
}

/** Một chương của đề cương: dải màu chương bên trái, tên + số bài, các bài là hàng phẳng (nhãn "Học thử" nếu có). */
function ChapterBlock({ index, chapter }: { index: number; chapter: Extract<CourseDetail['outline'][number], { type: 'chapter' }> }) {
  const { colors, scheme } = useTheme();
  const pal = chapterPalette[(chapter.color as ChapterColor) ?? 'teal'] ?? chapterPalette.teal;
  const accent = scheme === 'dark' ? pal.inkDark : pal.base;
  return (
    <View style={[styles.chapter, { backgroundColor: colors.card, borderColor: colors.line }]}>
      <View style={[styles.chapterBar, { backgroundColor: pal.base }]} />
      <View style={styles.chapterHead}>
        <Text style={[styles.chapterNo, { color: accent }]}>CHƯƠNG {index}</Text>
        <Text style={[styles.chapterTitle, { color: colors.ink900 }]}>{chapter.title}</Text>
        <Text style={[type.caption, { color: colors.ink600 }]}>{chapter.lessons.length} bài</Text>
      </View>
      {chapter.lessons.map((l, i) => (
        <View key={i} style={[styles.lesson, { borderTopColor: colors.line }]}>
          <View style={[styles.lessonNo, { backgroundColor: pal.ring }]}>
            <Text style={[styles.lessonNoText, { color: accent }]}>{i + 1}</Text>
          </View>
          <Text style={[type.body, styles.grow, { color: colors.ink900 }]} numberOfLines={2}>
            {l.title}
          </Text>
          {l.isPreview ? (
            <View style={[styles.previewTag, { backgroundColor: colors.mint50 }]}>
              <Text style={[type.chip, { color: colors.emerald700 }]}>Học thử</Text>
            </View>
          ) : l.coaching ? (
            <Icon name="users" size={16} color={colors.ink400} />
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  center: { alignItems: 'center' },
  centerText: { textAlign: 'center', paddingHorizontal: 32 },

  hero: { overflow: 'hidden', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  heroInfo: { position: 'absolute', left: 20, right: 20, bottom: 22, gap: 8 },
  heroTag: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    height: 26,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  heroTagText: { color: '#ffffff', fontFamily: fonts.sans600, fontSize: 12, lineHeight: 16 },
  heroTitle: { color: '#ffffff', fontFamily: fonts.display600, fontSize: 26, lineHeight: 34 },

  body: { paddingHorizontal: 20, paddingTop: 18, gap: 14 },

  buy: { paddingTop: 4, gap: 12 },
  priceRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  price: { fontFamily: fonts.display600, fontSize: 26, lineHeight: 32 },

  section: { paddingHorizontal: 20, paddingTop: 28, gap: 12 },
  tabs: { flexDirection: 'row', gap: 24, marginTop: 28, marginHorizontal: 20, borderBottomWidth: StyleSheet.hairlineWidth },
  tab: { paddingTop: 4, alignItems: 'center' },
  tabText: { fontFamily: fonts.display600, fontSize: 16, lineHeight: 22, paddingBottom: 10 },
  tabLine: { height: 3, borderRadius: 2, alignSelf: 'stretch' },
  tabBody: { paddingHorizontal: 20, paddingTop: 20 },
  sizeRow: { flexDirection: 'row', gap: 10 },
  sizeTile: { flex: 1, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 12, alignItems: 'center' },
  sizeValue: { fontFamily: fonts.display600, fontSize: 28, lineHeight: 34 },
  card: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 16 },
  cardNote: { paddingVertical: 12 },
  testRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth },

  personal: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18 },
  personalIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  outline: { gap: 12 },
  chapter: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', paddingLeft: 6 },
  chapterBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6 },
  chapterHead: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 12, gap: 2 },
  chapterNo: { fontFamily: fonts.sans700, fontSize: 11, lineHeight: 14, letterSpacing: 1 },
  chapterTitle: { fontFamily: fonts.display600, fontSize: 16, lineHeight: 22 },
  lesson: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 11, borderTopWidth: StyleSheet.hairlineWidth },
  lessonNo: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  lessonNoText: { fontFamily: fonts.sans700, fontSize: 12, lineHeight: 16 },
  previewTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9999 },
  exam: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 16 },

  teacher: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  teacherName: { fontFamily: fonts.display600, fontSize: 17, lineHeight: 24 },

  topBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 16 },
  topBarBg: { borderBottomWidth: StyleSheet.hairlineWidth },
  back: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15,23,42,0.28)', overflow: 'hidden' },
  backSolid: { borderRadius: 12, borderWidth: 1 },
  backIcon: { alignItems: 'center', justifyContent: 'center' },
  barTitle: { flex: 1, fontFamily: fonts.display600, fontSize: 17, lineHeight: 24 },
});
