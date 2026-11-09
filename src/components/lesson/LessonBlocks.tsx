import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import type { LessonBlock, ListItem } from '@/data/lesson';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/typography';

import { MONO, RichInline } from './RichInline';

/** Màu nhấn của bài = màu chương trên bản đồ (gạch đầu dòng, số thứ tự, vạch trích dẫn). */
export type Accent = { base: string; soft: string; ink: string };

/**
 * Các khối nội dung tĩnh của bài học (Editor.js): đoạn văn, tiêu đề, danh sách (chấm / số / kiểm, lồng nhau),
 * trích dẫn, đường phân cách, ảnh (viền / nền / giãn rộng, bấm để phóng to), bảng, code (sao chép), lưu ý.
 * Câu hỏi và video là khối tương tác, render ở LessonScreen (QuizBlock / LessonVideo).
 */
export function StaticBlock({ block, accent, onCopied }: { block: LessonBlock; accent: Accent; onCopied: () => void }) {
  const { colors } = useTheme();
  switch (block.type) {
    case 'paragraph':
      return block.data.text?.trim() ? <RichInline html={block.data.text} style={[type.body, { color: colors.ink900 }]} /> : null;

    case 'header': {
      const level = Math.min(4, Math.max(1, block.data.level || 2));
      const st = level <= 2 ? styles.h2 : level === 3 ? styles.h3 : styles.h4;
      return (
        <View accessibilityRole="header" style={level <= 2 ? styles.h2Wrap : styles.hWrap}>
          <RichInline html={block.data.text} style={[st, { color: colors.ink900 }]} />
        </View>
      );
    }

    case 'list':
      return <ListBlock style={block.data.style} items={block.data.items} start={block.data.meta?.start ?? 1} counter={block.data.meta?.counterType} accent={accent} depth={0} />;

    case 'quote': {
      const center = block.data.alignment === 'center';
      return (
        <View style={[styles.quote, { borderLeftColor: accent.base }, center && styles.quoteCenter]}>
          <RichInline html={block.data.text} style={[styles.quoteText, { color: colors.ink900 }, center && styles.centerText]} />
          {block.data.caption?.trim() ? (
            <RichInline html={`— ${block.data.caption}`} style={[type.caption, { color: colors.ink600 }, center && styles.centerText]} />
          ) : null}
        </View>
      );
    }

    case 'delimiter':
      return (
        <View style={styles.delimiter} accessible={false}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.dot, { backgroundColor: colors.ink400 }]} />
          ))}
        </View>
      );

    case 'image':
      return <ImageBlock data={block.data} />;

    case 'table':
      return <TableBlock rows={block.data.content ?? []} headings={!!block.data.withHeadings} />;

    case 'code':
      return <CodeBlock code={block.data.code ?? ''} onCopied={onCopied} />;

    case 'warning':
      return (
        <View style={[styles.warning, { backgroundColor: colors.amberChip, borderColor: colors.amberChipLine }]}>
          <View style={styles.warnIcon}>
            <Icon name="alert" size={20} color={colors.amberChipText} />
          </View>
          <View style={styles.grow}>
            {block.data.title?.trim() ? <RichInline html={block.data.title} style={[type.label, { color: colors.ink900 }]} /> : null}
            {block.data.message?.trim() ? <RichInline html={block.data.message} style={[type.input, { color: colors.ink900 }]} /> : null}
          </View>
        </View>
      );

    default:
      return null;
  }
}

// ── Danh sách ────────────────────────────────────────────

