import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useAuth } from '@/auth/AuthProvider';
import { PrimaryButton, SecondaryButton } from '@/components/auth/AuthUI';
import { accessStyle, primaryAccess } from '@/components/documents/docAccess';
import { BookCover } from '@/components/documents/DocParts';
import { useDocuments } from '@/components/documents/DocumentsContext';
import { Icon } from '@/components/Icon';
import { apiBook, apiBooks, type BookDetail, fileSize } from '@/data/books';
import { formatPrice } from '@/data/courses';
import type { Doc } from '@/data/documents';
import { NATIVE_DRIVER } from '@/hooks/useLoop';
import { ApiError } from '@/lib/api';
import { useTheme } from '@/theme/ThemeProvider';
import { chapterPalette, WEB_MAX_WIDTH } from '@/theme/tokens';
import { fonts, type } from '@/theme/typography';

/**
 * Sách › thông tin (/books/[id]) — bố cục theo trang sách của Amazon (bản di động), phần đầu làm riêng:
 * 1+2. Hero tràn viền theo MÀU ĐÃ CHỌN của sách (gradient, lưới chấm, vòng tròn + quầng sáng sau bìa): bìa lớn bên phải
 *      (bấm = đọc), cụm [Tác giả · Tên sách · Sách điện tử] nổi ở góc dưới bên trái. Nút quay lại kính mờ; cuộn qua hero
 *      thì thanh trên hiện nền + tên sách.
 * 3. Khối mua: giá to bên phải (màu đã chọn), nút chính (Mua ngay + giỏ hàng / Mở khoá / Đọc sách), Đọc thử miễn phí,
 *    "Lưu vào Tài liệu của tôi".
 * 4. Giới thiệu sách (thu gọn / xem thêm) · Thông tin sách (bảng) · Có thể bạn cũng thích (cuộn ngang).
 * Không hiện số chương / số trang đọc thử. Màn nhiều khối nên các nút nằm trong khối mua (không nổi ở đáy).
 */
