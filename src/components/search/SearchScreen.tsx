import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { SecondaryButton } from '@/components/auth/AuthUI';
import { CourseCover } from '@/components/courses/CourseCover';
import { useDocuments } from '@/components/documents/DocumentsContext';
import { MyDocRow } from '@/components/documents/MyDocumentsScreen';
import { Icon } from '@/components/Icon';
import { RowBones } from '@/components/skeletons';
import { apiCatalog, type CatalogCourse, formatPrice } from '@/data/courses';
import { apiSearchDocuments, type Doc } from '@/data/documents';
import { useScreenTopInset } from '@/hooks/useScreenTopInset';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/typography';

/** Phạm vi tìm: Trang chủ → cả khoá học và tài liệu; tab Khoá học → khoá học; tab Tài liệu → tài liệu. */
export type SearchScope = 'all' | 'courses' | 'documents';

/** Số kết quả mỗi đợt của từng phần; "Xem thêm kết quả" tải đợt tiếp theo (nếu còn). */
const PER_PAGE = 7;
const MIN_CHARS = 2;

type Section<T> = { items: T[]; page: number; hasMore: boolean; total: number; loading: boolean; error: boolean };
const blank = <T,>(): Section<T> => ({ items: [], page: 0, hasMore: false, total: 0, loading: false, error: false });

const PLACEHOLDER: Record<SearchScope, string> = {
  all: 'Tìm khoá học, tài liệu, sách...',
  courses: 'Tìm khoá học, chủ đề, người hướng dẫn...',
  documents: 'Tìm video, PDF, sách, tác giả...',
};

/**
 * Màn Tìm kiếm (/search?scope=all|courses|documents). Gõ xong ~0,35 giây thì tìm (từ 2 ký tự).
 * Mỗi phần (Khoá học / Tài liệu) hiện tối đa 7 kết quả, nút "Xem thêm kết quả" tải tiếp 7 kết quả nữa cho đến hết.
 * Khoá học → trang giới thiệu khoá; sách → trang sách; video / PDF → mở (hoặc bảng Cách mở nếu đang khoá).
 */
