import { useRef, type ReactNode } from 'react';
import { Pressable, ScrollView, type ScrollViewInstance, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { type Doc, topics } from '@/data/documents';
import { useDragScroll } from '@/hooks/useDragScroll';
import Svg, { Path, Rect } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { chapterPalette, illo } from '@/theme/tokens';
import { fonts, type } from '@/theme/typography';

import { accessStyle, primaryAccess } from './docAccess';
import { useDocuments } from './DocumentsContext';

// ------------------------------------------------------------------ Chip quyền

/** Chip cho biết kiểu quyền của tài liệu. */
export function AccessChip({ doc, long = false, small = false }: { doc: Doc; long?: boolean; small?: boolean }) {
  const { colors } = useTheme();
  const s = accessStyle(primaryAccess(doc), !!doc.bought, colors);
  return (
    <View style={[styles.chip, small && styles.chipSmall, { backgroundColor: s.bg }]}>
      {s.icon && <Icon name={s.icon} size={small ? 11 : 12} strokeWidth={s.icon === 'check' ? 3 : 2.4} color={s.fg} />}
      <Text style={[small ? styles.chipTextSmall : styles.chipText, { color: s.fg }]} numberOfLines={1}>
        {long ? s.long : s.short}
      </Text>
    </View>
  );
}

// ------------------------------------------------------------------ Lớp phủ & nút lưu

/** Lớp tối + ổ khoá cho tài liệu chưa mở. */
export function LockOverlay({ size = 32 }: { size?: number }) {
  return (
    <View style={[StyleSheet.absoluteFill, styles.scrim]} pointerEvents="none">
      <View style={[styles.lockDot, { width: size, height: size, borderRadius: size / 2 }]}>
        <Icon name="lock" size={Math.round(size * 0.46)} strokeWidth={2.2} color={illo.lockInk} />
      </View>
    </View>
  );
}

/** Nút lưu (bookmark). `variant="overlay"`: tròn mờ trên ảnh bìa · `"row"`: nằm cuối dòng. Bật = vàng. */
export function SaveButton({ doc, variant, size = 36 }: { doc: Doc; variant: 'overlay' | 'row'; size?: number }) {
  const { colors } = useTheme();
  const { toggleSave } = useDocuments();
  const on = doc.saved;
  const color = on ? colors.fav : variant === 'overlay' ? '#ffffff' : colors.ink400;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={on ? `Bỏ lưu ${doc.title}` : `Lưu ${doc.title}`}
      accessibilityState={{ selected: on }}
      onPress={() => toggleSave(doc)}
      hitSlop={4}
      style={({ pressed }) => [
        variant === 'overlay' ? [styles.saveOverlay, { width: size, height: size, borderRadius: size / 2 }] : styles.saveRow,
        { transform: [{ scale: pressed ? 0.88 : 1 }] },
      ]}
    >
      <Icon name={on ? 'bookmarkFilled' : 'bookmark'} size={variant === 'overlay' ? Math.round(size * 0.44) : 20} strokeWidth={1.8} color={color} />
    </Pressable>
  );
}

// ------------------------------------------------------------------ Bìa

const coverColor = (d: Doc) => chapterPalette[d.cover].base;

/** Bìa video: nền màu + vòng trang trí + nút play / ổ khoá + thời lượng. */
/** Bìa video. Không truyền `height` → tự co theo tỉ lệ 16:10 của bề rộng cột. */
export function VideoCover({ doc, height, compact = false }: { doc: Doc; height?: number | '100%'; compact?: boolean }) {
  const bg = coverColor(doc);
  const play = compact ? 26 : 34;
  return (
    <View style={[styles.videoCover, height === undefined ? styles.videoRatio : { height }, { backgroundColor: bg }]}>
      <View style={[styles.deco, compact ? styles.decoSmall : null]} />
      {doc.unlocked && (
        <View style={[styles.playDot, { width: play, height: play, borderRadius: play / 2 }]}>
          <Icon name="play" size={compact ? 11 : 14} color={bg} />
        </View>
      )}
      {!doc.unlocked && <LockOverlay size={compact ? 26 : 32} />}
      {doc.duration && (
        <View style={[styles.duration, compact && styles.durationSmall]}>
          <Icon name="clock" size={compact ? 10 : 11} strokeWidth={2.2} color="#ffffff" />
          <Text style={[styles.durationText, compact && styles.durationTextSmall]}>{doc.duration}</Text>
        </View>
      )}
    </View>
  );
}

/** Ô PDF: tờ giấy gấp góc + nhãn PDF. */
export function PdfThumb({ doc }: { doc: Doc }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.pdfThumb, { backgroundColor: colors.surfaceAlt }]}>
      {/* tờ giấy gấp góc phải trên */}
      <Svg width={38} height={50} viewBox="0 0 38 50">
        <Path d="M4 0H27.4L38 11V46a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4V4a4 4 0 0 1 4-4Z" fill={colors.page} />
        <Rect x="5" y="12" width="28" height="3" rx="1.5" fill={colors.pageLine} />
        <Rect x="5" y="19" width="22" height="3" rx="1.5" fill={colors.pageLine} />
      </Svg>
      <View style={styles.pdfTag}>
        <Text style={styles.pdfTagText}>PDF</Text>
      </View>
      {!doc.unlocked && <LockOverlay size={26} />}
    </View>
  );
}

