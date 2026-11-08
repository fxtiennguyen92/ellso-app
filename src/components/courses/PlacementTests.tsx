import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, type ScrollViewInstance, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { PrimaryButton, SecondaryButton } from '@/components/auth/AuthUI';
import { BottomSheet } from '@/components/BottomSheet';
import { Icon } from '@/components/Icon';
import type { PlacementTestSummary } from '@/data/placement';
import { useDragScroll } from '@/hooks/useDragScroll';
import { useTheme } from '@/theme/ThemeProvider';
import { illo } from '@/theme/tokens';
import { fonts, type } from '@/theme/typography';

/** Bảng màu thẻ: chưa làm = vàng → cam (màu bài test cũ), đã làm = xanh lá. Cố định cho cả 2 chế độ sáng / tối. */
const TONES = {
  todo: { top: illo.ptTop, bottom: illo.ptBottom, edge: illo.ptEdge, ink: illo.ptInk, muted: illo.ptInkMuted, cta: illo.ptInk, ctaText: '#ffffff' },
  done: { top: '#6ee7b7', bottom: '#10b981', edge: '#047857', ink: '#022c22', muted: 'rgba(2,44,34,0.75)', cta: '#ffffff', ctaText: '#047857' },
};

const CARD_W = 248;

/**
 * Mục "Bài test đầu vào" ở tab Khoá học: các bài nằm ngang (vuốt / kéo chuột), mỗi bài một thẻ bấm được.
 * Đã làm → thẻ xanh "Đã hoàn thành", bấm mở kết quả. Chưa làm → bấm hỏi xác nhận (số câu, thời gian ước tính) rồi mới vào làm.
 */
export function PlacementTests({ tests }: { tests: PlacementTestSummary[] }) {
  const { colors } = useTheme();
  const [confirm, setConfirm] = useState<PlacementTestSummary | null>(null);
  const rowRef = useRef<ScrollViewInstance>(null);
  useDragScroll(rowRef);

  if (tests.length === 0) return null;
  const done = tests.filter((t) => t.completed).length;
  const single = tests.length === 1;

  const press = (t: PlacementTestSummary) =>
    t.completed ? router.push({ pathname: '/placement-tests/[id]/result', params: { id: String(t.id) } }) : setConfirm(t);

  const start = () => {
    if (!confirm) return;
    const id = String(confirm.id);
    setConfirm(null);
    setTimeout(() => router.push({ pathname: '/placement-tests/[id]', params: { id } }), 220);
  };

  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <Text accessibilityRole="header" style={[type.h2, styles.grow, { color: colors.ink900 }]}>
          Bài test đầu vào
        </Text>
        <View style={[styles.progress, { backgroundColor: done === tests.length ? colors.mint50 : colors.surfaceAlt }]}>
          {done === tests.length ? <Icon name="check" size={13} strokeWidth={3} color={colors.emerald700} /> : null}
          <Text style={[type.captionStrong, { color: done === tests.length ? colors.emerald700 : colors.ink600 }]}>
            Đã làm {done}/{tests.length}
          </Text>
        </View>
      </View>

      <ScrollView
        ref={rowRef}
        horizontal
        scrollEnabled={!single}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.row, single && styles.rowSingle]}
        snapToInterval={single ? undefined : CARD_W + 12}
        decelerationRate="fast"
      >
        {tests.map((t) => (
          <TestCard key={t.id} test={t} wide={single} onPress={() => press(t)} />
        ))}
      </ScrollView>

      <BottomSheet visible={!!confirm} onClose={() => setConfirm(null)} title="Bắt đầu làm bài?">
        {confirm ? (
          <View style={styles.sheet}>
            <Text style={[styles.sheetTitle, { color: colors.ink900 }]}>{confirm.title}</Text>
            {confirm.intro ? <Text style={[type.body, { color: colors.ink600 }]}>{confirm.intro}</Text> : null}
            <View style={styles.facts}>
              <Fact icon="clock" label="Thời gian cần" value={`khoảng ${confirm.minutes} phút`} />
              <Fact icon="help" label="Số câu hỏi" value={`${confirm.questionCount} câu`} />
            </View>
            <Text style={[type.caption, { color: colors.ink600 }]}>Bạn nên làm liền một lượt. Thoát giữa chừng thì phải làm lại từ đầu.</Text>
            <View style={styles.actions}>
              <View style={styles.cancel}>
                <SecondaryButton label="Để sau" onPress={() => setConfirm(null)} />
              </View>
              <View style={styles.grow}>
                <PrimaryButton label="Bắt đầu" icon="play" onPress={start} />
              </View>
            </View>
          </View>
        ) : null}
      </BottomSheet>
    </View>
  );
}

