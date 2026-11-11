import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { BOTTOM_BAR_SPACE } from '@/components/BottomBar';
import { SubHeader } from '@/components/documents/SubHeader';
import { apiMyCoursesSplit, type ContinueCourse } from '@/data/learning';
import { normalize } from '@/data/documents';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/typography';

import { ContinueCard } from './ContinueCourses';
import { ProgressCardBones } from '@/components/skeletons';

/**
 * Khoá học của tôi (/courses/mine, mở từ nút cạnh nút tìm kiếm ở tab Khoá học):
 * Đang học (đã mua / được cấp, hoặc miễn phí đã học ≥ 1 bài; gần nhất trước) · Đã hoàn thành (mới xong trước).
 * Bấm khoá → bản đồ lộ trình. Tải lại mỗi lần mở màn.
 */
export function MyCoursesScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [data, setData] = useState<{ learning: ContinueCourse[]; completed: ContinueCourse[] } | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  const load = useCallback(() => {
    if (!token) return;
    setFailed(false);
    apiMyCoursesSplit(token)
      .then(setData)
      .catch(() => setFailed(true));
  }, [token]);

  useFocusEffect(load);

  const match = useCallback((c: ContinueCourse) => !query.trim() || normalize(c.title).includes(normalize(query)), [query]);
  const learning = useMemo(() => data?.learning.filter(match) ?? [], [data, match]);
  const completed = useMemo(() => data?.completed.filter(match) ?? [], [data, match]);
  const searching = query.trim().length > 0;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <SubHeader
        title="Khoá học của tôi"
        searchOpen={searchOpen}
        onToggleSearch={() => setSearchOpen((v) => !v)}
        query={query}
        onQuery={setQuery}
        placeholder="Tìm trong khoá học của tôi"
        scrolled={scrollY > 4}
      />

      {!data && !failed ? (
        <View style={styles.section}>
          <Text accessibilityRole="header" style={[type.h2, { color: colors.ink900 }]}>
            Đang học
          </Text>
          <ProgressCardBones count={3} />
        </View>
      ) : !data ? (
        <View style={styles.center}>
          <Pressable accessibilityRole="button" onPress={load}>
            <Text style={[type.label, { color: colors.emerald700 }]}>Không tải được. Bấm để thử lại</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          scrollEventThrottle={16}
          onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: BOTTOM_BAR_SPACE + insets.bottom + 16 }}
        >
          <Group title="Đang học" count={learning.length}>
            {learning.map((c) => (
              <ContinueCard key={c.id} course={c} />
            ))}
            {learning.length === 0 && (
              <View style={styles.empty}>
                <Text style={[type.caption, styles.emptyText, { color: colors.ink600 }]}>
                  {searching ? 'Không tìm thấy khoá đang học.' : 'Bạn chưa có khoá học nào đang học.'}
                </Text>
                {!searching && (
                  <Pressable accessibilityRole="link" onPress={() => router.navigate('/courses')} hitSlop={8}>
                    <Text style={[type.label, { color: colors.emerald700 }]}>Khám phá khoá học</Text>
                  </Pressable>
                )}
              </View>
            )}
          </Group>

          <Group title="Đã hoàn thành" count={completed.length}>
            {completed.map((c) => (
              <ContinueCard key={c.id} course={c} />
            ))}
            {completed.length === 0 && (
              <Text style={[type.caption, styles.emptyText, { color: colors.ink600 }]}>
                {searching ? 'Không tìm thấy khoá đã hoàn thành.' : 'Khoá học bạn học xong sẽ nằm ở đây.'}
              </Text>
            )}
          </Group>
        </ScrollView>
      )}
    </View>
  );
}

function Group({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={[type.h2, { color: colors.ink900 }]}>
        {title}
        {count > 0 ? <Text style={[styles.count, { color: colors.ink600 }]}> {count}</Text> : null}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  section: { paddingTop: 28, paddingHorizontal: 16, gap: 12 },
  count: { fontFamily: fonts.sans500, fontSize: 14 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 12 },
  emptyText: { textAlign: 'center', paddingVertical: 8 },
});
