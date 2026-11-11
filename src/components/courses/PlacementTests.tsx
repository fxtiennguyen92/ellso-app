import { router } from 'expo-router';
import { useId, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { PrimaryButton, SecondaryButton } from '@/components/auth/AuthUI';
import { BottomSheet } from '@/components/BottomSheet';
import { Icon } from '@/components/Icon';
import type { PlacementTestSummary } from '@/data/placement';
import { useTheme } from '@/theme/ThemeProvider';
import { illo } from '@/theme/tokens';
import { fonts, type } from '@/theme/typography';
import { TileGridBones } from '@/components/skeletons';

/** Bảng màu thẻ: chưa làm = vàng → cam (màu bài test cũ), đã làm = xanh lá. Cố định cho cả 2 chế độ sáng / tối. */
const TONES = {
  todo: { top: illo.ptTop, bottom: illo.ptBottom, edge: illo.ptEdge, ink: illo.ptInk, muted: illo.ptInkMuted, cta: illo.ptInk, ctaText: '#ffffff' },
  done: { top: '#6ee7b7', bottom: '#10b981', edge: '#047857', ink: '#022c22', muted: 'rgba(2,44,34,0.75)', cta: 'rgba(255,255,255,0.62)', ctaText: '#047857' },
};

/**
 * Mục "Đánh giá năng lực" (bài test đầu vào) ở tab Khoá học: lưới 2 cột, bài chưa làm xếp trước, mỗi bài một thẻ bấm được (icon, tên, nút). Không ghi trạng thái bằng chữ —
 * màu + nút đã nói lên: chưa làm = vàng/cam "Làm thử"; đã làm = xanh "Xem kết quả", bấm mở kết quả. Chưa làm → bấm hỏi xác nhận (số câu, thời gian ước tính) rồi mới vào làm.
 */
/** `tests` = null: đang tải lần đầu → skeleton. */
export function PlacementTests({ tests }: { tests: PlacementTestSummary[] | null }) {
  const { colors } = useTheme();
  const [confirm, setConfirm] = useState<PlacementTestSummary | null>(null);
  if (tests === null)
    return (
      <View style={styles.section}>
        <View style={styles.title}>
          <Text accessibilityRole="header" style={[type.h2, { color: colors.ink900 }]}>
            Đánh giá năng lực
          </Text>
          <Text style={[type.caption, { color: colors.ink600 }]}>Đánh giá năng lực hiện tại của bạn qua các bài kiểm tra ngắn</Text>
        </View>
        <TileGridBones count={2} />
      </View>
    );
  if (tests.length === 0) return null;
  // Bài chưa làm lên trước, bài đã hoàn thành xuống sau (giữ thứ tự CMS trong từng nhóm)
  const ordered = [...tests.filter((t) => !t.completed), ...tests.filter((t) => t.completed)];

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
      <View style={styles.title}>
        <Text accessibilityRole="header" style={[type.h2, { color: colors.ink900 }]}>
          Đánh giá năng lực
        </Text>
        <Text style={[type.caption, { color: colors.ink600 }]}>Đánh giá năng lực hiện tại của bạn qua các bài kiểm tra ngắn</Text>
      </View>

      {/* Lưới 2 cột, xuống hàng (không cuộn ngang) */}
      <View style={styles.grid}>
        {ordered.map((t) => (
          <View key={t.id} style={styles.cell}>
            <TestCard test={t} onPress={() => press(t)} />
          </View>
        ))}
      </View>

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

function TestCard({ test, onPress }: { test: PlacementTestSummary; onPress: () => void }) {
  const t = test.completed ? TONES.done : TONES.todo;
  // id gradient duy nhất theo từng lần mount (web: trùng id giữa các màn ẩn/hiện làm mất nền khi quay lại tab)
  const gid = `pt-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}-${test.completed ? 'd' : 't'}`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${test.title}. ${test.completed ? 'Đã hoàn thành, xem kết quả' : 'Chưa làm, bấm để làm thử'}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        // Nền màu đặc phía dưới gradient: SVG chưa vẽ / bị trình duyệt bỏ thì thẻ vẫn có màu
        { backgroundColor: t.bottom },
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

      <View style={styles.cardBody}>
        <View style={[styles.iconChip, { backgroundColor: 'rgba(255,255,255,0.32)' }]}>
          <Icon name={test.completed ? 'trophy' : 'clipboard'} size={22} strokeWidth={2} color={t.ink} />
        </View>
        <Text style={[styles.cardTitle, { color: t.ink }]} numberOfLines={3}>
          {test.title}
        </Text>
        <View style={[styles.cta, { backgroundColor: t.cta }]}>
          <Text style={[styles.ctaText, { color: t.ctaText }]} numberOfLines={1}>
            {test.completed ? 'Xem kết quả' : 'Làm thử'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  section: { gap: 12, paddingTop: 8, paddingHorizontal: 16 },
  title: { gap: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6, rowGap: 14 },
  cell: { width: '50%', paddingHorizontal: 6, paddingBottom: 4 },
  card: { flex: 1, minHeight: 168, borderRadius: 20, overflow: 'hidden' },
  cardBody: { flex: 1, padding: 14, gap: 10, zIndex: 1 },
  iconChip: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { flex: 1, fontFamily: fonts.display600, fontSize: 15, lineHeight: 21 },
  cta: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, height: 32, borderRadius: 9999 },
  ctaText: { fontFamily: fonts.sans500, fontSize: 13, lineHeight: 18 },
  sheet: { gap: 14 },
  sheetTitle: { fontFamily: fonts.display600, fontSize: 18, lineHeight: 26 },
  facts: { flexDirection: 'row', gap: 10 },
  fact: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  cancel: { width: '38%' },
});