export function BookScreen() {
  const { colors, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: winW } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const { isSaved, toggleSave, openDoc } = useDocuments();
  const [book, setBook] = useState<BookDetail | null>(null);
  const [others, setOthers] = useState<Doc[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const width = Platform.OS === 'web' ? Math.min(winW, WEB_MAX_WIDTH) : winW;
  const topInset = Platform.OS === 'web' ? 12 : insets.top + 4;
  const coverW = Math.min(160, Math.round(width * 0.4));
  const coverH = Math.round(coverW * 1.5);
  const barH = topInset + 52;
  const heroH = barH + coverH + 32;

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

  const titleIn = scrollY.interpolate({ inputRange: [heroH - barH - 50, heroH - barH - 10], outputRange: [0, 1], extrapolate: 'clamp' });
  const coverShift = scrollY.interpolate({ inputRange: [-160, 0, heroH], outputRange: [30, 0, -heroH * 0.2], extrapolate: 'clamp' });

  const pal = chapterPalette[book?.cover ?? 'teal'];
  const accent = scheme === 'dark' ? pal.inkDark : pal.base;
  const access = book ? primaryAccess(book) : null;
  const buy = book?.access.find((a) => a.kind === 'buy');
  const onlyBuy = !!buy && buy.kind === 'buy' && book?.access.length === 1;
  const saved = book ? isSaved(book) : false;
  const longDesc = (book?.description?.length ?? 0) > 240;
  const canPreview = !!book && !book.unlocked && book.preview.available;
  const formatName = book?.format ? book.format.toUpperCase() : null;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <Animated.ScrollView
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: NATIVE_DRIVER })}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        {!book && !error ? (
          <View style={[styles.loading, { paddingTop: barH + 80 }]}>
            <ActivityIndicator color={colors.emerald700} />
          </View>
        ) : error ? (
          <View style={[styles.errorBox, { paddingTop: barH + 60 }]}>
            <Icon name="book" size={34} strokeWidth={1.7} color={colors.ink400} />
            <Text style={[type.body, styles.centerText, { color: colors.ink600 }]}>{error}</Text>
            <Pressable accessibilityRole="button" onPress={load} hitSlop={8}>
              <Text style={[type.label, { color: colors.emerald700 }]}>Thử lại</Text>
            </Pressable>
          </View>
        ) : book ? (
          <View>
            {/* 1+2. Hero theo màu đã chọn: bìa bên phải, cụm thông tin góc dưới trái */}
            <View style={[styles.hero, { height: heroH, backgroundColor: pal.edge }]}>
              <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
                <Defs>
                  <LinearGradient id={`bookHero-${book.cover}`} x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor={pal.base} />
                    <Stop offset="1" stopColor={pal.edge} />
                  </LinearGradient>
                  <RadialGradient id={`bookGlow-${book.cover}`} cx="50%" cy="50%" r="50%">
                    <Stop offset="0" stopColor="#ffffff" stopOpacity={0.28} />
                    <Stop offset="1" stopColor="#ffffff" stopOpacity={0} />
                  </RadialGradient>
                  <Pattern id="bookDots" width={16} height={16} patternUnits="userSpaceOnUse">
                    <Circle cx={2} cy={2} r={1} fill="#ffffff" fillOpacity={0.12} />
                  </Pattern>
                </Defs>
                <Rect width="100%" height="100%" fill={`url(#bookHero-${book.cover})`} />
                <Rect width="100%" height="100%" fill="url(#bookDots)" />
                {[60, 105, 150, 195, 240].map((r) => (
                  <Circle key={r} cx={width - 20 - coverW / 2} cy={barH + coverH / 2} r={r} stroke="#ffffff" strokeOpacity={0.12} strokeWidth={1.2} fill="none" />
                ))}
                <Circle cx={width - 20 - coverW / 2} cy={barH + coverH / 2} r={coverW * 1.05} fill={`url(#bookGlow-${book.cover})`} />
              </Svg>

              <Animated.View style={[styles.heroCover, { top: barH, width: coverW, transform: [{ translateY: coverShift }] }]}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={book.unlocked ? 'Đọc sách' : canPreview ? 'Đọc thử' : `Bìa sách ${book.title}`}
                  disabled={!book.unlocked && !canPreview}
                  onPress={() => read(book.unlocked ? 'full' : 'preview')}
                  style={({ pressed }) => [styles.coverShadow, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}
                >
                  <BookCover doc={{ ...book, unlocked: true }} />
                </Pressable>
              </Animated.View>

              <View style={[styles.heroInfo, { right: coverW + 36 }]}>
                {book.author ? (
                  <Text style={styles.heroAuthor} numberOfLines={1}>
                    {book.author}
                  </Text>
                ) : null}
                <Text accessibilityRole="header" style={styles.heroTitle} numberOfLines={4}>
                  {book.title}
                </Text>
                <View style={styles.heroTag}>
                  <Icon name="book" size={12} strokeWidth={2.2} color="#ffffff" />
                  <Text style={styles.heroTagText}>Sách điện tử{formatName ? ` · ${formatName}` : ''}</Text>
                </View>
              </View>
            </View>

            {/* 3. Khối mua */}
            <View style={styles.buyBox}>
              {access ? (
                <View style={styles.priceRow}>
                  {book.unlocked ? (
                    <View style={[styles.owned, { backgroundColor: colors.mint50 }]}>
                      <Icon name="check" size={13} strokeWidth={3} color={colors.emerald700} />
                      <Text style={[styles.ownedText, { color: colors.emerald700 }]}>Bạn đã có thể đọc</Text>
                    </View>
                  ) : (
                    <Text style={[type.caption, { color: colors.ink600 }]}>{access.kind === 'buy' ? 'Giá sách điện tử' : 'Quyền đọc'}</Text>
                  )}
                  <Text style={[styles.price, { color: book.unlocked && access.kind !== 'buy' ? colors.emerald700 : accent }]}>
                    {access.kind === 'buy' && !book.bought ? formatPrice(access.price) : accessStyle(access, !!book.bought, colors).long}
                  </Text>
                </View>
              ) : null}
              {!book.unlocked && book.access.length > 1 ? (
                <Text style={[type.caption, { color: colors.ink600 }]}>Hoặc mở bằng {book.access.length - 1} cách khác (gói thành viên, khoá học…)</Text>
              ) : null}

              <View style={styles.buttons}>
                {book.unlocked ? (
                  <PrimaryButton label="Đọc sách" onPress={() => read('full')} />
                ) : (
                  <PrimaryButton label={onlyBuy ? 'Mua ngay' : 'Mở khoá sách'} icon={onlyBuy ? 'cart' : 'lock'} onPress={() => openDoc(book)} />
                )}
                {canPreview ? <SecondaryButton label="Đọc thử miễn phí" icon="bookOpen" onPress={() => read('preview')} /> : null}
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: saved }}
                onPress={() => toggleSave(book)}
                hitSlop={6}
                style={({ pressed }) => [styles.saveRow, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Icon name={saved ? 'bookmarkFilled' : 'bookmark'} size={20} color={saved ? colors.fav : colors.ink600} />
                <Text style={[type.label, { color: colors.ink900 }]}>{saved ? 'Đã lưu vào Tài liệu của tôi' : 'Lưu vào Tài liệu của tôi'}</Text>
              </Pressable>
            </View>

            <View style={[styles.rule, { backgroundColor: colors.surfaceAlt }]} />

            {/* 4. Giới thiệu sách */}
            {book.description ? (
              <View style={styles.section}>
                <Text accessibilityRole="header" style={[type.h2, { color: colors.ink900 }]}>
                  Giới thiệu sách
                </Text>
                <Text style={[type.body, { color: colors.ink900 }]} numberOfLines={expanded || !longDesc ? undefined : 6}>
                  {book.description}
                </Text>
                {longDesc ? (
                  <Pressable accessibilityRole="button" onPress={() => setExpanded((v) => !v)} hitSlop={8} style={styles.more}>
                    <Text style={[type.label, { color: colors.emerald700 }]}>{expanded ? 'Thu gọn' : 'Xem thêm'}</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            {/* 5. Thông tin sách */}
            <View style={styles.section}>
              <Text accessibilityRole="header" style={[type.h2, { color: colors.ink900 }]}>
                Thông tin sách
              </Text>
              <View style={[styles.table, { borderColor: colors.line }]}>
                <Row label="Tác giả" value={book.author || '—'} first />
                <Row label="Định dạng" value={formatName ? `Sách điện tử (${formatName})` : 'Sách điện tử'} />
                {book.size ? <Row label="Dung lượng" value={fileSize(book.size) ?? '—'} /> : null}
                {book.format === 'pdf' && book.length ? <Row label="Số trang" value={`${book.length} trang`} /> : null}
              </View>
            </View>

            {/* 6. Có thể bạn cũng thích */}
            {others.length > 0 ? (
              <View style={styles.section}>
                <Text accessibilityRole="header" style={[type.h2, { color: colors.ink900 }]}>
                  Có thể bạn cũng thích
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.othersScroll} contentContainerStyle={styles.othersRow}>
                  {others.map((o) => (
                    <Pressable
                      key={o.id}
                      accessibilityRole="link"
                      accessibilityLabel={`${o.title}, ${o.author}`}
                      onPress={() => router.push(`/books/${o.id}`)}
                      style={({ pressed }) => [styles.other, { opacity: pressed ? 0.85 : 1 }]}
                    >
                      <BookCover doc={o} />
                      <Text style={[styles.otherTitle, { color: colors.ink900 }]} numberOfLines={2}>
                        {o.title}
                      </Text>
                      <Text style={[type.caption, { color: colors.ink600 }]} numberOfLines={1}>
                        {o.author}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </View>
        ) : null}
      </Animated.ScrollView>

      {/* Thanh trên (phủ lên hero): quay lại kính mờ; cuộn qua hero thì hiện nền + tên sách */}
      <View pointerEvents="box-none" style={[styles.topBar, { paddingTop: topInset, height: barH }]}>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.topBarBg, { backgroundColor: colors.bg, borderBottomColor: colors.line, opacity: titleIn }]} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          onPress={back}
          hitSlop={6}
          style={({ pressed }) => [styles.back, { opacity: pressed ? 0.75 : 1 }]}
        >
          <Animated.View style={[StyleSheet.absoluteFill, styles.backSolid, { backgroundColor: colors.card, borderColor: colors.line, opacity: titleIn }]} />
          <Icon name="chevronLeft" size={22} color={book ? '#ffffff' : colors.ink900} />
          <Animated.View style={[StyleSheet.absoluteFill, styles.backIcon, { opacity: titleIn }]}>
            <Icon name="chevronLeft" size={22} color={colors.ink900} />
          </Animated.View>
        </Pressable>
        <Animated.Text numberOfLines={1} style={[styles.barTitle, { color: colors.ink900, opacity: titleIn }]}>
          {book?.title ?? ''}
        </Animated.Text>
      </View>
    </View>
  );
}

function Row({ label, value, first }: { label: string; value: string; first?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line }]}>
      <Text style={[styles.rowLabel, { color: colors.ink600 }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.ink900 }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centerText: { textAlign: 'center' },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16 },
  topBarBg: { borderBottomWidth: StyleSheet.hairlineWidth },
  back: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15,23,42,0.28)', overflow: 'hidden' },
  backSolid: { borderRadius: 12, borderWidth: 1 },
  backIcon: { alignItems: 'center', justifyContent: 'center' },
  hero: { overflow: 'hidden' },
  heroCover: { position: 'absolute', right: 20 },
  coverShadow: { borderRadius: 6, boxShadow: '0px 18px 34px rgba(0,0,0,0.38), 0px 4px 10px rgba(0,0,0,0.22)' },
  heroInfo: { position: 'absolute', left: 20, bottom: 26, gap: 6 },
  heroAuthor: { color: 'rgba(255,255,255,0.82)', fontFamily: fonts.sans600, fontSize: 14, lineHeight: 20 },
  heroTitle: { color: '#ffffff', fontFamily: fonts.display700, fontSize: 24, lineHeight: 31 },
  heroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 4,
    paddingHorizontal: 10,
    height: 26,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  heroTagText: { color: '#ffffff', fontFamily: fonts.sans600, fontSize: 12, lineHeight: 16 },
  barTitle: { flex: 1, fontFamily: fonts.display600, fontSize: 17, lineHeight: 24 },
  loading: { paddingVertical: 100, alignItems: 'center' },
  errorBox: { alignItems: 'center', gap: 12, paddingVertical: 80, paddingHorizontal: 32 },
  buyBox: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8, gap: 10 },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  price: { fontFamily: fonts.display700, fontSize: 28, lineHeight: 36 },
  owned: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, height: 26, borderRadius: 9999 },
  ownedText: { fontFamily: fonts.sans600, fontSize: 12, lineHeight: 16 },
  buttons: { gap: 10, marginTop: 6 },
  saveRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10 },
  rule: { height: 8, marginTop: 8 },
  section: { paddingHorizontal: 20, paddingTop: 22, gap: 10 },
  more: { alignSelf: 'flex-start' },
  table: { borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  rowLabel: { width: 96, fontFamily: fonts.sans500, fontSize: 14, lineHeight: 20 },
  rowValue: { flex: 1, fontFamily: fonts.sans600, fontSize: 14, lineHeight: 20 },
  othersScroll: { marginHorizontal: -20 },
  othersRow: { paddingHorizontal: 20, gap: 14, paddingBottom: 4 },
  other: { width: 108, gap: 6 },
  otherTitle: { fontFamily: fonts.sans600, fontSize: 13, lineHeight: 18 },
});
