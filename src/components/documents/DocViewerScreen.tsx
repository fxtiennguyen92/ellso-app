import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { PrimaryButton, SecondaryButton } from '@/components/auth/AuthUI';
import { BookReader } from '@/components/books/BookReader';
import type { ReaderMessage } from '@/components/books/readerTypes';
import { Icon } from '@/components/Icon';
import { VideoBlock } from '@/components/lesson/VideoBlock';
import { apiDocument, apiOpenDocument, apiPlayDocument, type DocDetail, typeLabel } from '@/data/documents';
import { useScreenTopInset } from '@/hooks/useScreenTopInset';
import { ApiError } from '@/lib/api';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/typography';

import { AccessChip, SaveButton } from './DocParts';
import { useDocuments } from './DocumentsContext';
import { ArticleBones } from '@/components/skeletons';

type State = 'loading' | 'ready' | 'locked' | 'missing' | 'error';

/**
 * Trình xem tài liệu (/documents/view/[id], không có thanh tab). Chỉ xem trong app, không tải về.
 * - Video: phát ngay (HLS, POST /documents/{id}/play) + mô tả + mốc thời gian bấm để tua.
 * - PDF: trang đọc của server (pdf.js) trong WebView / iframe, header hiện "Trang x / y".
 * Sách không mở ở đây (đi qua /books/[id]). Tài liệu đang khoá → báo + nút "Cách mở" (bảng Cách mở tài liệu).
 */
export function DocViewerScreen({ id }: { id: string }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const topInset = useScreenTopInset(12, 28);
  const { token } = useAuth();
  const { openDoc } = useDocuments();

  const [doc, setDoc] = useState<DocDetail | null>(null);
  const [state, setState] = useState<State>('loading');
  const [readerUrl, setReaderUrl] = useState<string | null>(null);
  const [page, setPage] = useState<{ current: number; total: number } | null>(null);
  const [readerError, setReaderError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setState('loading');
    setReaderError(null);
    try {
      const d = await apiDocument(token, id);
      setDoc(d);
      if (d.type === 'book') {
        router.replace({ pathname: '/books/[id]', params: { id } });
        return;
      }
      if (!d.unlocked) return setState('locked');
      if (d.type === 'pdf') setReaderUrl((await apiOpenDocument(token, id)).readerUrl);
      setState('ready');
    } catch (e) {
      setState(e instanceof ApiError && e.status === 404 ? 'missing' : e instanceof ApiError && e.status === 403 ? 'locked' : 'error');
    }
  }, [token, id]);

  useEffect(() => {
    load();
  }, [load]);

  const onReader = useCallback((m: ReaderMessage) => {
    if (m.type === 'ready') setPage({ current: 1, total: m.total });
    else if (m.type === 'progress') setPage({ current: m.page ?? m.current, total: m.pages ?? m.total });
    else if (m.type === 'error') setReaderError(m.message);
  }, []);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/documents'));
  const isPdf = doc?.type === 'pdf';

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { paddingTop: topInset, borderBottomColor: isPdf && state === 'ready' ? colors.line : 'transparent' }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          onPress={back}
          style={({ pressed }) => [styles.back, { backgroundColor: colors.card, borderColor: colors.line, opacity: pressed ? 0.7 : 1 }]}
        >
          <Icon name="chevronLeft" color={colors.ink900} />
        </Pressable>
        <View style={styles.grow}>
          <Text style={[type.caption, { color: colors.ink600 }]} numberOfLines={1}>
            {doc ? (isPdf && page ? `${typeLabel.pdf.title} · Trang ${page.current} / ${page.total}` : typeLabel[doc.type].title) : ' '}
          </Text>
          <Text style={[styles.title, { color: colors.ink900 }]} numberOfLines={1}>
            {doc?.title ?? ''}
          </Text>
        </View>
        {doc && state === 'ready' ? <SaveButton doc={doc} variant="row" /> : null}
      </View>

      {state === 'loading' ? (
        <ArticleBones />
      ) : state === 'locked' && doc ? (
        <Message
          icon="lock"
          title="Tài liệu chưa mở"
          text="Xem các cách mở tài liệu này: miễn phí, gói thành viên, mua riêng hoặc học khoá đi kèm."
          action={<PrimaryButton label="Cách mở tài liệu" icon="key" onPress={() => openDoc(doc)} />}
          extra={<AccessChip doc={doc} long />}
        />
      ) : state === 'missing' ? (
        <Message icon="alert" title="Không tìm thấy tài liệu" text="Tài liệu có thể đã bị gỡ." action={<SecondaryButton label="Quay lại" onPress={back} />} />
      ) : state === 'error' || readerError ? (
        <Message
          icon="alert"
          title="Không mở được tài liệu"
          text={readerError ?? 'Kiểm tra kết nối mạng rồi thử lại.'}
          action={<PrimaryButton label="Thử lại" icon="retry" onPress={load} />}
        />
      ) : doc && isPdf && readerUrl ? (
        <View style={[styles.grow, { paddingBottom: insets.bottom }]}>
          <BookReader url={readerUrl} onMessage={onReader} />
        </View>
      ) : doc ? (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
          <VideoBlock
            autoStart
            data={{ duration_seconds: null, chapters: doc.chapters }}
            load={() => apiPlayDocument(token ?? '', id).then((r) => r.url)}
          />
          <View style={styles.info}>
            <Text style={[type.h2, { color: colors.ink900 }]}>{doc.title}</Text>
            {doc.author ? (
              <Text style={[type.caption, { color: colors.ink600 }]}>
                {doc.author}
                {doc.duration ? ` · ${doc.duration}` : ''}
              </Text>
            ) : null}
            {doc.description ? <Text style={[type.body, { color: colors.ink900 }]}>{doc.description}</Text> : null}
          </View>
        </ScrollView>
      ) : null}
    </View>
  );
}

function Message({ icon, title, text, action, extra }: { icon: 'lock' | 'alert'; title: string; text: string; action: React.ReactNode; extra?: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.message}>
      <View style={[styles.messageIcon, { backgroundColor: colors.mint50 }]}>
        <Icon name={icon} size={30} color={colors.emerald700} />
      </View>
      <Text style={[type.h2, styles.centerText, { color: colors.ink900 }]}>{title}</Text>
      <Text style={[type.body, styles.centerText, { color: colors.ink600 }]}>{text}</Text>
      {extra}
      <View style={styles.messageAction}>{action}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1 },
  back: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.display600, fontSize: 16, lineHeight: 22 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, gap: 20 },
  info: { gap: 8 },
  message: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32, paddingBottom: 60 },
  messageIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  messageAction: { alignSelf: 'stretch', marginTop: 12 },
  centerText: { textAlign: 'center' },
});
