import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, type ScrollViewInstance, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/BottomSheet';
import { BOTTOM_BAR_SPACE } from '@/components/BottomBar';
import { Icon } from '@/components/Icon';
import { SCROLL_TOP_SPACE, ScrollTopButton } from '@/components/ScrollTopButton';
import { type DocType, matchQuery, type SortKey, sortDocs, sortLabels, typeLabel } from '@/data/documents';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/typography';

import { BookCard, EmptyState, Grid, PdfRow, TopicChips, VideoCard } from './DocParts';
import { useDocuments } from './DocumentsContext';
import { SubHeader } from './SubHeader';

/** "Xem tất cả" của một loại: Video (lưới 2 cột) · PDF (danh sách) · Sách (lưới 3 cột). */
export function DocListScreen({ docType }: { docType: DocType }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { docs } = useDocuments();

  const [topic, setTopic] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [sort, setSort] = useState<SortKey>('newest');
  const [sortOpen, setSortOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const scrollRef = useRef<ScrollViewInstance>(null);

  const label = typeLabel[docType];
  const list = useMemo(
    () => sortDocs(docs.filter((d) => d.type === docType && (!topic || d.topicId === topic) && matchQuery(d, query)), sort),
    [docs, docType, topic, query, sort],
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <SubHeader
        title={label.title}
        searchOpen={searchOpen}
        onToggleSearch={() => setSearchOpen((v) => !v)}
        query={query}
        onQuery={setQuery}
        placeholder={`Tìm ${label.unit}`}
        scrolled={scrollY > 4}
      >
        <TopicChips value={topic} onChange={setTopic} />
      </SubHeader>

      <ScrollView
        ref={scrollRef}
        scrollEventThrottle={16}
        onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: BOTTOM_BAR_SPACE + insets.bottom + SCROLL_TOP_SPACE + 8 }}
      >
        <View style={styles.toolbar}>
          <Text style={[type.caption, styles.grow, { color: colors.ink600 }]}>
            {list.length} {label.unit}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Sắp xếp: ${sortLabels[sort]}`}
            onPress={() => setSortOpen(true)}
            style={({ pressed }) => [styles.sortBtn, { backgroundColor: pressed ? colors.surfaceAlt : colors.card, borderColor: colors.line }]}
          >
            <Text style={[type.captionStrong, { color: colors.ink900 }]}>{sortLabels[sort]}</Text>
            <Icon name="chevronDown" size={16} color={colors.ink900} />
          </Pressable>
        </View>

        <View style={styles.body}>
          {docType === 'video' && (
            <Grid columns={2} rowGap={26}>
              {list.map((d) => (
                <VideoCard key={d.id} doc={d} />
              ))}
            </Grid>
          )}
          {docType === 'pdf' && (
            <View style={styles.rows}>
              {list.map((d) => (
                <PdfRow key={d.id} doc={d} />
              ))}
            </View>
          )}
          {docType === 'book' && (
            <Grid columns={3} rowGap={26}>
              {list.map((d) => (
                <BookCard key={d.id} doc={d} />
              ))}
            </Grid>
          )}
          {list.length === 0 && <EmptyState text={query.trim() ? `Không tìm thấy ${label.unit} cho "${query.trim()}".` : `Chưa có ${label.unit} trong chủ đề này.`} />}
        </View>
      </ScrollView>

      <ScrollTopButton visible={scrollY > 400} onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })} />

      <BottomSheet visible={sortOpen} onClose={() => setSortOpen(false)} title="Sắp xếp theo">
        <View accessibilityRole="radiogroup" style={styles.sortList}>
          {(Object.keys(sortLabels) as SortKey[]).map((k) => {
            const on = k === sort;
            return (
              <Pressable
                key={k}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                onPress={() => {
                  setSort(k);
                  setSortOpen(false);
                }}
                style={({ pressed }) => [styles.sortRow, { backgroundColor: on ? colors.mint50 : pressed ? colors.surfaceAlt : 'transparent' }]}
              >
                <Text style={[styles.sortText, { color: on ? colors.emerald700 : colors.ink900 }]}>{sortLabels[k]}</Text>
                {on && <Icon name="check" size={18} strokeWidth={2.5} color={colors.emerald700} />}
              </Pressable>
            );
          })}
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 16, paddingHorizontal: 20, paddingBottom: 12 },
  sortBtn: { height: 36, paddingLeft: 12, paddingRight: 10, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  body: { paddingTop: 8, paddingHorizontal: 20 },
  rows: { gap: 12 },
  sortList: { gap: 4 },
  sortRow: { height: 52, paddingHorizontal: 14, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sortText: { fontFamily: fonts.sans600, fontSize: 15, lineHeight: 22 },
});