/** Bìa sách tỉ lệ 2:3 (chưa có ảnh bìa thật → chỗ giữ "Ảnh bìa"). */
export function BookCover({ doc }: { doc: Doc }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.book, { backgroundColor: coverColor(doc), boxShadow: colors.shadowBook }]}>
      <View style={styles.bookPlaceholder}>
        <Icon name="image" size={22} strokeWidth={1.6} color={illo.onCoverFaint} />
        <Text style={styles.bookPlaceholderText}>Ảnh bìa</Text>
      </View>
      {!doc.unlocked && <LockOverlay size={30} />}
    </View>
  );
}

// ------------------------------------------------------------------ Thẻ tài liệu

const a11yDoc = (d: Doc) => `${d.title}, ${d.author}${d.unlocked ? '' : '. Đang khoá, bấm để xem cách mở'}`;

export function VideoCard({ doc }: { doc: Doc }) {
  const { colors } = useTheme();
  const { openDoc } = useDocuments();
  return (
    <View style={styles.cardCol}>
      <Pressable accessibilityRole="link" accessibilityLabel={a11yDoc(doc)} onPress={() => openDoc(doc)} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
        <View style={styles.videoCoverWrap}>
          <VideoCover doc={doc} />
        </View>
        <Text style={[styles.author, { color: colors.ink600 }]} numberOfLines={1}>
          {doc.author}
        </Text>
        <Text style={[styles.cardTitle, { color: colors.ink900 }]} numberOfLines={2}>
          {doc.title}
        </Text>
        <AccessChip doc={doc} />
      </Pressable>
      <View style={styles.saveCorner}>
        <SaveButton doc={doc} variant="overlay" />
      </View>
    </View>
  );
}

export function PdfRow({ doc }: { doc: Doc }) {
  const { colors } = useTheme();
  const { openDoc } = useDocuments();
  return (
    <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.line }]}>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={a11yDoc(doc)}
        onPress={() => openDoc(doc)}
        style={({ pressed }) => [styles.rowMain, { opacity: pressed ? 0.85 : 1 }]}
      >
        <PdfThumb doc={doc} />
        <View style={styles.rowText}>
          <Text style={[styles.author, { color: colors.ink600 }]} numberOfLines={1}>
            {doc.author}
          </Text>
          <Text style={[styles.rowTitle, { color: colors.ink900 }]} numberOfLines={2}>
            {doc.title}
          </Text>
          <AccessChip doc={doc} long />
        </View>
      </Pressable>
      <SaveButton doc={doc} variant="row" />
    </View>
  );
}

export function BookCard({ doc }: { doc: Doc }) {
  const { colors } = useTheme();
  const { openDoc } = useDocuments();
  return (
    <View style={styles.cardCol}>
      <Pressable accessibilityRole="link" accessibilityLabel={a11yDoc(doc)} onPress={() => openDoc(doc)} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
        <View style={styles.bookWrap}>
          <BookCover doc={doc} />
        </View>
        <Text style={[styles.bookAuthor, { color: colors.ink600 }]} numberOfLines={1}>
          {doc.author}
        </Text>
        <Text style={[styles.bookTitle, { color: colors.ink900 }]} numberOfLines={2}>
          {doc.title}
        </Text>
        <AccessChip doc={doc} small />
      </Pressable>
      <View style={styles.saveCornerBook}>
        <SaveButton doc={doc} variant="overlay" size={34} />
      </View>
    </View>
  );
}

// ------------------------------------------------------------------ Bố cục

/** Lưới cố định n cột (Video 2 · Sách 3) theo phần trăm, không phụ thuộc đo bề rộng: luôn đúng n mục mỗi hàng ở mọi màn hình. */
export function Grid({ columns, rowGap, colGap = 14, children }: { columns: number; rowGap: number; colGap?: number; children: ReactNode[] }) {
  const half = colGap / 2;
  return (
    <View style={[styles.grid, { rowGap, marginHorizontal: -half }]}>
      {children.map((c, i) => (
        <View key={i} style={{ width: `${100 / columns}%`, paddingHorizontal: half }}>
          {c}
        </View>
      ))}
    </View>
  );
}

/** Tiêu đề nhóm + "Xem tất cả". */
export function SectionHead({ title, onAll }: { title: string; onAll?: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.sectionHead}>
      <Text accessibilityRole="header" style={[type.h2, styles.grow, { color: colors.ink900 }]}>
        {title}
      </Text>
      {onAll && (
        <Pressable accessibilityRole="link" accessibilityLabel={`Xem tất cả ${title}`} onPress={onAll} hitSlop={8}>
          {({ pressed }) => <Text style={[type.label, { color: pressed ? colors.emerald800 : colors.emerald700 }]}>Xem tất cả</Text>}
        </Pressable>
      )}
    </View>
  );
}

