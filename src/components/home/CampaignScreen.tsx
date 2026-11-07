import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/auth/AuthUI';
import { ContentBlocks, RichText } from '@/components/content/ContentBlocks';
import { FloatingAction, floatingActionSpace } from '@/components/FloatingAction';
import { Icon } from '@/components/Icon';
import { useToast } from '@/components/Toast';
import { type CampaignDetail, loadCampaign } from '@/data/home';
import { daysUntil, dmy } from '@/data/profile';
import { WEB_MAX_WIDTH } from '@/theme/tokens';
import { NATIVE_DRIVER } from '@/hooks/useLoop';
import { ApiError } from '@/lib/api';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/typography';

/**
 * Khuyến mãi › chi tiết (/campaign/[id], GET /v1/campaigns/{id}) — bám "Xem trước trên app" ở CMS:
 * - Banner 16:9 tràn viền lên tận status bar (kéo quá đầu thì phóng to), nút quay lại kính mờ.
 * - Khối nội dung bo tròn đè lên mép dưới banner: nhãn "Khuyến mãi", tiêu đề, thời hạn (còn n ngày), tóm tắt,
 *   rồi các khối CMS (ContentBlocks: các bước, điều kiện, mã khuyến mãi có nút Sao chép…).
 * - Cuộn qua banner: thanh trên cùng hiện nền + tiêu đề rút gọn.
 * - Nút hành động (cta) nổi ở đáy: mở link hoặc khoá học.
 */