const ROMAN: [number, string][] = [[1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'], [100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'], [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']];
function counterLabel(n: number, kind?: string): string {
  switch (kind) {
    case 'lower-roman':
    case 'upper-roman': {
      let s = '';
      let v = n;
      for (const [k, r] of ROMAN) while (v >= k) ((s += r), (v -= k));
      return kind === 'upper-roman' ? s.toUpperCase() : s;
    }
    case 'lower-alpha':
    case 'upper-alpha': {
      let s = '';
      let v = n;
      while (v > 0) ((s = String.fromCharCode(97 + ((v - 1) % 26)) + s), (v = Math.floor((v - 1) / 26)));
      return kind === 'upper-alpha' ? s.toUpperCase() : s;
    }
    default:
      return String(n);
  }
}

function ListBlock({
  style,
  items,
  start,
  counter,
  accent,
  depth,
}: {
  style: 'ordered' | 'unordered' | 'checklist';
  items: (ListItem | string)[];
  start: number;
  counter?: string;
  accent: Accent;
  depth: number;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.list, depth > 0 && styles.nested]}>
      {items.map((raw, i) => {
        const it: ListItem = typeof raw === 'string' ? { content: raw } : raw;
        const checked = !!it.meta?.checked;
        let marker;
        if (style === 'ordered') {
          marker = <Text style={[styles.num, { color: accent.ink }]}>{counterLabel(start + i, counter)}.</Text>;
        } else if (style === 'checklist') {
          marker = (
            <View
              style={[
                styles.check,
                checked ? { backgroundColor: colors.emerald700, borderColor: colors.emerald700 } : { borderColor: colors.ink400 },
              ]}
            >
              {checked && <Icon name="check" size={13} strokeWidth={3} color={colors.onEmerald} />}
            </View>
          );
        } else {
          marker = <View style={[styles.bullet, depth > 0 ? { borderWidth: 1.5, borderColor: accent.base } : { backgroundColor: accent.base }]} />;
        }
        return (
          <View key={i} accessibilityLabel={style === 'checklist' ? (checked ? 'Đã xong' : 'Chưa xong') : undefined}>
            <View style={styles.itemRow}>
              <View style={styles.marker}>{marker}</View>
              <RichInline
                html={it.content}
                style={[type.body, styles.grow, { color: colors.ink900 }, style === 'checklist' && checked && { color: colors.ink600 }]}
              />
            </View>
            {it.items?.length ? <ListBlock style={style} items={it.items} start={1} counter={counter} accent={accent} depth={depth + 1} /> : null}
          </View>
        );
      })}
    </View>
  );
}

// ── Ảnh ──────────────────────────────────────────────────

