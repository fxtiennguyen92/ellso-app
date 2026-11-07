import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
 * Sách › thông tin (/books/[id]) — bố cục theo trang sách của Amazon (bản di động):
 * 1. Tác giả · tên sách · định dạng.
 * 2. Khung ảnh nền nhạt, bìa lớn ở giữa (bấm = đọc), nút "Đọc thử" ngay dưới bìa.
 * 3. Khối mua: giá to (màu theo màu bìa), nút chính (Mua ngay / Mở khoá / Đọc sách), nút Đọc thử, "Lưu vào Tài liệu của tôi".
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
  const coverW = Math.min(190, Math.round(width * 0.46));

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

  const titleIn = scrollY.interpolate({ inputRange: [60, 110], outputRange: [0, 1], extrapolate: 'clamp' });

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
      {/* Thanh trên: quay lại + tên sách hiện khi cuộn */}
      <View style={[styles.topBar, { paddingTop: topInset, backgroundColor: colors.bg }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          onPress={back}
          hitSlop={6}
          style={({ pressed }) => [styles.back, { backgroundColor: colors.card, borderColor: colors.line, opacity: pressed ? 0.8 : 1 }]}
        >
          <Icon name="chevronLeft" size={22} color={colors.ink900} />
        </Pressable>
        <Animated.Text numberOfLines={1} style={[styles.barTitle, { color: colors.ink900, opacity: titleIn }]}>
          {book?.title ?? ''}
        </Animated.Text>
      </View>

      <Animated.ScrollView
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: NATIVE_DRIVER })}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        {!book && !error ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.emerald700} />
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Icon name="book" size={34} strokeWidth={1.7} color={colors.ink400} />
            <Text style={[type.body, styles.centerText, { color: colors.ink600 }]}>{error}</Text>
            <Pressable accessibilityRole="button" onPress={load} hitSlop={8}>
              <Text style={[type.label, { color: colors.emerald700 }]}>Thử lại</Text>
            </Pressable>
          </View>
        ) : book ? (
          <View>
            {/* 1. Tác giả · tên · định dạng */}
            <View style={styles.head}>
              {book.author ? (
                <Text style={[styles.byline, { color: colors.ink600 }]}>
                  Tác giả: <Text style={{ fontFamily: fonts.sans600, color: colors.emerald700 }}>{book.author}</Text>
                </Text>
              ) : null}
              <Text accessibilityRole="header" style={[styles.title, { color: colors.ink900 }]}>
                {book.title}
              </Text>
              <Text style={[type.caption, { color: colors.ink600 }]}>Sách điện tử{formatName ? ` · ${formatName}` : ''}</Text>
            </View>

            {/* 2. Khung ảnh */}
            <View style={[styles.gallery, { backgroundColor: colors.surfaceAlt }]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={book.unlocked ? 'Đọc sách' : canPreview ? 'Đọc thử' : `Bìa sách ${book.title}`}
                disabled={!book.unlocked && !canPreview}
                onPress={() => read(book.unlocked ? 'full' : 'preview')}
                style={({ pressed }) => [{ width: coverW, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
              >
                <BookCover doc={{ ...book, unlocked: true }} />
              </Pressable>
              {canPreview || book.unlocked ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => read(book.unlocked ? 'full' : 'preview')}
                  hitSlop={6}
                  style={({ pressed }) => [styles.lookInside, { backgroundColor: colors.card, borderColor: colors.line, opacity: pressed ? 0.8 : 1 }]}
                >
                  <Icon name="bookOpen" size={16} color={colors.emerald700} />
                  <Text style={[type.label, { color: colors.emerald700 }]}>{book.unlocked ? 'Đọc sách' : 'Đọc thử'}</Text>
                </Pressable>
              ) : null}
            </View>

            {/* 3. Khối mua */}
            <View style={styles.buyBox}>
              {access ? (
                <View style={styles.priceRow}>
                  <Text style={[styles.price, { color: book.unlocked && access.kind !== 'buy' ? colors.emerald700 : accent }]}>
                    {access.kind === 'buy' && !book.bought ? formatPrice(access.price) : accessStyle(access, !!book.bought, colors).long}
                  </Text>
                  {book.unlocked ? (
                    <View style={[styles.owned, { backgroundColor: colors.mint50 }]}>
                      <Icon name="check" size={13} strokeWidth={3} color={colors.emerald700} />
                      <Text style={[styles.ownedText, { color: colors.emerald700 }]}>Bạn đã có thể đọc</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
              {!book.unlocked && book.access.length > 1 ? (
                <Text style={[type.caption, { color: colors.ink600 }]}>Hoặc mở bằng {book.access.length - 1} cách khác (gói thành viên, khoá học…)</Text>
              ) : null}

              <View style={styles.buttons}>
                {book.unlocked ? (
                  <PrimaryButton label="Đọc sách" onPress={() => read('full')} />
                ) : (
                  <PrimaryButton label={onlyBuy && buy?.kind === 'buy' ? `Mua ngay · ${formatPrice(buy.price)}` : 'Mở khoá sách'} onPress={() => openDoc(book)} />
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
                <Row label="Đọc trên" value="Ứng dụng Ellso" />
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
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 8, zIndex: 2 },
  back: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  barTitle: { flex: 1, fontFamily: fonts.display600, fontSize: 17, lineHeight: 24 },
  loading: { paddingVertical: 100, alignItems: 'center' },
  errorBox: { alignItems: 'center', gap: 12, paddingVertical: 80, paddingHorizontal: 32 },
  head: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 14, gap: 4 },
  byline: { fontFamily: fonts.sans500, fontSize: 14, lineHeight: 20 },
  title: { fontFamily: fonts.display700, fontSize: 24, lineHeight: 32 },
  gallery: { alignItems: 'center', paddingVertical: 28, gap: 18 },
  lookInside: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, height: 38, borderRadius: 9999, borderWidth: 1 },
  buyBox: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8, gap: 10 },
  priceRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
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
