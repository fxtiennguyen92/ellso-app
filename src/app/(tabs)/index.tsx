import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Platform, RefreshControl, ScrollView, type ScrollViewInstance, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BOTTOM_BAR_SPACE } from '@/components/BottomBar';
import { CampaignCarousel } from '@/components/home/CampaignCarousel';
import { HomeBooks } from '@/components/home/HomeBooks';
import { HomeHeader, SEARCH_HEIGHT } from '@/components/home/HomeHeader';
import { TrainingSchedule } from '@/components/home/TrainingSchedule';
import { TrainingSheet } from '@/components/home/TrainingSheet';
import { WorkshopSchedule } from '@/components/home/WorkshopSchedule';
import { useAuth } from '@/auth/AuthProvider';
import { cachedHomeFeed, emptyFeed, type HomeFeed, type HomeTraining, loadHomeFeed } from '@/data/home';
import { LoopScope } from '@/hooks/LoopScope';
import { PULL_TRIGGER, usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/typography';

/**
 * Home: Khuyến mãi (carousel) → Chương trình huấn luyện → Workshop → Sách. Dữ liệu thật từ API (src/data/home.ts):
 * hiện ngay bản đã tải trước lúc splash, rồi làm mới; kéo xuống để tải lại. Mục nào trống thì ẩn.
 */
export default function HomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, token } = useAuth();
  const student = { name: user?.name ?? 'bạn', initials: user?.initials ?? 'E', avatar: user?.avatar, unreadNotifications: 0 };

  const [feed, setFeed] = useState<HomeFeed>(() => cachedHomeFeed(token) ?? emptyFeed);
  const [loaded, setLoaded] = useState(() => cachedHomeFeed(token) !== null);
  const [refreshing, setRefreshing] = useState(false);
  const [openTraining, setOpenTraining] = useState<HomeTraining | null>(null);

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

  const [scrolled, setScrolled] = useState(false);
  const scrollRef = useRef<ScrollViewInstance>(null);
  // Web: kéo xuống để làm mới (native dùng RefreshControl)
  const webPull = usePullToRefresh(scrollRef, refresh);

  // Khoảng trống trên cùng của hero. Native: dưới status bar thật; web (không có status bar): 28px.
  const topInset = Platform.OS === 'web' ? 28 : insets.top + 12;
  // Hero cao bao nhiêu thì nội dung bắt đầu ngay dưới ô tìm kiếm (ô này đè nửa dưới mép hero)
  const [heroH, setHeroH] = useState(180);
  const contentTop = heroH + SEARCH_HEIGHT / 2 + 12;
  // iOS: vòng làm mới nằm ngay trên mép nội dung → dùng contentInset (thay vì paddingTop) để nó hiện dưới ô tìm kiếm,
  // không bị hero che. Android dùng progressViewOffset, web có chỉ báo riêng.
  const ios = Platform.OS === 'ios';
  useEffect(() => {
    if (ios && !scrolled) scrollRef.current?.scrollTo({ y: -contentTop, animated: false });
  }, [ios, contentTop]); // eslint-disable-line react-hooks/exhaustive-deps -- chỉ khi hero đổi cao
  const empty = !feed.campaigns.length && !feed.trainings.length && !feed.workshops.length && !feed.books.length;

  return (
    <LoopScope>
      <View style={[styles.screen, { backgroundColor: colors.bg }]}>
        <View style={styles.body}>
          {Platform.OS === 'web' && (
            // Chỉ báo kéo-để-làm-mới trên web: hiện dần theo khoảng kéo
            <Animated.View
              pointerEvents="none"
              style={[
                styles.pullIndicator,
                {
                  top: contentTop,
                  opacity: webPull.pull.interpolate({ inputRange: [0, PULL_TRIGGER * 0.4, PULL_TRIGGER], outputRange: [0, 0.4, 1], extrapolate: 'clamp' }),
                },
              ]}
            >
              <View style={[styles.pullBadge, { backgroundColor: colors.card, borderColor: colors.line, boxShadow: colors.shadowCard }]}>
                <ActivityIndicator size="small" color={colors.emerald700} animating />
              </View>
            </Animated.View>
          )}
          <Animated.View style={[styles.screen, Platform.OS === 'web' && { transform: [{ translateY: webPull.pull }] }]}>
            <ScrollView
              ref={scrollRef}
              scrollEventThrottle={16}
              onScroll={(e) => setScrolled(e.nativeEvent.contentOffset.y + (ios ? contentTop : 0) > 4)}
              contentInset={ios ? { top: contentTop } : undefined}
              contentOffset={ios ? { x: 0, y: -contentTop } : undefined}
              scrollIndicatorInsets={ios ? { top: contentTop } : undefined}
              contentContainerStyle={{ paddingTop: ios ? 0 : contentTop, paddingBottom: BOTTOM_BAR_SPACE + insets.bottom + 16 }}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onPull} tintColor={colors.emerald700} colors={[colors.emerald700]} progressViewOffset={contentTop} />}
            >
              {feed.failed && (
                <Text style={[styles.notice, { color: colors.ink600, backgroundColor: colors.card, borderColor: colors.line }]}>
                  Một số mục chưa tải được. Kéo xuống để thử lại.
                </Text>
              )}
              <CampaignCarousel campaigns={feed.campaigns} />
              <TrainingSchedule trainings={feed.trainings} onOpen={setOpenTraining} />
              <WorkshopSchedule workshops={feed.workshops} />
              <HomeBooks books={feed.books} />
              {loaded && empty && !feed.failed && (
                <Text style={[styles.empty, { color: colors.ink600 }]}>Chưa có khuyến mãi hay lịch sắp tới. Quay lại sau nhé!</Text>
              )}
            </ScrollView>
          </Animated.View>
        </View>

        {/* Hero + ô tìm kiếm phủ lên trên; nội dung cuộn trượt vào bên dưới (không có dải nền / đường kẻ ngăn) */}
        <HomeHeader student={student} tagline={feed.tagline} scrolled={scrolled} topInset={topInset} onHeroHeight={setHeroH} />

        <TrainingSheet training={openTraining} onClose={() => setOpenTraining(null)} onChanged={refresh} />
      </View>
    </LoopScope>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { flex: 1, overflow: 'hidden' },
  pullIndicator: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  pullBadge: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  notice: { marginHorizontal: 16, marginBottom: 12, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, fontFamily: fonts.sans500, fontSize: 13 },
  empty: { paddingTop: 48, paddingHorizontal: 32, textAlign: 'center', fontFamily: fonts.sans500, fontSize: 14 },
});
