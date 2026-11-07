import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import type { ContentBlock } from '@/data/home';
import { dmy } from '@/data/profile';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/typography';

/** "**đậm**" trong nội dung CMS → chữ đậm. */
export function RichText({ text, style }: { text: string; style: object }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <Text style={style}>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
          <Text key={i} style={{ fontFamily: fonts.sans700 }}>
            {part.slice(2, -2)}
          </Text>
        ) : (
          part
        ),
      )}
    </Text>
  );
}

/**
 * Nội dung chi tiết từ CMS (trang chiến dịch): đoạn văn, tiêu đề, các bước (số tròn), gạch đầu dòng (dấu tích),
 * ảnh + chú thích, ghi chú (info / warning), mã khuyến mãi (ô nét đứt + Sao chép). Bám theo "Xem trước trên app" ở CMS.
 */
export function ContentBlocks({ blocks, onCopied }: { blocks: ContentBlock[]; onCopied?: (code: string) => void }) {
  return (
    <View style={styles.wrap}>
      {blocks.map((b, i) => (
        <Block key={i} block={b} onCopied={onCopied} />
      ))}
    </View>
  );
}

function Block({ block, onCopied }: { block: ContentBlock; onCopied?: (code: string) => void }) {
  const { colors } = useTheme();
  switch (block.type) {
    case 'heading':
      return <Text style={[type.h2, styles.heading, { color: colors.ink900 }]}>{block.text}</Text>;
    case 'paragraph':
      return (
        <View style={styles.paras}>
          {block.text.split(/\n+/).map((p, i) => (
            <RichText key={i} text={p} style={[type.body, { color: colors.ink900 }]} />
          ))}
        </View>
      );
    case 'steps':
      return (
        <View style={styles.list}>
          {block.title ? <Text style={[type.cardTitle, { color: colors.ink900 }]}>{block.title}</Text> : null}
          {block.items.map((it, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepRail}>
                <View style={[styles.num, { backgroundColor: colors.emerald700 }]}>
                  <Text style={[styles.numText, { color: colors.onEmerald }]}>{i + 1}</Text>
                </View>
                {i < block.items.length - 1 && <View style={[styles.stepLine, { backgroundColor: colors.mint100 }]} />}
              </View>
              <RichText text={it} style={[type.body, styles.grow, styles.stepText, { color: colors.ink900 }]} />
            </View>
          ))}
        </View>
      );
    case 'bullets':
      return (
        <View style={styles.list}>
          {block.title ? <Text style={[type.cardTitle, { color: colors.ink900 }]}>{block.title}</Text> : null}
          {block.items.map((it, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={[styles.tick, { backgroundColor: colors.mint50 }]}>
                <Icon name="check" size={13} strokeWidth={3} color={colors.emerald700} />
              </View>
              <RichText text={it} style={[type.body, styles.grow, { color: colors.ink900 }]} />
            </View>
          ))}
        </View>
      );
    case 'image':
      return (
        <View style={styles.figure}>
          <Image source={{ uri: block.url }} style={[styles.image, { backgroundColor: colors.surfaceAlt }]} contentFit="cover" transition={150} />
          {block.caption ? <Text style={[type.caption, styles.center, { color: colors.ink600 }]}>{block.caption}</Text> : null}
        </View>
      );
    case 'callout': {
      const warn = block.tone === 'warning';
      return (
        <View style={[styles.callout, { backgroundColor: warn ? colors.amberChip : colors.mint50, borderColor: warn ? colors.amberChipLine : colors.mint100 }]}>
          <Icon name={warn ? 'alert' : 'info'} size={20} color={warn ? colors.amberChipText : colors.emerald700} />
          <View style={styles.grow}>
            {block.title ? <Text style={[type.label, { color: colors.ink900 }]}>{block.title}</Text> : null}
            <RichText text={block.text} style={[type.input, { color: colors.ink900 }]} />
          </View>
        </View>
      );
    }
    case 'promo_code':
      return (
        <View style={[styles.promo, { backgroundColor: colors.mint50, borderColor: colors.emerald500 }]}>
          <Text style={[type.eyebrow, { color: colors.emerald700 }]}>Mã khuyến mãi</Text>
          <View style={styles.promoRow}>
            <Text style={[styles.code, { color: colors.ink900 }]} selectable numberOfLines={1} adjustsFontSizeToFit>
              {block.code}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Sao chép mã ${block.code}`}
              onPress={async () => {
                try {
                  await Clipboard.setStringAsync(block.code);
                  onCopied?.(block.code);
                } catch {}
              }}
              style={({ pressed }) => [styles.copy, { backgroundColor: pressed ? colors.emerald800 : colors.emerald700 }]}
            >
              <Icon name="copy" size={16} color={colors.onEmerald} />
              <Text style={[type.label, { color: colors.onEmerald }]}>Sao chép</Text>
            </Pressable>
          </View>
          {block.discount || block.description ? (
            <Text style={[type.caption, { color: colors.ink600 }]}>{[block.discount, block.description].filter(Boolean).join(' · ')}</Text>
          ) : null}
          {block.ends_at ? <Text style={[type.caption, { color: colors.ink600 }]}>Hạn dùng đến {dmy(block.ends_at)}</Text> : null}
          {block.note ? <Text style={[type.caption, { color: colors.ink600 }]}>{block.note}</Text> : null}
        </View>
      );
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  wrap: { gap: 22 },
  grow: { flex: 1, minWidth: 0 },
  center: { textAlign: 'center' },
  heading: { marginBottom: -8 },
  paras: { gap: 12 },
  list: { gap: 12 },
  stepRow: { flexDirection: 'row', gap: 12 },
  stepRail: { alignItems: 'center', width: 28 },
  num: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  numText: { fontFamily: fonts.display600, fontSize: 14, lineHeight: 18 },
  stepLine: { flex: 1, width: 2, marginTop: 4, marginBottom: -8, borderRadius: 1 },
  stepText: { paddingTop: 2, paddingBottom: 6 },
  bulletRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  tick: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  figure: { gap: 8 },
  image: { width: '100%', aspectRatio: 16 / 9, borderRadius: 18 },
  callout: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  promo: { gap: 8, padding: 16, borderRadius: 18, borderWidth: 1.5, borderStyle: 'dashed' },
  promoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  code: { flex: 1, minWidth: 0, fontFamily: fonts.display700, fontSize: 24, lineHeight: 32, letterSpacing: 2 },
  copy: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 40, borderRadius: 12 },
});
