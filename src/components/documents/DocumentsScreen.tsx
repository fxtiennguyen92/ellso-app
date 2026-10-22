import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Animated, Platform, Pressable, ScrollView, type ScrollViewInstance, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { BOTTOM_BAR_SPACE } from '@/components/BottomBar';
import { Icon } from '@/components/Icon';
import { SCROLL_TOP_SPACE, ScrollTopButton } from '@/components/ScrollTopButton';
import { getWatching, matchQuery, type Doc, typeLabel } from '@/data/documents';
import { useLoop } from '@/hooks/useLoop';
import { useScreenTopInset } from '@/hooks/useScreenTopInset';
import { useTheme } from '@/theme/ThemeProvider';
import { illo } from '@/theme/tokens';
import { fonts, type } from '@/theme/typography';

import { BookCard, EmptyState, Grid, PdfRow, SectionHead, TopicChips, VideoCard } from './DocParts';
import { useDocuments } from './DocumentsContext';

/** Tab Tài liệu: tìm + lọc chủ đề (dính trên cùng) · Tài liệu của tôi · Đang xem · Video · PDF · Sách. */
export function DocumentsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const topInset = useScreenTopInset();
  const { docs, openDoc } = useDocuments();

  const [topic, setTopic] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [scrollY, setScrollY] = useState(0);
  const scrollRef = useRef<ScrollViewInstance>(null);

  const visible = useMemo(() => docs.filter((d) => (!topic || d.topicId === topic) && matchQuery(d, query)), [docs, topic, query]);
  const byType = (t: Doc['type']) => visible.filter((d) => d.type === t);
  const videos = byType('video').slice(0, 4);
  const pdfs = byType('pdf').slice(0, 4);
  const books = byType('book').slice(0, 9);

  const savedCount = docs.filter((d) => d.saved).length;
  const boughtCount = docs.filter((d) => d.bought).length;
  const w = getWatching();
  const watching = docs.find((d) => d.id === w.docId);
  const searching = query.trim().length > 0;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <ScrollView
        ref={scrollRef}
        stickyHeaderIndices={[1]}
        scrollEventThrottle={16}
        onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: BOTTOM_BAR_SPACE + insets.bottom + SCROLL_TOP_SPACE + 8 }}
      >
        {/* 0 · Tiêu đề (cuộn đi) */}
        <View style={[styles.titleWrap, { paddingTop: topInset }]}>
          <Text accessibilityRole="header" style={[type.screenTitle, { color: colors.ink900 }]}>
            Tài liệu
          </Text>
        </View>

        {/* 1 · Tìm + chủ đề (dính trên cùng) */}
        <View style={[styles.sticky, { backgroundColor: colors.bg, borderBottomColor: scrollY > 60 ? colors.line : 'transparent' }]}>
          <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.line, boxShadow: colors.shadowCard }]}>
            <Icon name="search" size={20} color={colors.ink600} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Tìm video, PDF, sách, tác giả…"
              placeholderTextColor={colors.ink600}
              accessibilityLabel="Tìm tài liệu"
              returnKeyType="search"
              style={[type.input, styles.input, { color: colors.ink900 }]}
            />
            {searching && (
              <Pressable accessibilityRole="button" accessibilityLabel="Xoá tìm kiếm" onPress={() => setQuery('')} hitSlop={8} style={[styles.clear, { backgroundColor: colors.surfaceAlt }]}>
                <Icon name="close" size={14} color={colors.ink600} />
              </Pressable>
            )}
          </View>
          <TopicChips value={topic} onChange={setTopic} />
        </View>

        {/* 2 · nội dung */}
        <View>
          {!searching && <MyDocsBanner saved={savedCount} bought={boughtCount} />}

          {!searching && watching && (
            <View style={styles.section}>
              <SectionHead title="Đang xem" />
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={`Tiếp tục ${watching.title}, đã xem ${w.progress}%, ${w.remaining}`}
                onPress={() => openDoc(watching)}
                style={({ pressed }) => [styles.watching, { backgroundColor: colors.card, borderColor: colors.line, opacity: pressed ? 0.85 : 1 }]}
              >
                <View style={[styles.watchIcon, { backgroundColor: illo.typeVideo }]}>
                  <Icon name="video" size={26} strokeWidth={1.8} color="#ffffff" />
                </View>
                <View style={styles.grow}>
                  <Text style={[styles.author, { color: colors.ink600 }]} numberOfLines={1}>
                    {watching.author}
                  </Text>
                  <Text style={[styles.watchTitle, { color: colors.ink900 }]} numberOfLines={1}>
                    {watching.title}
                  </Text>
                  <View style={styles.progressRow}>
                    <View style={[styles.track, { backgroundColor: colors.line }]}>
                      <View style={[styles.fill, { width: `${w.progress}%`, backgroundColor: colors.emerald500 }]} />
                    </View>
                    <Text style={[type.chip, { color: colors.emerald700 }]}>{w.remaining}</Text>
                  </View>
                </View>
              </Pressable>
            </View>
          )}

          {videos.length > 0 && (
            <View style={styles.section}>
              <SectionHead title={typeLabel.video.title} onAll={() => router.push('/documents/videos')} />
              <Grid columns={2} rowGap={24}>
                {videos.map((d) => (
                  <VideoCard key={d.id} doc={d} />
                ))}
              </Grid>
            </View>
          )}

          {pdfs.length > 0 && (
            <View style={[styles.section, { gap: 12 }]}>
              <SectionHead title={typeLabel.pdf.title} onAll={() => router.push('/documents/pdfs')} />
              {pdfs.map((d) => (
                <PdfRow key={d.id} doc={d} />
              ))}
            </View>
          )}

          {books.length > 0 && (
            <View style={styles.section}>
              <SectionHead title={typeLabel.book.title} onAll={() => router.push('/documents/books')} />
              <Grid columns={3} rowGap={24}>
                {books.map((d) => (
                  <BookCard key={d.id} doc={d} />
                ))}
              </Grid>
            </View>
          )}

          {videos.length + pdfs.length + books.length === 0 && (
            <EmptyState text={searching ? `Không tìm thấy tài liệu cho "${query.trim()}".` : 'Chưa có tài liệu trong chủ đề này.'} />
          )}
        </View>
      </ScrollView>

      <ScrollTopButton visible={scrollY > 400} onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })} />
    </View>
  );
}

