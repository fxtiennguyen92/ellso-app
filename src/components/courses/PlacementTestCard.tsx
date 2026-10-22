import { router } from 'expo-router';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { Icon } from '@/components/Icon';
import { placementTest } from '@/data/courses';
import { useLoop } from '@/hooks/useLoop';
import { illo } from '@/theme/tokens';
import { fonts, type } from '@/theme/typography';

/**
 * Banner "Bài test đầu vào" ở đầu tab Khoá học (ngay dưới ô tìm kiếm).
 * Màu tươi (vàng → cam) cố định cho cả 2 chế độ. Bấm → /placement-test (tạm ComingSoon).
 */
export function PlacementTestCard() {
  const drift = useLoop(6000);

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`Bài test đầu vào. Đánh giá năng lực hiện tại, cùng tìm lộ trình phát triển phù hợp. ${placementTest.minutes} phút, ${placementTest.questions} câu. Làm bài test`}
      onPress={() => router.push('/placement-test')}
      style={({ pressed }) => [
        styles.card,
        { boxShadow: `0px ${pressed ? 2 : 6}px 0px ${illo.ptEdge}`, transform: [{ translateY: pressed ? 4 : 0 }] },
      ]}
    >
      {/* Nền chuyển màu */}
      <Svg width="100%" height="100%" style={styles.fill} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="ptBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={illo.ptTop} />
            <Stop offset="1" stopColor={illo.ptBottom} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#ptBg)" />
      </Svg>

      {/* Vòng trang trí trôi nhẹ */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ring,
          {
            transform: [
              { translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) },
              { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [0, 8] }) },
            ],
          },
        ]}
      />
      <View pointerEvents="none" style={styles.dot} />

      <View pointerEvents="none" style={styles.art}>
        <Clipboard />
      </View>

      {/* Nội dung — zIndex để nằm trên các lớp absolute ở web */}
      <View style={styles.content}>
        <View style={styles.eyebrow}>
          <Icon name="target" size={14} strokeWidth={2.2} color={illo.ptInk} />
          <Text style={[type.eyebrow, { color: illo.ptInk }]}>Bài test đầu vào</Text>
        </View>
        <Text style={styles.title}>Đánh giá năng lực hiện tại</Text>
        <Text style={styles.desc}>Cùng tìm lộ trình phát triển phù hợp với bạn.</Text>

        <View style={styles.footer}>
          <View style={styles.meta}>
            <Icon name="clock" size={13} strokeWidth={2.2} color={illo.ptInk} />
            <Text style={styles.metaText}>
              {placementTest.minutes} phút · {placementTest.questions} câu
            </Text>
          </View>
          <View style={styles.cta}>
            <Text style={styles.ctaText}>Làm bài test</Text>
            <Icon name="chevronRight" size={16} strokeWidth={2.4} color="#ffffff" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const ROWS = [0, 1, 2];

/** Bảng câu hỏi: nhún nhẹ, 3 dấu tích lần lượt hiện ra rồi lặp lại; 2 tia sáng lấp lánh. */
function Clipboard() {
  const bob = useLoop(2600);
  const tick = useLoop(3200, { kind: 'forward' });
  const twinkle = useLoop(1600);
  const twinkle2 = useLoop(1600, { delay: 800 });

  return (
    <Animated.View style={{ transform: [{ translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }, { rotate: '6deg' }] }}>
      <View style={styles.board}>
        <View style={styles.clip} />
        {ROWS.map((i) => {
          // Tích thứ i hiện trong khoảng [0.12 + 0.2i, 0.22 + 0.2i], tất cả mờ đi ở cuối chu kỳ
          const a = 0.12 + i * 0.2;
          const show = tick.interpolate({ inputRange: [0, a, a + 0.1, 0.88, 1], outputRange: [0, 0, 1, 1, 0], extrapolate: 'clamp' });
          const pop = tick.interpolate({ inputRange: [0, a, a + 0.06, a + 0.1, 1], outputRange: [0.4, 0.4, 1.25, 1, 1], extrapolate: 'clamp' });
          return (
            <View key={i} style={styles.row}>
              <View style={styles.box}>
                <Animated.View style={[styles.boxOn, { opacity: show, transform: [{ scale: pop }] }]}>
                  <Icon name="check" size={11} strokeWidth={3.2} color="#ffffff" />
                </Animated.View>
              </View>
              <View style={[styles.line, { width: i === 1 ? 30 : 40 }]} />
            </View>
          );
        })}
      </View>

      <Animated.View style={[styles.spark, { top: -10, right: -14, opacity: twinkle, transform: [{ scale: twinkle.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.1] }) }] }]}>
        <Sparkle size={22} />
      </Animated.View>
      <Animated.View style={[styles.spark, { bottom: 6, left: -16, opacity: twinkle2, transform: [{ scale: twinkle2.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }] }]}>
        <Sparkle size={16} />
      </Animated.View>
    </Animated.View>
  );
}

function Sparkle({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0Z" fill="#ffffff" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 176, borderRadius: 24, overflow: 'hidden', backgroundColor: illo.ptBottom },
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  ring: { position: 'absolute', right: -40, top: -50, width: 170, height: 170, borderRadius: 85, borderWidth: 22, borderColor: illo.ptDeco },
  dot: { position: 'absolute', right: 92, bottom: -26, width: 60, height: 60, borderRadius: 30, backgroundColor: illo.ptDeco },
  art: { position: 'absolute', right: 26, top: 30 },
  content: { position: 'relative', zIndex: 1, padding: 20, paddingRight: 130, gap: 6 },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { color: illo.ptInk, fontFamily: fonts.display700, fontSize: 21, lineHeight: 27 },
  desc: { color: illo.ptInkMuted, fontFamily: fonts.sans500, fontSize: 13, lineHeight: 19 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, marginRight: -110 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 30, paddingHorizontal: 10, borderRadius: 9999, backgroundColor: illo.ptChip },
  metaText: { color: illo.ptInk, fontFamily: fonts.sans600, fontSize: 12, lineHeight: 16 },
  cta: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 2, height: 38, paddingLeft: 16, paddingRight: 12, borderRadius: 9999, backgroundColor: illo.ptInk },
  ctaText: { color: '#ffffff', fontFamily: fonts.sans700, fontSize: 14, lineHeight: 20 },

  board: { width: 84, height: 100, borderRadius: 14, backgroundColor: '#ffffff', paddingTop: 24, paddingHorizontal: 12, gap: 12, boxShadow: `0px 5px 0px ${illo.ptEdge}` },
  clip: { position: 'absolute', top: -7, left: 26, width: 32, height: 14, borderRadius: 5, backgroundColor: illo.ptInk },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  box: { width: 16, height: 16, borderRadius: 5, borderWidth: 2, borderColor: illo.ptLine, alignItems: 'center', justifyContent: 'center' },
  boxOn: { position: 'absolute', top: -2, left: -2, width: 16, height: 16, borderRadius: 5, backgroundColor: illo.ptCheck, alignItems: 'center', justifyContent: 'center' },
  line: { height: 6, borderRadius: 3, backgroundColor: illo.ptLine },
  spark: { position: 'absolute' },
});