function Fact({ icon, label, value }: { icon: 'clock' | 'help'; label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.fact, { backgroundColor: colors.surfaceAlt }]}>
      <Icon name={icon} size={18} color={colors.emerald700} />
      <View style={styles.grow}>
        <Text style={[type.caption, { color: colors.ink600 }]}>{label}</Text>
        <Text style={[type.label, { color: colors.ink900 }]}>{value}</Text>
      </View>
    </View>
  );
}

function TestCard({ test, wide, onPress }: { test: PlacementTestSummary; wide: boolean; onPress: () => void }) {
  const t = test.completed ? TONES.done : TONES.todo;
  const gid = `pt-${test.id}-${test.completed ? 'd' : 't'}`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${test.title}. ${test.completed ? 'Đã hoàn thành, xem kết quả' : `${test.questionCount} câu, khoảng ${test.minutes} phút. Làm bài`}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        wide ? styles.cardWide : { width: CARD_W },
        { boxShadow: `0px ${pressed ? 2 : 5}px 0px ${t.edge}`, transform: [{ translateY: pressed ? 3 : 0 }] },
      ]}
    >
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={t.top} />
            <Stop offset="1" stopColor={t.bottom} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${gid})`} />
      </Svg>
      <Svg width={150} height={150} style={styles.rings} pointerEvents="none">
        {[34, 54, 74].map((r) => (
          <Circle key={r} cx={110} cy={40} r={r} stroke="#ffffff" strokeOpacity={0.35} strokeWidth={1.4} fill="none" />
        ))}
      </Svg>
      <View style={styles.cardIcon} pointerEvents="none">
        <Icon name={test.completed ? 'checkCircle' : 'clipboard'} size={44} strokeWidth={1.6} color="#ffffff" duotone />
      </View>

      <View style={styles.cardBody}>
        <View style={styles.eyebrow}>
          <Icon name={test.completed ? 'check' : 'target'} size={13} strokeWidth={2.6} color={t.ink} />
          <Text style={[type.eyebrow, { color: t.ink }]}>{test.completed ? 'Đã hoàn thành' : 'Chưa làm'}</Text>
        </View>
        <Text style={[styles.cardTitle, { color: t.ink }]} numberOfLines={2}>
          {test.title}
        </Text>
        <View style={styles.cardFoot}>
          <Text style={[styles.meta, { color: t.muted }]} numberOfLines={1}>
            {test.questionCount} câu · ~{test.minutes} phút
          </Text>
          <View style={[styles.cta, { backgroundColor: t.cta }]}>
            <Text style={[styles.ctaText, { color: t.ctaText }]}>{test.completed ? 'Xem kết quả' : 'Làm bài'}</Text>
            <Icon name="chevronRight" size={15} strokeWidth={2.6} color={t.ctaText} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  section: { gap: 12, paddingTop: 8 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16 },
  progress: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, height: 26, borderRadius: 9999 },
  row: { gap: 12, paddingHorizontal: 16, paddingTop: 2, paddingBottom: 8 },
  rowSingle: { flexGrow: 1 },
  card: { height: 156, borderRadius: 22, overflow: 'hidden' },
  cardWide: { flex: 1 },
  rings: { position: 'absolute', top: -20, right: -30 },
  cardIcon: { position: 'absolute', top: 16, right: 16, transform: [{ rotate: '8deg' }] },
  cardBody: { flex: 1, padding: 16, paddingRight: 18, justifyContent: 'space-between', zIndex: 1 },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardTitle: { fontFamily: fonts.display600, fontSize: 17, lineHeight: 23, marginRight: 52 },
  cardFoot: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  meta: { flex: 1, minWidth: 0, fontFamily: fonts.sans600, fontSize: 12, lineHeight: 16 },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingLeft: 12, paddingRight: 8, height: 32, borderRadius: 9999 },
  ctaText: { fontFamily: fonts.sans700, fontSize: 13, lineHeight: 18 },
  sheet: { gap: 14 },
  sheetTitle: { fontFamily: fonts.display600, fontSize: 18, lineHeight: 26 },
  facts: { flexDirection: 'row', gap: 10 },
  fact: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  cancel: { width: '38%' },
});