function ImageBlock({ data }: { data: Extract<LessonBlock, { type: 'image' }>['data'] }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [ratio, setRatio] = useState(16 / 9);
  const [zoom, setZoom] = useState(false);
  const caption = data.caption?.trim();
  const bg = !!data.withBackground;
  return (
    <View style={[styles.figure, data.stretched && styles.stretched]}>
      <Pressable
        accessibilityRole="imagebutton"
        accessibilityLabel={caption ? `Ảnh: ${caption}. Bấm để phóng to` : 'Ảnh minh hoạ. Bấm để phóng to'}
        onPress={() => setZoom(true)}
        style={[
          styles.imageFrame,
          !data.stretched && styles.rounded,
          bg && { backgroundColor: colors.mint50, padding: 20 },
          data.withBorder && { borderWidth: 1, borderColor: colors.line },
        ]}
      >
        <Image
          source={{ uri: data.file.url }}
          onLoad={(e) => e.source.width && e.source.height && setRatio(e.source.width / e.source.height)}
          style={[
            { width: bg ? '70%' : '100%', aspectRatio: ratio, alignSelf: 'center', backgroundColor: bg ? 'transparent' : colors.surfaceAlt },
            !data.stretched && !bg && styles.rounded,
            bg && { borderRadius: 10 },
          ]}
          contentFit="contain"
          transition={150}
        />
      </Pressable>
      {caption ? <RichInline html={caption} style={[type.caption, styles.centerText, { color: colors.ink600 }]} /> : null}

      <Modal visible={zoom} transparent animationType="fade" onRequestClose={() => setZoom(false)}>
        <Pressable accessibilityLabel="Đóng ảnh" onPress={() => setZoom(false)} style={styles.viewer}>
          <Image source={{ uri: data.file.url }} style={styles.viewerImg} contentFit="contain" />
          <View style={[styles.viewerClose, { top: insets.top + 16 }]}>
            <Icon name="close" size={22} color="#ffffff" />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// ── Bảng ─────────────────────────────────────────────────

function TableBlock({ rows, headings }: { rows: string[][]; headings: boolean }) {
  const { colors } = useTheme();
  const cols = Math.max(0, ...rows.map((r) => r.length));
  if (!rows.length || !cols) return null;
  // Ít cột → vừa khung, chia đều. Nhiều cột → cuộn ngang, mỗi cột tối thiểu 140.
  const wide = cols > 3;
  const table = (
    <View style={[styles.table, { borderColor: colors.line }]}>
      {rows.map((r, ri) => {
        const head = headings && ri === 0;
        return (
          <View
            key={ri}
            style={[styles.tr, ri > 0 && { borderTopWidth: 1, borderTopColor: colors.line }, head && { backgroundColor: colors.surfaceAlt }]}
          >
            {Array.from({ length: cols }, (_, ci) => (
              <View
                key={ci}
                style={[styles.td, wide ? { width: 150 } : styles.grow, ci > 0 && { borderLeftWidth: 1, borderLeftColor: colors.line }]}
              >
                <RichInline html={r[ci] ?? ''} style={[head ? type.label : type.input, { color: colors.ink900 }]} />
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
  return wide ? (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.bleedInner}>
      {table}
    </ScrollView>
  ) : (
    table
  );
}

// ── Code ─────────────────────────────────────────────────

function CodeBlock({ code, onCopied }: { code: string; onCopied: () => void }) {
  const { colors, scheme } = useTheme();
  const dark = scheme === 'dark';
  return (
    <View style={[styles.code, { backgroundColor: dark ? '#0b1210' : '#13201b' }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.codeScroll}>
        <Text selectable style={styles.codeText}>
          {code}
        </Text>
      </ScrollView>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sao chép code"
        hitSlop={8}
        onPress={async () => {
          try {
            await Clipboard.setStringAsync(code);
            onCopied();
          } catch {}
        }}
        style={({ pressed }) => [styles.copy, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Icon name="copy" size={16} color={colors.mint100} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  centerText: { textAlign: 'center' },
  h2Wrap: { marginTop: 10 },
  hWrap: { marginTop: 4 },
  h2: { fontFamily: fonts.display600, fontSize: 22, lineHeight: 30 },
  h3: { fontFamily: fonts.display600, fontSize: 19, lineHeight: 27 },
  h4: { fontFamily: fonts.display500, fontSize: 17, lineHeight: 24 },
  list: { gap: 10 },
  nested: { marginTop: 10, marginLeft: 30 },
  itemRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  marker: { width: 22, minHeight: 26, alignItems: 'center', justifyContent: 'center' },
  bullet: { width: 8, height: 8, borderRadius: 4 },
  num: { fontFamily: fonts.display600, fontSize: 15, lineHeight: 26 },
  check: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  quote: { borderLeftWidth: 4, paddingLeft: 16, paddingVertical: 4, gap: 6 },
  quoteCenter: { borderLeftWidth: 0, paddingLeft: 0, alignItems: 'center', paddingHorizontal: 16 },
  quoteText: { fontFamily: fonts.display500, fontSize: 18, lineHeight: 28 },
  delimiter: { flexDirection: 'row', justifyContent: 'center', gap: 14, paddingVertical: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  figure: { gap: 8 },
  stretched: { marginHorizontal: -20 },
  imageFrame: { overflow: 'hidden' },
  rounded: { borderRadius: 18 },
  viewer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' },
  viewerImg: { width: '100%', height: '80%' },
  viewerClose: { position: 'absolute', right: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  bleed: { marginHorizontal: -20 },
  bleedInner: { paddingHorizontal: 20 },
  table: { borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  tr: { flexDirection: 'row' },
  td: { paddingHorizontal: 12, paddingVertical: 10 },
  code: { borderRadius: 16, overflow: 'hidden' },
  codeScroll: { padding: 16, paddingRight: 48 },
  codeText: { fontFamily: MONO, fontSize: 13.5, lineHeight: 21, color: '#d7f5e6' },
  copy: { position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  warning: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  warnIcon: { paddingTop: 1 },
});
