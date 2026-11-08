import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useAuth } from '@/auth/AuthProvider';
import { CourseCover } from '@/components/courses/CourseCover';
import { Icon } from '@/components/Icon';
import { SubpageHeader } from '@/components/SubpageHeader';
import { apiPlacementResult, type PlacementResult } from '@/data/placement';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/typography';

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
};

/**
 * Kết quả bài kiểm tra đầu vào (chỉ xem): khối đầu chuyển màu xanh (thông tin — phẳng, không bóng / mép 3D),
 * từng năng lực = hàng phẳng có mức + thanh % chạy lên, khoá học gợi ý. Mở từ thẻ "Đã hoàn thành" hoặc ngay sau khi nộp bài.
 */
export function PlacementResultScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { id, fresh } = useLocalSearchParams<{ id: string; fresh?: string }>();
  const { token } = useAuth();
  const [result, setResult] = useState<PlacementResult | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'none' | 'error'>('loading');
  const [scrolled, setScrolled] = useState(false);
  const grow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!token || !id) return;
    apiPlacementResult(token, id)
      .then((r) => {
        setResult(r);
        setState(r ? 'ready' : 'none');
        Animated.timing(grow, { toValue: 1, duration: 900, delay: 200, useNativeDriver: false }).start();
      })
      .catch(() => setState('error'));
  }, [token, id, grow]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <SubpageHeader title="Kết quả bài test" scrolled={scrolled} fallback="/courses" />
      {state !== 'ready' || !result ? (
        <View style={styles.center}>
          {state === 'loading' ? (
            <ActivityIndicator color={colors.emerald700} />
          ) : (
            <Text style={[type.body, { color: colors.ink600, textAlign: 'center' }]}>
              {state === 'none' ? 'Bạn chưa làm bài kiểm tra này.' : 'Không tải được kết quả, thử lại sau.'}
            </Text>
          )}
        </View>
      ) : (
        <ScrollView
          scrollEventThrottle={16}
          onScroll={(e) => setScrolled(e.nativeEvent.contentOffset.y > 4)}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Khối đầu: thông tin (phẳng) nhưng có điểm nhấn: nền chuyển màu + vòng tròn + icon lớn */}
          <View style={styles.hero}>
            <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} preserveAspectRatio="none">
              <Defs>
                <LinearGradient id="ptResult" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#10b981" />
                  <Stop offset="1" stopColor="#047857" />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#ptResult)" />
            </Svg>
            <Svg width={180} height={180} style={styles.heroRings} pointerEvents="none">
              {[40, 64, 88].map((r) => (
                <Circle key={r} cx={130} cy={50} r={r} stroke="#ffffff" strokeOpacity={0.18} strokeWidth={1.4} fill="none" />
              ))}
            </Svg>
            <View style={styles.heroIcon} pointerEvents="none">
              <Icon name="checkCircle" size={52} strokeWidth={1.6} color="#ffffff" duotone />
            </View>
            <Text style={styles.heroEyebrow}>{fresh ? 'BẠN ĐÃ HOÀN THÀNH' : 'ĐÃ HOÀN THÀNH'}</Text>
            <Text style={styles.heroTitle} numberOfLines={3}>
              {result.testTitle ?? 'Bài kiểm tra đầu vào'}
            </Text>
            <View style={styles.heroDate}>
              <Icon name="calendarEnd" size={14} strokeWidth={2.2} color="#ecfdf5" />
              <Text style={styles.heroDateText}>Ngày làm: {fmtDate(result.completedAt)}</Text>
            </View>
          </View>

          {/* Năng lực */}
          {result.dimensions.length > 0 && (
            <View style={styles.section}>
              <Text accessibilityRole="header" style={[type.h2, { color: colors.ink900 }]}>
                Năng lực của bạn
              </Text>
              <View>
                {result.dimensions.map((d, i) => {
                  const pct = Math.max(0, Math.min(100, Math.round(d.percent ?? 0)));
                  return (
                    <View key={d.id} style={[styles.dim, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line }]}>
                      <View style={styles.dimHead}>
                        <Text style={[styles.dimName, { color: colors.ink900 }]}>{d.name}</Text>
                        {d.level ? (
                          <View style={[styles.level, { backgroundColor: colors.mint50 }]}>
                            <Text style={[type.chip, { color: colors.emerald700 }]}>{d.level.name}</Text>
                          </View>
                        ) : null}
                      </View>
                      <View style={styles.barRow}>
                        <View style={[styles.track, { backgroundColor: colors.surfaceAlt }]}>
                          <Animated.View
                            style={[
                              styles.fill,
                              { backgroundColor: colors.emerald500, width: grow.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${pct}%`] }) },
                            ]}
                          />
                        </View>
                        <Text style={[styles.pct, { color: colors.emerald700 }]}>{pct}%</Text>
                      </View>
                      {d.level?.description || d.description ? (
                        <Text style={[type.caption, { color: colors.ink600 }]}>{d.level?.description ?? d.description}</Text>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Khoá học gợi ý */}
          {result.recommendedCourses.length > 0 && (
            <View style={styles.section}>
              <Text accessibilityRole="header" style={[type.h2, { color: colors.ink900 }]}>
                Khoá học gợi ý cho bạn
              </Text>
              <View>
                {result.recommendedCourses.map((c, i) => (
                  <View key={c.id} style={[styles.course, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line }]}>
                    <View style={styles.courseThumb}>
                      <CourseCover id={c.id} coverUrl={c.coverUrl} iconSize={28} />
                    </View>
                    <View style={styles.grow}>
                      <Text style={[styles.courseTitle, { color: colors.ink900 }]} numberOfLines={2}>
                        {c.title}
                      </Text>
                      {c.shortDescription ? (
                        <Text style={[type.caption, { color: colors.ink600 }]} numberOfLines={2}>
                          {c.shortDescription}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  content: { paddingHorizontal: 16, paddingTop: 8, gap: 28 },
  hero: { borderRadius: 22, overflow: 'hidden', padding: 20, paddingRight: 90, gap: 6, minHeight: 150 },
  heroRings: { position: 'absolute', top: -30, right: -40 },
  heroIcon: { position: 'absolute', top: 20, right: 20, transform: [{ rotate: '8deg' }] },
  heroEyebrow: { color: '#d1fae5', fontFamily: fonts.sans700, fontSize: 12, lineHeight: 16, letterSpacing: 0.96 },
  heroTitle: { color: '#ffffff', fontFamily: fonts.display600, fontSize: 22, lineHeight: 30 },
  heroDate: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  heroDateText: { color: '#ecfdf5', fontFamily: fonts.sans600, fontSize: 13, lineHeight: 18 },
  section: { gap: 8 },
  dim: { paddingVertical: 14, gap: 8 },
  dimHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dimName: { flex: 1, minWidth: 0, fontFamily: fonts.sans600, fontSize: 15, lineHeight: 22 },
  level: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  track: { flex: 1, height: 8, borderRadius: 9999, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 9999 },
  pct: { width: 42, textAlign: 'right', fontFamily: fonts.sans700, fontSize: 13, lineHeight: 18 },
  course: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  courseThumb: { width: 84, height: 56, borderRadius: 12, overflow: 'hidden' },
  courseTitle: { fontFamily: fonts.display600, fontSize: 15, lineHeight: 21 },
});
