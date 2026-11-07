import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Pattern, Rect, Stop } from 'react-native-svg';

import { useAuth } from '@/auth/AuthProvider';
import { PrimaryButton, SecondaryButton } from '@/components/auth/AuthUI';
import { AccessChip } from '@/components/documents/DocParts';
import { useDocuments } from '@/components/documents/DocumentsContext';
import { FloatingAction, floatingActionSpace } from '@/components/FloatingAction';
import { Icon } from '@/components/Icon';
import { InstructorTag } from '@/components/InstructorTag';
import { apiBook, apiBooks, type BookDetail, fileSize, unitLabel } from '@/data/books';
import { formatPrice } from '@/data/courses';
import type { Doc } from '@/data/documents';
import { NATIVE_DRIVER } from '@/hooks/useLoop';
import { ApiError } from '@/lib/api';
import { useTheme } from '@/theme/ThemeProvider';
import { chapterPalette, illo, WEB_MAX_WIDTH } from '@/theme/tokens';
import { fonts, type } from '@/theme/typography';

/**
 * Sách › thông tin (/books/[id]), mở từ mục Sách ở Trang chủ.
 * - Hero tràn viền theo màu bìa (gradient + lưới chấm + vòng tròn), bìa sách lớn ở giữa — bấm bìa = đọc thử.
 * - Khối nội dung bo tròn đè hero: tác giả (Người hướng dẫn nếu là giảng viên Ellso), tên sách, quyền xem,
 *   dải thông tin phẳng (định dạng · độ dài · đọc thử), Giới thiệu (thu gọn / xem thêm), Sách khác (cuộn ngang).
 * - Nút nổi: đã mở khoá → "Đọc sách"; chưa → "Đọc thử" + "Mở khoá" (bảng Cách mở tài liệu).
 * - Thanh trên: quay lại + lưu (bookmark to, không vòng tròn); cuộn qua hero thì hiện nền + tên sách.
 */
