import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BOTTOM_BAR_SPACE } from '@/components/BottomBar';
import { Icon } from '@/components/Icon';
import { getEnrolledCourses } from '@/data/courses';
import { formatDate } from '@/data/profile';
import { type Doc, type DocType, matchQuery, typeLabel } from '@/data/documents';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/typography';

import { AccessChip, BookCover, EmptyState, PdfThumb, SaveButton, VideoCover } from './DocParts';
import { useDocuments } from './DocumentsContext';
import { SubHeader } from './SubHeader';

const TABS: { type: DocType; label: string }[] = [
  { type: 'video', label: 'Video' },
  { type: 'pdf', label: 'PDF' },
  { type: 'book', label: 'Sách' },
];

/** Tài liệu của tôi: tab Video / PDF / Sách · Đã lưu · Đã mua · Từ khoá học của bạn. */
export function MyDocumentsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { docs } = useDocuments();

  const [tab, setTab] = useState<DocType>('video');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  const mine = (t: DocType) => docs.filter((d) => d.type === t && (d.saved || d.bought));
  const ofTab = useMemo(() => docs.filter((d) => d.type === tab && matchQuery(d, query)), [docs, tab, query]);
  const saved = ofTab.filter((d) => d.saved);
  const bought = ofTab.filter((d) => d.bought && !d.saved);

  // Tài liệu đi kèm các khoá học viên đang có (theo khoá học / theo bài học)
  const fromCourses = useMemo(() => {
    const owned = new Set(getEnrolledCourses().map((c) => c.id));
    const map = new Map<string, { courseId: string; title: string; total: number; open: number }>();
    docs
      .filter((d) => d.type === tab)
      .forEach((d) =>
        d.access.forEach((a) => {
          if ((a.kind !== 'course' && a.kind !== 'lesson') || !owned.has(a.courseId)) return;
          const cur = map.get(a.courseId) ?? { courseId: a.courseId, title: a.courseTitle, total: 0, open: 0 };
          cur.total += 1;
          if (d.unlocked) cur.open += 1;
          map.set(a.courseId, cur);
        }),
      );
    return [...map.values()];
  }, [docs, tab]);

  const unit = typeLabel[tab].unit;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <SubHeader
        title="Tài liệu của tôi"
        searchOpen={searchOpen}
        onToggleSearch={() => setSearchOpen((v) => !v)}
        query={query}
        onQuery={setQuery}
        placeholder="Tìm trong tài liệu của tôi"
        scrolled={scrollY > 4}
      >
        <View accessibilityRole="tablist" style={[styles.tabs, { backgroundColor: colors.card, borderColor: colors.line }]}>
          {TABS.map((t) => {
            const on = t.type === tab;
            return (
              <Pressable
                key={t.type}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                onPress={() => setTab(t.type)}
                style={[styles.tab, on && { backgroundColor: colors.emerald700 }]}
              >
                <Text style={[type.label, { color: on ? colors.onEmerald : colors.ink600 }]}>
                  {t.label} <Text style={[styles.tabCount, { opacity: on ? 0.8 : 1 }]}>{mine(t.type).length}</Text>
                </Text>
              </Pressable>
            );
          })}
        </View>
      </SubHeader>

      <ScrollView
        scrollEventThrottle={16}
        onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: BOTTOM_BAR_SPACE + insets.bottom + 16 }}
      >
        <Group title="Đã lưu" count={saved.length}>
          {saved.map((d) => (
            <MyDocRow key={d.id} doc={d} withSave />
          ))}
          {saved.length === 0 && <EmptyState text={query.trim() ? 'Không tìm thấy.' : `Chưa lưu ${unit} nào. Bấm biểu tượng lưu trên tài liệu để thêm vào đây.`} />}
        </Group>

        {bought.length > 0 && (
          <Group title="Đã mua" count={bought.length}>
            {bought.map((d) => (
              <MyDocRow key={d.id} doc={d} />
            ))}
          </Group>
        )}

        {fromCourses.length > 0 && !query.trim() && (
          <View style={styles.section}>
            <View>
              <Text accessibilityRole="header" style={[type.h2, { color: colors.ink900 }]}>
                Từ khoá học của bạn
              </Text>
              <Text style={[type.caption, { color: colors.ink600 }]}>{typeLabel[tab].title} đi kèm các khoá bạn đang có</Text>
            </View>
            {fromCourses.map((c) => (
              <Pressable
                key={c.courseId}
                accessibilityRole="link"
                onPress={() => router.push(`/courses/${c.courseId}`)}
                style={({ pressed }) => [styles.courseRow, { backgroundColor: colors.card, borderColor: colors.line, opacity: pressed ? 0.85 : 1 }]}
              >
                <View style={[styles.courseIcon, { backgroundColor: colors.violetTint }]}>
                  <Icon name="courses" size={24} color={colors.violetText} />
                </View>
                <View style={styles.grow}>
                  <Text style={[styles.courseTitle, { color: colors.ink900 }]}>{c.title}</Text>
                  <Text style={[styles.small, { color: colors.ink600 }]}>
                    {c.total} {unit} · {c.open === c.total ? 'tất cả đã mở' : `${c.open} đã mở, ${c.total - c.open} mở theo bài học`}
                  </Text>
                </View>
                <Icon name="chevronRight" size={18} color={colors.ink400} />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Group({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={[type.h2, { color: colors.ink900 }]}>
        {title} <Text style={[styles.count, { color: colors.ink600 }]}>{count}</Text>
      </Text>
      {children}
    </View>
  );
}

/** Dòng tài liệu trong "Tài liệu của tôi": bìa bên trái theo loại · nút bỏ lưu (Đã lưu) hoặc mũi tên (Đã mua). */
function MyDocRow({ doc, withSave = false }: { doc: Doc; withSave?: boolean }) {
  const { colors } = useTheme();
  const { openDoc } = useDocuments();
  const sub = doc.bought && doc.boughtAt && !withSave ? `${doc.author} · Mua ngày ${formatDate(doc.boughtAt)}` : doc.author;
  return (
    <View style={[styles.myRow, { backgroundColor: colors.card, borderColor: colors.line }]}>
      <Pressable accessibilityRole="link" accessibilityLabel={doc.title} onPress={() => openDoc(doc)} style={({ pressed }) => [styles.myMain, { opacity: pressed ? 0.85 : 1 }]}>
        <View style={styles.myCover}>
          {doc.type === 'video' && <VideoCover doc={doc} height="100%" compact />}
          {doc.type === 'pdf' && (
            <View style={styles.centerFill}>
              <PdfThumb doc={doc} />
            </View>
          )}
          {doc.type === 'book' && (
            <View style={[styles.centerFill, { backgroundColor: colors.surfaceAlt }]}>
              <View style={styles.bookMini}>
                <BookCover doc={doc} />
              </View>
            </View>
          )}
        </View>
        <View style={styles.myText}>
          <Text style={[styles.author, { color: colors.ink600 }]} numberOfLines={1}>
            {sub}
          </Text>
          <Text style={[styles.myTitle, { color: colors.ink900 }]} numberOfLines={2}>
            {doc.title}
          </Text>
          <AccessChip doc={doc} long />
        </View>
      </Pressable>
      {withSave ? (
        <SaveButton doc={doc} variant="row" />
      ) : (
        <View style={styles.chev}>
          <Icon name="chevronRight" size={18} color={colors.ink400} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  small: { fontFamily: fonts.sans400, fontSize: 12, lineHeight: 16 },
  author: { fontFamily: fonts.sans500, fontSize: 12, lineHeight: 16, marginBottom: 4 },
  tabs: { marginHorizontal: 20, flexDirection: 'row', padding: 4, gap: 4, borderRadius: 16, borderWidth: 1 },
  tab: { flex: 1, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tabCount: { fontFamily: fonts.sans500 },
  section: { paddingTop: 32, paddingHorizontal: 20, gap: 12 },
  count: { fontFamily: fonts.sans500, fontSize: 14 },

  myRow: { flexDirection: 'row', alignItems: 'stretch', gap: 4, paddingRight: 4, borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  myMain: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'stretch', gap: 12 },
  myCover: { width: 120, minHeight: 104 },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bookMini: { width: 52 },
  myText: { flex: 1, minWidth: 0, justifyContent: 'center', paddingVertical: 14, paddingRight: 4 },
  myTitle: { fontFamily: fonts.sans600, fontSize: 15, lineHeight: 21 },
  chev: { width: 36, alignItems: 'center', justifyContent: 'center' },

  courseRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 18, borderWidth: 1 },
  courseIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  courseTitle: { fontFamily: fonts.sans600, fontSize: 15, lineHeight: 22 },
});