export function SearchScreen({ scope }: { scope: SearchScope }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const topInset = useScreenTopInset(12, 28);
  const { token } = useAuth();

  const [query, setQuery] = useState('');
  const [term, setTerm] = useState('');
  const [courses, setCourses] = useState<Section<CatalogCourse>>(blank);
  const [docs, setDocs] = useState<Section<Doc>>(blank);
  // Mỗi lần đổi từ khoá tăng số này → bỏ kết quả về muộn của từ khoá cũ
  const gen = useRef(0);

  const withCourses = scope !== 'documents';
  const withDocs = scope !== 'courses';

  // Gõ xong mới tìm
  useEffect(() => {
    const t = setTimeout(() => setTerm(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  const loadCourses = useCallback(
    async (q: string, page: number, g: number) => {
      if (!token) return;
      setCourses((s) => ({ ...s, loading: true, error: false }));
      try {
        const r = await apiCatalog(token, page, null, { search: q, perPage: PER_PAGE });
        if (g !== gen.current) return;
        setCourses((s) => ({ items: page === 1 ? r.items : [...s.items, ...r.items], page, hasMore: r.hasMore, total: r.total, loading: false, error: false }));
      } catch {
        if (g === gen.current) setCourses((s) => ({ ...s, loading: false, error: true }));
      }
    },
    [token],
  );

  const loadDocs = useCallback(
    async (q: string, page: number, g: number) => {
      if (!token) return;
      setDocs((s) => ({ ...s, loading: true, error: false }));
      try {
        const r = await apiSearchDocuments(token, q, page, PER_PAGE);
        if (g !== gen.current) return;
        setDocs((s) => ({ items: page === 1 ? r.items : [...s.items, ...r.items], page, hasMore: r.hasMore, total: r.total, loading: false, error: false }));
      } catch {
        if (g === gen.current) setDocs((s) => ({ ...s, loading: false, error: true }));
      }
    },
    [token],
  );

  useEffect(() => {
    const g = ++gen.current;
    setCourses(blank);
    setDocs(blank);
    if (term.length < MIN_CHARS) return;
    if (withCourses) loadCourses(term, 1, g);
    if (withDocs) loadDocs(term, 1, g);
  }, [term, withCourses, withDocs, loadCourses, loadDocs]);

  const searching = term.length >= MIN_CHARS;
  const pending = query.trim() !== term; // đang gõ, chưa tìm
  const busy = pending || courses.loading || docs.loading;
  const nothing = searching && !busy && courses.items.length === 0 && docs.items.length === 0 && !courses.error && !docs.error;

  const openDoc = useDocOpen();

  return (
    <KeyboardAvoidingView behavior="padding" style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { paddingTop: topInset }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          style={({ pressed }) => [styles.back, { backgroundColor: colors.card, borderColor: colors.line, opacity: pressed ? 0.7 : 1 }]}
        >
          <Icon name="chevronLeft" color={colors.ink900} />
        </Pressable>
        <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.line }]}>
          <Icon name="search" size={20} color={colors.ink600} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            autoFocus
            placeholder={PLACEHOLDER[scope]}
            placeholderTextColor={colors.ink400}
            returnKeyType="search"
            onSubmitEditing={() => setTerm(query.trim())}
            accessibilityLabel="Tìm kiếm"
            style={[type.input, styles.input, { color: colors.ink900 }]}
          />
          {query.length > 0 && (
            <Pressable accessibilityRole="button" accessibilityLabel="Xoá tìm kiếm" onPress={() => setQuery('')} hitSlop={8} style={[styles.clear, { backgroundColor: colors.surfaceAlt }]}>
              <Icon name="close" size={14} color={colors.ink600} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        {!searching && !pending ? (
          <View style={styles.hint}>
            <View style={[styles.hintIcon, { backgroundColor: colors.mint50 }]}>
              <Icon name="search" size={28} color={colors.emerald700} />
            </View>
            <Text style={[type.body, styles.center, { color: colors.ink600 }]}>
              {scope === 'courses'
                ? 'Nhập tên khoá học, chủ đề hoặc người hướng dẫn.'
                : scope === 'documents'
                  ? 'Nhập tên video, PDF, sách hoặc tác giả.'
                  : 'Nhập tên khoá học, tài liệu, sách hoặc người hướng dẫn.'}
            </Text>
          </View>
        ) : nothing ? (
          <View style={styles.hint}>
            <Text style={[type.body, styles.center, { color: colors.ink600 }]}>Không tìm thấy kết quả cho “{term}”.</Text>
          </View>
        ) : (
          <>
            {withCourses && (
              <ResultSection
                title="Khoá học"
                section={courses}
                pending={pending}
                onMore={() => loadCourses(term, courses.page + 1, gen.current)}
                hideWhenEmpty={scope === 'all'}
              >
                {courses.items.map((c) => (
                  <CourseRow key={c.id} course={c} />
                ))}
              </ResultSection>
            )}
            {withDocs && (
              <ResultSection
                title="Tài liệu"
                section={docs}
                pending={pending}
                onMore={() => loadDocs(term, docs.page + 1, gen.current)}
                hideWhenEmpty={scope === 'all'}
              >
                {docs.items.map((d) => (
                  <MyDocRow key={d.id} doc={d} withSave onOpen={openDoc} />
                ))}
              </ResultSection>
            )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Sách → trang sách (đọc thử / mua / đọc ở đó); video / PDF → mở hoặc bảng Cách mở. */
function useDocOpen() {
  const { openDoc } = useDocuments();
  return (d: Doc) => (d.type === 'book' ? router.push({ pathname: '/books/[id]', params: { id: d.id } }) : openDoc(d));
}

function ResultSection<T>({
  title,
  section,
  pending,
  onMore,
  hideWhenEmpty,
  children,
}: {
  title: string;
  section: Section<T>;
  pending: boolean;
  onMore: () => void;
  hideWhenEmpty: boolean;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  const first = (pending || section.loading) && section.items.length === 0;
  if (!first && !section.loading && !section.error && section.items.length === 0 && hideWhenEmpty) return null;
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={[type.h2, { color: colors.ink900 }]}>
        {title}
        {section.total > 0 && !first ? <Text style={[styles.count, { color: colors.ink600 }]}> {section.total}</Text> : null}
      </Text>
      {first ? (
        <RowBones count={3} thumb={64} />
      ) : section.items.length === 0 && !section.error ? (
        <Text style={[type.caption, { color: colors.ink600 }]}>Không có {title.toLowerCase()} phù hợp.</Text>
      ) : (
        <View style={styles.list}>{children}</View>
      )}
      {section.loading && section.items.length > 0 && <RowBones count={1} thumb={64} />}
      {section.error && (
        <Pressable accessibilityRole="button" onPress={onMore} hitSlop={8}>
          <Text style={[type.label, { color: colors.emerald700 }]}>Không tải được. Bấm để thử lại</Text>
        </Pressable>
      )}
      {section.hasMore && !section.loading && !section.error && <SecondaryButton label="Xem thêm kết quả" onPress={onMore} />}
    </View>
  );
}

/** Dòng khoá học trong kết quả: ảnh bìa nhỏ · danh mục · tên · giá / trạng thái. Bấm → trang giới thiệu khoá. */
function CourseRow({ course: c }: { course: CatalogCourse }) {
  const { colors } = useTheme();
  const status = c.enrolled
    ? {
        text: c.progressPercent === 100 ? 'Đã hoàn thành' : c.progressPercent != null && c.started ? `Đang học · ${c.progressPercent}%` : 'Đã sở hữu',
        fg: colors.emerald700,
        bg: colors.mint50,
      }
    : c.price === 0
      ? { text: 'Miễn phí', fg: colors.emerald700, bg: colors.mint50 }
      : { text: formatPrice(c.price), fg: colors.ink900, bg: colors.chipNeutral };
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${c.title}${c.instructor ? `, ${c.instructor.name}` : ''}, ${status.text}`}
      onPress={() => router.push({ pathname: '/catalog/[id]', params: { id: String(c.id) } })}
      style={({ pressed }) => [styles.row, { backgroundColor: colors.card, borderColor: colors.line, opacity: pressed ? 0.85 : 1 }]}
    >
      <View style={styles.thumb}>
        <CourseCover id={c.id} coverUrl={c.coverUrl} iconSize={24} />
      </View>
      <View style={styles.rowText}>
        <Text style={[type.chip, styles.meta, { color: colors.ink600 }]} numberOfLines={1}>
          {[c.category?.name, c.instructor?.name].filter(Boolean).join(' · ')}
        </Text>
        <Text style={[styles.rowTitle, { color: colors.ink900 }]} numberOfLines={2}>
          {c.title}
        </Text>
        <View style={[styles.chip, { backgroundColor: status.bg }]}>
          <Text style={[styles.chipText, { color: status.fg }]}>{status.text}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 16 },
  back: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  inputBox: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10, height: 48, paddingLeft: 14, paddingRight: 10, borderRadius: 14, borderWidth: 1 },
  input: { flex: 1, minWidth: 0, height: '100%', paddingVertical: 0, ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null) },
  clear: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 16 },
  hint: { alignItems: 'center', gap: 14, paddingTop: 64, paddingHorizontal: 24 },
  hintIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
  section: { paddingTop: 20, gap: 12 },
  count: { fontFamily: fonts.sans500, fontSize: 14 },
  list: { gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 18, borderWidth: 1 },
  thumb: { width: 104, aspectRatio: 16 / 10, borderRadius: 12, overflow: 'hidden' },
  rowText: { flex: 1, minWidth: 0, gap: 3 },
  meta: { letterSpacing: 0.3 },
  rowTitle: { fontFamily: fonts.sans600, fontSize: 15, lineHeight: 21 },
  chip: { alignSelf: 'flex-start', marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 9999 },
  chipText: { fontFamily: fonts.sans700, fontSize: 11, lineHeight: 16 },
});