export function BookScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: winW } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const { isSaved, toggleSave, openDoc } = useDocuments();
  const [book, setBook] = useState<BookDetail | null>(null);
  const [others, setOthers] = useState<Doc[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [solid, setSolid] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const width = Platform.OS === 'web' ? Math.min(winW, WEB_MAX_WIDTH) : winW;
  const topInset = Platform.OS === 'web' ? 12 : insets.top + 4;
  const barH = topInset + 52;
  const coverW = Math.min(200, Math.round(width * 0.46));
  const heroH = barH + coverW * 1.5 + 64;

  const load = useCallback(() => {
    if (!token || !id) return;
    setError(null);
    apiBook(token, id)
      .then(setBook)
      .catch((e) => setError(e instanceof ApiError && e.status === 404 ? 'Sách không tồn tại hoặc đã bị ẩn.' : 'Không tải được thông tin sách.'));
    apiBooks(token)
      .then((list) => setOthers(list.filter((b) => b.id !== id).slice(0, 10)))
      .catch(() => {});
  }, [token, id]);
  useEffect(load, [load]);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const read = (mode: 'preview' | 'full') => book && router.push({ pathname: '/books/[id]/read', params: { id: book.id, mode } });

  const pal = chapterPalette[book?.cover ?? 'teal'];
  const barIn = scrollY.interpolate({ inputRange: [heroH - barH - 60, heroH - barH - 10], outputRange: [0, 1], extrapolate: 'clamp' });
  const coverLift = scrollY.interpolate({ inputRange: [-160, 0, heroH], outputRange: [40, 0, -heroH * 0.25], extrapolate: 'clamp' });
  const coverScale = scrollY.interpolate({ inputRange: [-160, 0], outputRange: [1.12, 1], extrapolateRight: 'clamp' });

  const unit = unitLabel(book?.format ?? null);
  const buy = book?.access.find((a) => a.kind === 'buy');
  const saved = book ? isSaved(book) : false;
  const longDesc = (book?.description?.length ?? 0) > 220;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <Animated.ScrollView
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: NATIVE_DRIVER,
          // thanh trên đã có nền sáng / tối → icon đổi sang màu chữ thường
          listener: (e: { nativeEvent: { contentOffset: { y: number } } }) => {
            const on = e.nativeEvent.contentOffset.y > heroH - barH - 35;
            setSolid((v) => (v === on ? v : on));
          },
        })}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: floatingActionSpace(insets.bottom) }}
      >
        {/* ---------- Hero theo màu bìa ---------- */}
        <View style={[styles.hero, { height: heroH, backgroundColor: pal.edge }]}>
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
            <Defs>
              <LinearGradient id={`bookHero-${pal.base}`} x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={pal.base} />
                <Stop offset="1" stopColor={pal.edge} />
              </LinearGradient>
              <Pattern id="bookDots" width={16} height={16} patternUnits="userSpaceOnUse">
                <Circle cx={2} cy={2} r={1} fill="#ffffff" fillOpacity={0.12} />
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill={`url(#bookHero-${pal.base})`} />
            <Rect width="100%" height="100%" fill="url(#bookDots)" />
            {[70, 120, 170, 220, 270].map((r) => (
              <Circle key={r} cx={width / 2} cy={barH + coverW * 0.75} r={r} stroke="#ffffff" strokeOpacity={0.1} strokeWidth={1.2} fill="none" />
            ))}
          </Svg>
          {/* bìa phóng to + làm mờ làm nền (khi có ảnh bìa) */}
          {book?.coverUrl ? (
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <Image source={{ uri: book.coverUrl }} style={[StyleSheet.absoluteFill, styles.blurImg]} contentFit="cover" blurRadius={36} />
              <View style={[StyleSheet.absoluteFill, { backgroundColor: pal.edge, opacity: 0.45 }]} />
            </View>
          ) : null}

          <Animated.View style={[styles.coverWrap, { top: barH + 6, transform: [{ translateY: coverLift }, { scale: coverScale }] }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={book ? `Bìa sách ${book.title}. ${book.preview.available || book.unlocked ? 'Bấm để đọc' : ''}` : 'Bìa sách'}
              disabled={!book || (!book.unlocked && !book.preview.available)}
              onPress={() => read(book?.unlocked ? 'full' : 'preview')}
              style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}
            >
              <View style={[styles.cover, { width: coverW, height: coverW * 1.5, backgroundColor: pal.base }]}>
                {book?.coverUrl ? (
                  <Image source={{ uri: book.coverUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} accessibilityIgnoresInvertColors />
                ) : (
                  <View style={styles.coverText}>
                    <Text style={styles.coverTitle} numberOfLines={4}>
                      {book?.title ?? ''}
                    </Text>
                  </View>
                )}
                {/* gáy sách + ánh sáng */}
                <View style={styles.spine} />
                <View style={styles.gloss} />
              </View>
            </Pressable>
          </Animated.View>
        </View>

        {/* ---------- Nội dung ---------- */}
        <View style={[styles.sheet, { backgroundColor: colors.bg }]}>
          {!book && !error ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.emerald700} />
            </View>
          ) : error ? (
            <View style={styles.errorBox}>
              <Icon name="book" size={34} strokeWidth={1.7} color={colors.ink400} />
              <Text style={[type.body, styles.center, { color: colors.ink600 }]}>{error}</Text>
              <Pressable accessibilityRole="button" onPress={load} hitSlop={8}>
                <Text style={[type.label, { color: colors.emerald700 }]}>Thử lại</Text>
              </Pressable>
            </View>
          ) : book ? (
            <View style={styles.body}>
              <View style={styles.center}>
                <Text accessibilityRole="header" style={[styles.title, { color: colors.ink900 }]}>
                  {book.title}
                </Text>
                {book.teacher ? null : book.author ? <Text style={[styles.author, { color: colors.ink600 }]}>{book.author}</Text> : null}
                <View style={styles.chips}>
                  <AccessChip doc={book} long />
                  {book.topic ? (
                    <View style={[styles.topic, { backgroundColor: colors.surfaceAlt }]}>
                      <Text style={[styles.topicText, { color: colors.ink600 }]}>{book.topic}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Dải thông tin (phẳng) */}
              <View style={[styles.stats, { backgroundColor: colors.card, borderColor: colors.line }]}>
                <Stat label="Định dạng" value={book.format ? book.format.toUpperCase() : '—'} sub={fileSize(book.size)} />
                <View style={[styles.statDivider, { backgroundColor: colors.line }]} />
                <Stat label="Độ dài" value={book.length ? `${book.length}` : '—'} sub={book.length ? unit : null} />
                <View style={[styles.statDivider, { backgroundColor: colors.line }]} />
                <Stat label="Đọc thử" value={book.preview.available && book.preview.count ? `${book.preview.count}` : '—'} sub={book.preview.available ? `${unit} đầu` : 'Chưa có'} />
              </View>

              {book.teacher ? (
                <View style={[styles.teacher, { borderColor: colors.line }]}>
                  <InstructorTag name={book.teacher.name} avatar={book.teacher.avatar} size={40} label="Tác giả" />
                </View>
              ) : null}

              {book.description ? (
                <View style={styles.section}>
                  <Text style={[type.cardTitle, { color: colors.ink900 }]}>Giới thiệu</Text>
                  <Text style={[type.body, { color: colors.ink900 }]} numberOfLines={expanded || !longDesc ? undefined : 5}>
                    {book.description}
                  </Text>
                  {longDesc ? (
                    <Pressable accessibilityRole="button" onPress={() => setExpanded((v) => !v)} hitSlop={8}>
                      <Text style={[type.label, { color: colors.emerald700 }]}>{expanded ? 'Thu gọn' : 'Xem thêm'}</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}

              {others.length > 0 ? (
                <View style={styles.section}>
                  <Text style={[type.cardTitle, { color: colors.ink900 }]}>Sách khác</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.othersRow} style={styles.othersScroll}>
                    {others.map((o) => (
                      <Pressable
                        key={o.id}
                        accessibilityRole="link"
                        accessibilityLabel={`${o.title}, ${o.author}`}
                        onPress={() => router.push(`/books/${o.id}`)}
                        style={({ pressed }) => [styles.other, { opacity: pressed ? 0.85 : 1 }]}
                      >
                        <View style={[styles.otherCover, { backgroundColor: chapterPalette[o.cover].base, boxShadow: colors.shadowBook }]}>
                          {o.coverUrl ? <Image source={{ uri: o.coverUrl }} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
                        </View>
                        <Text style={[styles.otherTitle, { color: colors.ink900 }]} numberOfLines={2}>
                          {o.title}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      </Animated.ScrollView>

      {/* ---------- Thanh trên ---------- */}
      <View pointerEvents="box-none" style={[styles.topBar, { paddingTop: topInset, height: barH }]}>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.topBarBg, { backgroundColor: colors.bg, borderBottomColor: colors.line, opacity: barIn }]} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          onPress={back}
          hitSlop={6}
          style={({ pressed }) => [solid ? [styles.plain, { backgroundColor: colors.card, borderColor: colors.line }] : styles.glass, { opacity: pressed ? 0.75 : 1 }]}
        >
          <Icon name="chevronLeft" size={22} color={solid ? colors.ink900 : '#ffffff'} />
        </Pressable>
        <Animated.Text numberOfLines={1} style={[styles.barTitle, { color: colors.ink900, opacity: barIn }]}>
          {book?.title ?? ''}
        </Animated.Text>
        {book ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={saved ? `Bỏ lưu ${book.title}` : `Lưu ${book.title}`}
            accessibilityState={{ selected: saved }}
            onPress={() => toggleSave(book)}
            hitSlop={8}
            style={({ pressed }) => [styles.save, { transform: [{ scale: pressed ? 0.88 : 1 }] }]}
          >
            <Icon
              name="bookmark"
              size={28}
              strokeWidth={1.9}
              color={saved ? colors.fav : solid ? colors.ink900 : '#ffffff'}
              fill={saved ? colors.fav : solid ? 'none' : '#0f172a'}
              fillOpacity={saved ? 1 : 0.3}
            />
          </Pressable>
        ) : null}
      </View>

      {book ? (
        <FloatingAction>
          {book.unlocked ? (
            <PrimaryButton label="Đọc sách" onPress={() => read('full')} />
          ) : (
            <View style={styles.actions}>
              {book.preview.available ? (
                <View style={styles.grow}>
                  <SecondaryButton label="Đọc thử" icon="bookOpen" onPress={() => read('preview')} />
                </View>
              ) : null}
              <View style={styles.grow}>
                <PrimaryButton label={buy && buy.kind === 'buy' && book.access.length === 1 ? `Mua · ${formatPrice(buy.price)}` : 'Mở khoá'} onPress={() => openDoc(book)} />
              </View>
            </View>
          )}
        </FloatingAction>
      ) : null}
    </View>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string | null }) {
  const { colors } = useTheme();
  return (
    <View style={styles.stat}>
      <Text style={[styles.statLabel, { color: colors.ink600 }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.ink900 }]}>{value}</Text>
      {sub ? <Text style={[styles.statSub, { color: colors.ink400 }]}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  grow: { flex: 1 },
  center: { alignItems: 'center', textAlign: 'center' },
  hero: { overflow: 'hidden' },
  coverWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  cover: {
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    overflow: 'hidden',
    boxShadow: '0px 22px 40px rgba(0,0,0,0.38), 0px 6px 12px rgba(0,0,0,0.25)',
  },
  coverText: { flex: 1, justifyContent: 'flex-end', padding: 16 },
  coverTitle: { color: '#ffffff', fontFamily: fonts.display700, fontSize: 20, lineHeight: 26 },
  spine: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 10, backgroundColor: 'rgba(0,0,0,0.18)' },
  gloss: { position: 'absolute', left: 10, top: 0, bottom: 0, width: 6, backgroundColor: 'rgba(255,255,255,0.18)' },
  sheet: { marginTop: -28, borderTopLeftRadius: 28, borderTopRightRadius: 28, minHeight: 300 },
  loading: { paddingVertical: 80, alignItems: 'center' },
  errorBox: { alignItems: 'center', gap: 12, paddingVertical: 60, paddingHorizontal: 32 },
  body: { paddingTop: 24, paddingHorizontal: 20, gap: 22 },
  title: { fontFamily: fonts.display700, fontSize: 26, lineHeight: 34, textAlign: 'center' },
  author: { fontFamily: fonts.sans500, fontSize: 15, lineHeight: 22, marginTop: 4, textAlign: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 12 },
  topic: { paddingHorizontal: 10, height: 24, borderRadius: 9999, justifyContent: 'center' },
  topicText: { fontFamily: fonts.sans600, fontSize: 12, lineHeight: 16 },
  stats: { flexDirection: 'row', alignItems: 'stretch', borderRadius: 18, borderWidth: 1, paddingVertical: 14 },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statLabel: { fontFamily: fonts.sans500, fontSize: 12, lineHeight: 16 },
  statValue: { fontFamily: fonts.display600, fontSize: 20, lineHeight: 26 },
  statSub: { fontFamily: fonts.sans500, fontSize: 12, lineHeight: 16 },
  statDivider: { width: StyleSheet.hairlineWidth },
  teacher: { paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth },
  section: { gap: 10 },
  othersScroll: { marginHorizontal: -20 },
  othersRow: { paddingHorizontal: 20, gap: 14, paddingBottom: 8 },
  other: { width: 104, gap: 8 },
  otherCover: { width: 104, height: 156, borderRadius: 8, overflow: 'hidden' },
  otherTitle: { fontFamily: fonts.sans600, fontSize: 13, lineHeight: 18 },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16 },
  topBarBg: { borderBottomWidth: StyleSheet.hairlineWidth },
  glass: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15,23,42,0.28)' },
  plain: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  blurImg: { transform: [{ scale: 1.3 }] },
  barTitle: { flex: 1, fontFamily: fonts.display600, fontSize: 17, lineHeight: 24 },
  save: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: 10 },
});