/** Hàng chip lọc chủ đề (cuộn ngang; web kéo chuột được). */
export function TopicChips({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const { colors } = useTheme();
  const ref = useRef<ScrollViewInstance>(null);
  useDragScroll(ref);
  const all = [{ id: null as string | null, name: 'Tất cả' }, ...topics];
  return (
    <ScrollView ref={ref} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} accessibilityLabel="Lọc theo chủ đề">
      {all.map((t) => {
        const on = value === t.id;
        return (
          <Pressable
            key={t.id ?? 'all'}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(t.id)}
            style={({ pressed }) => [
              styles.topic,
              on ? { backgroundColor: colors.emerald700, borderColor: colors.emerald700 } : { backgroundColor: pressed ? colors.mint50 : colors.card, borderColor: colors.line },
            ]}
          >
            <Text style={[on ? type.label : styles.topicText, { color: on ? colors.onEmerald : colors.ink900 }]}>{t.name}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** Thông báo khi lọc / tìm không ra. */
export function EmptyState({ text }: { text: string }) {
  const { colors } = useTheme();
  return <Text style={[type.caption, styles.empty, { color: colors.ink600 }]}>{text}</Text>;
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  chip: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 9999, maxWidth: '100%' },
  chipSmall: { gap: 3, marginTop: 6, paddingHorizontal: 7, paddingVertical: 1 },
  chipText: { fontFamily: fonts.sans700, fontSize: 11, lineHeight: 16, flexShrink: 1 },
  chipTextSmall: { fontFamily: fonts.sans700, fontSize: 10, lineHeight: 16, flexShrink: 1 },

  scrim: { backgroundColor: illo.scrim, alignItems: 'center', justifyContent: 'center' },
  lockDot: { backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  saveOverlay: { backgroundColor: illo.saveBg, alignItems: 'center', justifyContent: 'center' },
  saveRow: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  videoCover: { borderRadius: 0, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  videoCoverWrap: { borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  videoRatio: { aspectRatio: 16 / 10 },
  deco: { position: 'absolute', width: 90, height: 90, borderRadius: 45, backgroundColor: illo.onCoverDeco, left: -30, bottom: -40 },
  decoSmall: { width: 70, height: 70, borderRadius: 35, left: -24, bottom: -34 },
  playDot: { backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', paddingLeft: 2 },
  duration: { position: 'absolute', right: 6, bottom: 6, flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, borderRadius: 6, backgroundColor: illo.durBg },
  durationSmall: { right: 5, bottom: 5, paddingHorizontal: 5, borderRadius: 5 },
  durationText: { color: '#ffffff', fontFamily: fonts.sans600, fontSize: 11, lineHeight: 18 },
  durationTextSmall: { fontSize: 10, lineHeight: 16 },

  pdfThumb: { width: 56, height: 68, borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  pdfTag: { position: 'absolute', left: 5, bottom: 6, paddingHorizontal: 4, borderRadius: 4, backgroundColor: illo.typePdf },
  pdfTagText: { color: '#ffffff', fontFamily: fonts.sans700, fontSize: 9, lineHeight: 14 },

  book: { aspectRatio: 2 / 3, borderRadius: 6, overflow: 'hidden' },
  bookWrap: { marginBottom: 10 },
  bookPlaceholder: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: 4 },
  bookPlaceholderText: { color: illo.onCoverFaint, fontFamily: fonts.sans600, fontSize: 9, lineHeight: 12, letterSpacing: 0.54, textTransform: 'uppercase' },

  cardCol: { minWidth: 0 },
  // Tác giả luôn nằm trên tên tài liệu (thống nhất mọi màn Tài liệu)
  author: { fontFamily: fonts.sans500, fontSize: 12, lineHeight: 16, marginBottom: 4 },
  cardTitle: { fontFamily: fonts.sans600, fontSize: 15, lineHeight: 21 },
  bookAuthor: { fontFamily: fonts.sans500, fontSize: 11, lineHeight: 15, marginBottom: 3 },
  bookTitle: { fontFamily: fonts.sans600, fontSize: 13, lineHeight: 18 },
  saveCorner: { position: 'absolute', right: 4, top: 4 },
  saveCornerBook: { position: 'absolute', right: 2, top: 2 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 12, paddingLeft: 12, paddingRight: 4, borderRadius: 20, borderWidth: 1 },
  rowMain: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 14 },
  rowText: { flex: 1, minWidth: 0 },
  rowTitle: { fontFamily: fonts.sans600, fontSize: 15, lineHeight: 21 },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  chips: { gap: 8, paddingHorizontal: 20 },
  topic: { height: 40, paddingHorizontal: 16, borderRadius: 9999, borderWidth: 1, justifyContent: 'center' },
  topicText: { fontFamily: fonts.sans500, fontSize: 14, lineHeight: 20 },
  empty: { textAlign: 'center', paddingVertical: 24 },
});