export function CampaignScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: winW } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<CampaignDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, showToast] = useToast();
  const scrollY = useRef(new Animated.Value(0)).current;

  const width = Platform.OS === 'web' ? Math.min(winW, WEB_MAX_WIDTH) : winW;
  const bannerH = Math.round((width * 9) / 16);
  const topInset = Platform.OS === 'web' ? 12 : insets.top + 4;
  const barH = topInset + 52;

  const load = useCallback(() => {
    if (!id) return;
    setError(null);
    loadCampaign(id)
      .then(setData)
      .catch((e) => setError(e instanceof ApiError && e.status === 404 ? 'Chương trình khuyến mãi này đã kết thúc hoặc không còn hiển thị.' : 'Không tải được nội dung, thử lại sau.'));
  }, [id]);
  useEffect(load, [load]);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const runCta = () => {
    if (!data?.cta) return;
    if (data.cta.type === 'url') Linking.openURL(data.cta.url).catch(() => showToast('Không mở được liên kết'));
    else router.push(`/courses/${data.cta.courseId}`);
  };

  const barIn = scrollY.interpolate({ inputRange: [bannerH - barH - 40, bannerH - barH], outputRange: [0, 1], extrapolate: 'clamp' });
  const bannerScale = scrollY.interpolate({ inputRange: [-200, 0], outputRange: [1.6, 1], extrapolateRight: 'clamp' });
  const bannerShift = scrollY.interpolate({ inputRange: [-200, 0, bannerH], outputRange: [-100, 0, bannerH * 0.4], extrapolate: 'clamp' });

  const left = data ? daysUntil(data.endsAt) : 0;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <Animated.ScrollView
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: NATIVE_DRIVER })}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: data?.cta ? floatingActionSpace(insets.bottom) : insets.bottom + 32 }}
      >
        {/* Banner */}
        <Animated.View style={[styles.banner, { height: bannerH, backgroundColor: colors.heroMid, transform: [{ translateY: bannerShift }, { scale: bannerScale }] }]}>
          {data?.bannerUrl ? (
            <Image source={{ uri: data.bannerUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} accessibilityIgnoresInvertColors />
          ) : null}
        </Animated.View>

        {/* Nội dung đè lên mép dưới banner */}
        <View style={[styles.sheet, { backgroundColor: colors.bg }]}>
          {!data && !error ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.emerald700} />
            </View>
          ) : error ? (
            <View style={styles.errorBox}>
              <Icon name="ticket" size={36} strokeWidth={1.7} color={colors.ink400} />
              <Text style={[type.body, styles.center, { color: colors.ink600 }]}>{error}</Text>
              <Pressable accessibilityRole="button" onPress={load} hitSlop={8}>
                <Text style={[type.label, { color: colors.emerald700 }]}>Thử lại</Text>
              </Pressable>
            </View>
          ) : data ? (
            <View style={styles.body}>
              <View style={styles.metaRow}>
                <View style={[styles.eyebrow, { backgroundColor: colors.mint50 }]}>
                  <Icon name="tag" size={13} strokeWidth={2.2} color={colors.emerald700} />
                  <Text style={[styles.eyebrowText, { color: colors.emerald700 }]}>Khuyến mãi</Text>
                </View>
                <View style={[styles.eyebrow, { backgroundColor: left <= 7 ? colors.amberChip : colors.surfaceAlt }]}>
                  <Icon name="clock" size={13} strokeWidth={2.2} color={left <= 7 ? colors.amberChipText : colors.ink600} />
                  <Text style={[styles.eyebrowText, { color: left <= 7 ? colors.amberChipText : colors.ink600 }]}>
                    {left === 0 ? 'Kết thúc hôm nay' : `Còn ${left} ngày · đến ${dmy(data.endsAt)}`}
                  </Text>
                </View>
              </View>

              <Text accessibilityRole="header" style={[styles.title, { color: colors.ink900 }]}>
                {data.title}
              </Text>
              {data.summary ? <RichText text={data.summary} style={[styles.summary, { color: colors.ink600 }]} /> : null}

              {data.blocks.length > 0 && <View style={[styles.divider, { backgroundColor: colors.line }]} />}
              <ContentBlocks blocks={data.blocks} onCopied={(c) => showToast(`Đã sao chép mã ${c}`)} />
            </View>
          ) : null}
        </View>
      </Animated.ScrollView>

      {/* Thanh trên cùng: trong suốt trên banner, cuộn qua banner thì hiện nền + tiêu đề */}
      <View pointerEvents="box-none" style={[styles.topBar, { paddingTop: topInset, height: barH }]}>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg, borderBottomColor: colors.line, opacity: barIn }, styles.topBarBg]} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          onPress={back}
          hitSlop={6}
          style={({ pressed }) => [styles.back, { backgroundColor: colors.card, borderColor: colors.line, opacity: pressed ? 0.8 : 1 }]}
        >
          <Icon name="chevronLeft" size={22} color={colors.ink900} />
        </Pressable>
        <Animated.Text numberOfLines={1} style={[styles.barTitle, { color: colors.ink900, opacity: barIn }]}>
          {data?.title ?? ''}
        </Animated.Text>
      </View>

      {data?.cta && (
        <FloatingAction>
          <PrimaryButton label={data.cta.label} onPress={runCta} />
        </FloatingAction>
      )}
      {toast}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  grow: { flex: 1 },
  center: { textAlign: 'center' },
  banner: { width: '100%', overflow: 'hidden' },
  sheet: { marginTop: -28, borderTopLeftRadius: 28, borderTopRightRadius: 28, minHeight: 320 },
  loading: { paddingVertical: 80, alignItems: 'center' },
  errorBox: { alignItems: 'center', gap: 12, paddingVertical: 60, paddingHorizontal: 32 },
  body: { paddingTop: 22, paddingHorizontal: 20, gap: 14 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, height: 26, borderRadius: 9999 },
  eyebrowText: { fontFamily: fonts.sans600, fontSize: 12, lineHeight: 16 },
  title: { fontFamily: fonts.display700, fontSize: 26, lineHeight: 34 },
  summary: { fontFamily: fonts.sans400, fontSize: 16, lineHeight: 25 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 6 },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16 },
  topBarBg: { borderBottomWidth: StyleSheet.hairlineWidth },
  back: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  barTitle: { flex: 1, fontFamily: fonts.display600, fontSize: 17, lineHeight: 24 },
});