/** Banner nổi bật "Tài liệu của tôi" với thư mục 3D có giấy nhấp nhô. */
function MyDocsBanner({ saved, bought }: { saved: number; bought: number }) {
  const { colors } = useTheme();
  const drift = useLoop(6000);
  const sheet = useLoop(2800);
  const sheet2 = useLoop(2800, { delay: 400 });
  const pop = useLoop(3000, { kind: 'pop' });

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`Tài liệu của tôi: ${saved} đã lưu, ${bought} đã mua`}
      onPress={() => router.push('/documents/mine')}
      style={({ pressed }) => [styles.banner, { backgroundColor: colors.emerald700, boxShadow: `0px 6px 0px ${colors.emeraldEdge}`, transform: [{ scale: pressed ? 0.99 : 1 }] }]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.bannerRing,
          {
            borderColor: colors.heroDeco,
            transform: [
              { translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) },
              { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [0, 6] }) },
            ],
          },
        ]}
      />
      <View pointerEvents="none" style={[styles.bannerDot, { backgroundColor: colors.heroDeco }]} />

      {/* Thư mục */}
      <View style={styles.folder}>
        <View style={[styles.folderTab, { backgroundColor: illo.folderBack }]} />
        <View style={[styles.folderBack, { backgroundColor: illo.folderBack }]} />
        <Animated.View
          style={[
            styles.sheet1,
            {
              transform: [
                { translateY: sheet.interpolate({ inputRange: [0, 1], outputRange: [0, -7] }) },
                { rotate: sheet.interpolate({ inputRange: [0, 1], outputRange: ['-6deg', '-9deg'] }) },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.sheet2,
            {
              transform: [
                { translateY: sheet2.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) },
                { rotate: sheet2.interpolate({ inputRange: [0, 1], outputRange: ['5deg', '8deg'] }) },
              ],
            },
          ]}
        />
        <View style={[styles.folderFront, { boxShadow: `0px 4px 0px ${illo.folderEdge}` }]}>
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="folderFront" x1="0.2" y1="0" x2="0.8" y2="1">
                <Stop offset="0" stopColor={illo.folderHi} />
                <Stop offset="1" stopColor={illo.folderLo} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" rx="8" fill="url(#folderFront)" />
          </Svg>
        </View>
        <Animated.View
          style={[
            styles.folderBadge,
            { backgroundColor: colors.fav, borderColor: colors.emerald700, transform: [{ scale: pop.interpolate({ inputRange: [-1, 0, 1], outputRange: [0.95, 1, 1.2] }) }] },
          ]}
        >
          <Icon name="bookmarkFilled" size={12} color="#ffffff" />
        </Animated.View>
      </View>

      <View style={styles.bannerText}>
        <Text style={[styles.bannerTitle, { color: colors.onEmerald }]}>Tài liệu của tôi</Text>
        <View style={styles.bannerStats}>
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: colors.onEmerald }]}>{saved}</Text>
            <Text style={[styles.statLabel, { color: colors.onEmeraldMuted }]}>đã lưu</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: illo.onCoverDeco }]} />
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: colors.onEmerald }]}>{bought}</Text>
            <Text style={[styles.statLabel, { color: colors.onEmeraldMuted }]}>đã mua</Text>
          </View>
        </View>
      </View>
      <Icon name="chevronRight" size={20} color={colors.onEmerald} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  small: { fontFamily: fonts.sans400, fontSize: 12, lineHeight: 16 },
  author: { fontFamily: fonts.sans500, fontSize: 12, lineHeight: 16, marginBottom: 2 },
  titleWrap: { paddingHorizontal: 20 },
  sticky: { paddingTop: 16, paddingBottom: 12, gap: 12, borderBottomWidth: 1, zIndex: 10 },
  search: { marginHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 10, height: 52, paddingLeft: 16, paddingRight: 10, borderRadius: 16, borderWidth: 1 },
  input: { flex: 1, minWidth: 0, height: '100%', paddingVertical: 0, ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null) },
  clear: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  section: { paddingTop: 36, paddingHorizontal: 20, gap: 16 },

  banner: { marginTop: 16, marginHorizontal: 20, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: 18, paddingVertical: 18, paddingLeft: 20, paddingRight: 16, borderRadius: 22 },
  bannerRing: { position: 'absolute', width: 140, height: 140, borderRadius: 70, borderWidth: 22, right: -46, top: -60 },
  bannerDot: { position: 'absolute', width: 46, height: 46, borderRadius: 23, right: 64, bottom: -22 },
  folder: { width: 68, height: 60 },
  folderTab: { position: 'absolute', left: 0, top: 0, width: 28, height: 14, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  folderBack: { position: 'absolute', left: 0, top: 7, width: 68, height: 50, borderRadius: 8 },
  sheet1: { position: 'absolute', left: 10, top: 2, width: 44, height: 40, borderRadius: 4, backgroundColor: illo.sheet1, boxShadow: '0px 2px 4px rgba(15,23,42,0.15)' },
  sheet2: { position: 'absolute', left: 18, top: 8, width: 40, height: 34, borderRadius: 4, backgroundColor: illo.sheet2, boxShadow: '0px 2px 4px rgba(15,23,42,0.15)' },
  folderFront: { position: 'absolute', left: 0, top: 22, width: 68, height: 38, borderRadius: 8 },
  folderBadge: { position: 'absolute', right: -6, bottom: -6, width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  bannerText: { flex: 1, minWidth: 0, gap: 8 },
  bannerTitle: { fontFamily: fonts.display600, fontSize: 18, lineHeight: 24 },
  bannerStats: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stat: { flexDirection: 'row', alignItems: 'baseline', gap: 5 },
  statNum: { fontFamily: fonts.display600, fontSize: 20, lineHeight: 24 },
  statLabel: { fontFamily: fonts.sans400, fontSize: 13, lineHeight: 18 },
  statDivider: { width: 1, height: 18 },

  watching: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, borderRadius: 20, borderWidth: 1 },
  watchIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  watchTitle: { fontFamily: fonts.sans600, fontSize: 15, lineHeight: 22 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  track: { flex: 1, height: 6, borderRadius: 9999, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 9999 },
});