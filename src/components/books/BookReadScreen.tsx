import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { PrimaryButton } from '@/components/auth/AuthUI';
import { useDocuments } from '@/components/documents/DocumentsContext';
import { FloatingAction } from '@/components/FloatingAction';
import { Icon } from '@/components/Icon';
import { apiBook, apiReaderUrl, type BookDetail, type ReaderMode, unitLabel } from '@/data/books';
import { ApiError } from '@/lib/api';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/typography';

import { BookReader } from './BookReader';
import type { ReaderMessage } from './readerTypes';

/**
 * Sách › đọc (/books/[id]/read?mode=preview|full): header (quay lại, tên sách, "Đọc thử · Trang 3 / 8") + trình đọc
 * của server (BookReader: WebView / iframe). Đọc thử tới cuối mà sách còn khoá → nút nổi "Mở khoá để đọc tiếp".
 */
export function BookReadScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { id, mode: rawMode } = useLocalSearchParams<{ id: string; mode?: string }>();
  const mode: ReaderMode = rawMode === 'full' ? 'full' : 'preview';
  const { token } = useAuth();
  const { openDoc } = useDocuments();
  const [book, setBook] = useState<BookDetail | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number; page?: number; pages?: number } | null>(null);
  const [ended, setEnded] = useState(false);

  const topInset = Platform.OS === 'web' ? 12 : insets.top + 4;

  const load = useCallback(() => {
    if (!token || !id) return;
    setError(null);
    setUrl(null);
    apiBook(token, id).then(setBook).catch(() => {});
    apiReaderUrl(token, id, mode)
      .then(setUrl)
      .catch((e) =>
        setError(
          e instanceof ApiError && e.code === 'locked'
            ? 'Bạn chưa mở khoá sách này.'
            : e instanceof ApiError && e.code === 'no_preview'
              ? 'Sách này chưa có bản đọc thử.'
              : 'Không mở được sách. Thử lại sau.',
        ),
      );
  }, [token, id, mode]);
  useEffect(load, [load]);

  const onMessage = useCallback((m: ReaderMessage) => {
    if (m.type === 'ready') setProgress({ current: 1, total: m.total });
    else if (m.type === 'progress') setProgress({ current: m.current, total: m.total, page: m.page, pages: m.pages });
    else if (m.type === 'end') setEnded(true);
    else if (m.type === 'error') setError(m.message);
  }, []);

  const back = () => (router.canGoBack() ? router.back() : router.replace(`/books/${id}`));
  const unit = unitLabel(book?.format ?? null);
  const label = mode === 'preview' ? 'Đọc thử' : 'Đang đọc';
  // EPUB không có trang cố định: hiện chương + trang trong chương (theo khổ màn hình)
  const sub = progress
    ? unit === 'chương'
      ? `${label} · Chương ${progress.current} / ${progress.total}${progress.pages ? ` · trang ${progress.page} / ${progress.pages}` : ''}`
      : `${label} · Trang ${progress.current} / ${progress.total}`
    : label;
  const showUnlock = mode === 'preview' && ended && book && !book.unlocked;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { paddingTop: topInset, borderBottomColor: colors.line, backgroundColor: colors.bg }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          onPress={back}
          hitSlop={6}
          style={({ pressed }) => [styles.back, { backgroundColor: colors.card, borderColor: colors.line, opacity: pressed ? 0.8 : 1 }]}
        >
          <Icon name="chevronLeft" size={22} color={colors.ink900} />
        </Pressable>
        <View style={styles.grow}>
          <Text style={[styles.title, { color: colors.ink900 }]} numberOfLines={1}>
            {book?.title ?? ' '}
          </Text>
          <Text style={[type.caption, { color: colors.ink600 }]} numberOfLines={1} accessibilityLiveRegion="polite">
            {sub}
          </Text>
        </View>
      </View>

      <View style={styles.grow}>
        {error ? (
          <View style={styles.center}>
            <Icon name="book" size={34} strokeWidth={1.7} color={colors.ink400} />
            <Text style={[type.body, styles.centerText, { color: colors.ink600 }]}>{error}</Text>
            <Pressable accessibilityRole="button" onPress={load} hitSlop={8}>
              <Text style={[type.label, { color: colors.emerald700 }]}>Thử lại</Text>
            </Pressable>
          </View>
        ) : url ? (
          <BookReader url={url} onMessage={onMessage} />
        ) : (
          <View style={styles.center}>
            <ActivityIndicator color={colors.emerald700} />
          </View>
        )}
      </View>

      {showUnlock ? (
        <FloatingAction>
          <View style={[styles.endCard, { backgroundColor: colors.card, borderColor: colors.line }]}>
            <Text style={[type.label, { color: colors.ink900 }]}>Hết phần đọc thử</Text>
            <Text style={[type.caption, { color: colors.ink600 }]}>Mở khoá sách để đọc tiếp toàn bộ nội dung.</Text>
          </View>
          <PrimaryButton label="Mở khoá để đọc tiếp" onPress={() => book && openDoc(book)} />
        </FloatingAction>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  back: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.display600, fontSize: 17, lineHeight: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  centerText: { textAlign: 'center' },
  endCard: { padding: 14, borderRadius: 16, borderWidth: 1, gap: 2 },
});
