import { useCallback, useEffect, useState } from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BOTTOM_BAR_SPACE } from '@/components/BottomBar';
import { CampaignCarousel } from '@/components/home/CampaignCarousel';
import { HomeBooks } from '@/components/home/HomeBooks';
import { HomeHeader } from '@/components/home/HomeHeader';
import { TrainingSchedule } from '@/components/home/TrainingSchedule';
import { WorkshopSchedule } from '@/components/home/WorkshopSchedule';
import { useAuth } from '@/auth/AuthProvider';
import { cachedHomeFeed, emptyFeed, type HomeFeed, loadHomeFeed } from '@/data/home';
import { LoopScope } from '@/hooks/LoopScope';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/typography';

/**
 * Home: Khuyến mãi (carousel) → Lịch huấn luyện → Lịch Workshop → Sách. Dữ liệu thật từ API (src/data/home.ts):
 * hiện ngay bản đã tải trước lúc splash, rồi làm mới; kéo xuống để tải lại. Mục nào trống thì ẩn.
 */
export default function HomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, token } = useAuth();
  const student = { name: user?.name ?? 'bạn', initials: user?.initials ?? 'E', unreadNotifications: 0 };

  const [feed, setFeed] = useState<HomeFeed>(() => cachedHomeFeed(token) ?? emptyFeed);
  const [loaded, setLoaded] = useState(() => cachedHomeFeed(token) !== null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      setFeed(await loadHomeFeed(token));
    } catch {
      setFeed((f) => ({ ...f, failed: true }));
    } finally {
      setLoaded(true);
    }
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onPull = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const [headerHeight, setHeaderHeight] = useState(200);
  const [scrolled, setScrolled] = useState(false);

  // Khoảng trống phía trên header. Native: dưới status bar thật 28px; web (không có status bar): 44px.
  const topInset = Platform.OS === 'web' ? 44 : insets.top + 28;
  const empty = !feed.campaigns.length && !feed.trainings.length && !feed.workshops.length && !feed.books.length;

  return (
    <LoopScope>
      <View style={[styles.screen, { backgroundColor: colors.bg }]}>
        <ScrollView
          scrollEventThrottle={16}
          onScroll={(e) => setScrolled(e.nativeEvent.contentOffset.y > 4)}
          contentContainerStyle={{ paddingTop: headerHeight, paddingBottom: BOTTOM_BAR_SPACE + insets.bottom + 16 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onPull} tintColor={colors.emerald700} progressViewOffset={headerHeight} />}
        >
          {feed.failed && (
            <Text style={[styles.notice, { color: colors.ink600, backgroundColor: colors.card, borderColor: colors.line }]}>
              Một số mục chưa tải được. Kéo xuống để thử lại.
            </Text>
          )}
          <CampaignCarousel campaigns={feed.campaigns} />
          <TrainingSchedule trainings={feed.trainings} />
          <WorkshopSchedule workshops={feed.workshops} />
          <HomeBooks books={feed.books} />
          {loaded && empty && !feed.failed && (
            <Text style={[styles.empty, { color: colors.ink600 }]}>Chưa có khuyến mãi hay lịch sắp tới. Quay lại sau nhé!</Text>
          )}
        </ScrollView>

        <HomeHeader student={student} scrolled={scrolled} topInset={topInset} onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)} />
      </View>
    </LoopScope>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  notice: { marginHorizontal: 16, marginBottom: 12, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, fontFamily: fonts.sans500, fontSize: 13 },
  empty: { paddingTop: 48, paddingHorizontal: 32, textAlign: 'center', fontFamily: fonts.sans500, fontSize: 14 },
});
