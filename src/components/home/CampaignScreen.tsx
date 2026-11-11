import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { PrimaryButton } from '@/components/auth/AuthUI';
import { ContentBlocks, RichText } from '@/components/content/ContentBlocks';
import { FloatingAction, floatingActionSpace } from '@/components/FloatingAction';
import { Icon } from '@/components/Icon';
import { useToast } from '@/components/Toast';
import { type CampaignDetail, loadCampaign } from '@/data/home';
import { daysUntil, dmy } from '@/data/profile';
import { illo, WEB_MAX_WIDTH } from '@/theme/tokens';
import { NATIVE_DRIVER } from '@/hooks/useLoop';
import { ApiError } from '@/lib/api';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/typography';
import { Bone, BoneLines, Skeleton } from '@/components/Skeleton';

/**
 * Khuyến mãi › chi tiết (/campaign/[id], GET /v1/campaigns/{id}):
 * - Banner luôn hiện TRỌN VẸN (16:9, đúng khổ CMS 1280×720), là một thẻ bo góc nổi trên nền "ambient":
 *   chính banner phóng to + làm mờ phủ phần đầu màn, mờ dần vào màu nền → không cắt, không đè chữ lên hình.
 * - Dưới banner: nhãn "Khuyến mãi" + còn n ngày, tiêu đề, tóm tắt, rồi các khối CMS (ContentBlocks).
 * - Cuộn: thanh trên cùng hiện nền = banner làm mờ + lớp phủ tối, tiêu đề chữ trắng; nút Back luôn là kính mờ trắng. Nút hành động (cta) nổi ở đáy: mở link hoặc khoá học.
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
  const bannerH = Math.round(((width - 32) * 9) / 16);
  const topInset = Platform.OS === 'web' ? 12 : insets.top + 4;
  // Thanh trên cùng: nút 40px + đệm dưới 16px (= đệm trái/phải) — HEADER_PAD
  const barH = topInset + 40 + 16;
  const ambientH = barH + bannerH + 60;

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

  // Nền header hiện đủ đúng lúc mép dưới banner chui hết vào dưới header (banner đáy = barH + 4 + bannerH - y)
  const barIn = scrollY.interpolate({ inputRange: [bannerH - 40, bannerH + 4], outputRange: [0, 1], extrapolate: 'clamp' });
  const ambientShift = scrollY.interpolate({ inputRange: [-200, 0, ambientH], outputRange: [-100, 0, ambientH * 0.5], extrapolate: 'clamp' });

  const left = data ? daysUntil(data.endsAt) : 0;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <Animated.ScrollView
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: NATIVE_DRIVER })}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: data?.cta ? floatingActionSpace(insets.bottom) : insets.bottom + 32 }}
      >
        {/* Nền ambient: banner làm mờ, mờ dần vào màu nền */}
        <Animated.View pointerEvents="none" style={[styles.ambient, { height: ambientH, transform: [{ translateY: ambientShift }] }]}>
          {data?.bannerUrl ? (
            // Ảnh chỉ phủ 85% trên (phần dưới gradient đã đặc màu nền) → mép dưới ảnh không bao giờ lộ thành vạch khi cuộn
            <View style={styles.ambientClip}>
              <Image source={{ uri: data.bannerUrl }} style={[StyleSheet.absoluteFill, styles.ambientImg]} contentFit="cover" blurRadius={40} />
            </View>
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.mint50 }]} />
          )}
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="campFade" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.bg} stopOpacity={0.15} />
                <Stop offset="0.5" stopColor={colors.bg} stopOpacity={0.45} />
                {/* 15% cuối đặc màu nền: mép dưới ảnh làm mờ (web: bộ lọc blur làm mép trong / sẫm) không lộ thành đường kẻ khi cuộn */}
                <Stop offset="0.85" stopColor={colors.bg} stopOpacity={1} />
                <Stop offset="1" stopColor={colors.bg} stopOpacity={1} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#campFade)" />
          </Svg>
        </Animated.View>

        {/* Banner trọn vẹn */}
        <View style={[styles.bannerCard, { marginTop: barH + 4, height: bannerH, boxShadow: colors.shadowCard }]}>
          {data?.bannerUrl ? (
            <Image
              source={{ uri: data.bannerUrl }}
              style={StyleSheet.absoluteFill}
              // banner CMS luôn 16:9 (1280×720) → cover lấp kín thẻ, không còn dải nền trên / dưới do làm tròn kích thước
              contentFit="cover"
              transition={200}
              accessibilityLabel={data.title}
              accessibilityIgnoresInvertColors
            />
          ) : !data && !error ? (
            <Skeleton style={StyleSheet.absoluteFill}>
              <Bone h="100%" r={0} />
            </Skeleton>
          ) : null}
        </View>

        {/* Nội dung */}
        <View style={styles.sheet}>
          {!data && !error ? (
            <Skeleton label="Đang tải khuyến mãi" style={styles.skeleton}>
              <Bone w="45%" h={24} r={12} />
              <Bone w="85%" h={28} />
              <BoneLines lines={2} />
              <Bone h={120} r={18} style={styles.skeletonGap} />
              <BoneLines lines={3} last="40%" />
            </Skeleton>
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
              {data.blocks.length > 0 && <View style={styles.spacer} />}

              <ContentBlocks blocks={data.blocks} onCopied={(c) => showToast(`Đã sao chép mã ${c}`)} />
            </View>
          ) : null}
        </View>
      </Animated.ScrollView>

      {/* Thanh trên cùng: luôn trong suốt (không nền trắng, không đường kẻ). Cuộn qua banner thì hiện dần nền là CHÍNH ảnh
          banner làm mờ (cùng ambient phía sau) + lớp phủ tối → tiêu đề chữ trắng đọc được với mọi màu banner. */}
      <View pointerEvents="box-none" style={[styles.topBar, { paddingTop: topInset, height: barH }]}>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.barBg, { opacity: barIn, backgroundColor: illo.bannerBacking }]}>
          {data?.bannerUrl ? (
            <Image source={{ uri: data.bannerUrl }} style={[styles.barImg, { height: ambientH }]} contentFit="cover" blurRadius={40} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.emerald700 }]} />
          )}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: illo.bannerScrim }]} />
        </Animated.View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          onPress={back}
          hitSlop={6}
          style={({ pressed }) => [styles.back, { backgroundColor: pressed ? illo.glassBtnPressed : illo.glassBtn, borderColor: illo.glassBtnLine }]}
        >
          <Icon name="chevronLeft" size={22} color="#ffffff" />
        </Pressable>
        <Animated.Text numberOfLines={1} style={[styles.barTitle, { opacity: barIn }]}>
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
  skeleton: { gap: 14, paddingTop: 4 },
  skeletonGap: { marginVertical: 6 },
  screen: { flex: 1 },
  grow: { flex: 1 },
  center: { textAlign: 'center' },
  ambient: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden' },
  ambientClip: { position: 'absolute', top: 0, left: 0, right: 0, bottom: '15%', overflow: 'hidden' },
  ambientImg: { transform: [{ scale: 1.4 }] },
  bannerCard: { marginHorizontal: 16, borderRadius: 20, overflow: 'hidden' },
  sheet: { minHeight: 320 },
  loading: { paddingVertical: 80, alignItems: 'center' },
  errorBox: { alignItems: 'center', gap: 12, paddingVertical: 60, paddingHorizontal: 32 },
  body: { paddingTop: 20, paddingHorizontal: 20, gap: 14 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, height: 26, borderRadius: 9999 },
  eyebrowText: { fontFamily: fonts.sans600, fontSize: 12, lineHeight: 16 },
  title: { fontFamily: fonts.display700, fontSize: 26, lineHeight: 34 },
  spacer: { height: 6 },
  summary: { fontFamily: fonts.sans400, fontSize: 16, lineHeight: 25 },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 16 },
  barBg: { overflow: 'hidden' },
  // Ảnh nền header đặt y hệt ambient lúc chưa cuộn (top 0, phóng 1.4) → hiện ra liền mạch, không thấy "mép"
  barImg: { position: 'absolute', top: 0, left: 0, right: 0, transform: [{ scale: 1.4 }] },
  back: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  barTitle: { flex: 1, fontFamily: fonts.display600, fontSize: 17, lineHeight: 24, color: '#ffffff' },
});
