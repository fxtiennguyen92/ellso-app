import * as Clipboard from 'expo-clipboard';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useAuth } from '@/auth/AuthProvider';
import { BOTTOM_BAR_SPACE } from '@/components/BottomBar';
import { BottomSheet } from '@/components/BottomSheet';
import { HeroBackground } from '@/components/HeroBackground';
import { Icon } from '@/components/Icon';
import { QrCode } from '@/components/QrCode';
import { useToast } from '@/components/Toast';
import { UserAvatar } from '@/components/UserAvatar';
import { daysUntil, displayLink, dmy, getProfile, type ProfileSection } from '@/data/profile';
import { NATIVE_DRIVER } from '@/hooks/useLoop';
import { appVersionLabel } from '@/lib/appVersion';
import { useTheme } from '@/theme/ThemeProvider';
import { illo } from '@/theme/tokens';
import { fonts, type } from '@/theme/typography';

import { RowIcon, SettingsGroup, SettingsRow, settingsStyles, ThemeSegment, Toggle } from './SettingsParts';

// Thông tin cá nhân / Mật khẩu & Bảo mật là màn riêng ngoài tab (/account/…); các trang còn lại vẫn là trang tạm /profile/…
const go = (section: ProfileSection) =>
  section === 'thong-tin' ? router.push('/account/info') : section === 'doi-mat-khau' ? router.push('/account/password') : router.push(`/profile/${section}`);

const COMPACT_H = 52;

/**
 * Tab Hồ sơ.
 * - Hero emerald (cùng kiểu Home): tiêu đề + nút QR, avatar lớn (bấm → Thông tin cá nhân), tên, email, loại tài khoản:
 *   chưa có gói → pill trắng "Tài khoản cơ bản" + nút "Nâng cấp"; có gói → pill vàng "Tài khoản thành viên", bấm mở sheet
 *   (ngày bắt đầu, ngày hết hạn, nút Gia hạn). Số xu đã chuyển sang màn Thông tin cá nhân.
 * - Các nhóm cài đặt: icon một kiểu (Lucide, ô mint). Giao diện Sáng / Tối / Hệ thống lưu trên máy.
 * - Cuộn: thanh trên cùng luôn cố định (tiêu đề + QR). Khối tên trên hero mờ dần / thu nhỏ khi cuộn; tới khoảng
 *   giữa hero thì thanh trên cùng hiện nền hero và đổi tiêu đề thành avatar nhỏ + tên + loại tài khoản. Nút làm mới (bên trái QR) tải lại số xu / gói / ảnh; mỗi lần vào tab cũng tự làm mới.
 * - Phiên bản lấy từ bản cài (appVersionLabel), không đặt cứng.
 */
export function ProfileScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, logout, refreshUser } = useAuth();

  // Mã / link giới thiệu: mã thật từ tài khoản, link theo mẫu tạm
  const mock = getProfile();
  const code = user?.referralCode ?? mock.referral.code;
  const referralLink = `https://ellso.app/r/${code}`;
  const name = user?.name ?? '';
  const initials = user?.initials ?? '?';
  const membership =
    user?.membership?.active && user.membership.endsAt ? { endsAt: user.membership.endsAt, startedAt: user.membership.startedAt } : null;

  const topInset = Platform.OS === 'web' ? 20 : insets.top + 8;
  const scrollY = useRef(new Animated.Value(0)).current;
  const [heroH, setHeroH] = useState(320);
  const [compact, setCompact] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [memberOpen, setMemberOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [systemNotif, setSystemNotif] = useState(true);
  const [toast, showToast] = useToast();

  // Mỗi lần vào tab: làm mới số xu / gói (lỗi mạng bỏ qua, giữ số cũ)
  useFocusEffect(
    useCallback(() => {
      refreshUser();
    }, [refreshUser]),
  );

  // Nút làm mới trên thanh trên cùng (không dùng kéo xuống: lộ nền hero phía trên, không đẹp).
  // Icon quay liên tục trong lúc tải, tối thiểu 1 vòng để người dùng thấy đã bấm.
  const spin = useRef(new Animated.Value(0)).current;
  const onRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    spin.setValue(0);
    const loop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 700, easing: Easing.linear, useNativeDriver: NATIVE_DRIVER }));
    loop.start();
    await Promise.all([refreshUser(), new Promise((res) => setTimeout(res, 700))]);
    loop.stop();
    spin.setValue(0);
    setRefreshing(false);
    showToast('Đã cập nhật hồ sơ');
  };

  // Thanh trên cùng đổi chéo khi khối tên trên hero đã mờ gần hết (≈ 25% → 45% chiều cao hero)
  const barFrom = Math.max(1, heroH * 0.25);
  const barTo = barFrom + Math.max(40, heroH * 0.2);
  const barIn = scrollY.interpolate({ inputRange: [barFrom, barTo], outputRange: [0, 1], extrapolate: 'clamp' });
  const barOut = scrollY.interpolate({ inputRange: [barFrom, barTo], outputRange: [1, 0], extrapolate: 'clamp' });
  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
    useNativeDriver: NATIVE_DRIVER,
    listener: (e: { nativeEvent: { contentOffset: { y: number } } }) => {
      const on = e.nativeEvent.contentOffset.y > (barFrom + barTo) / 2;
      setCompact((c) => (c === on ? c : on));
    },
  });

  const copy = async (text: string, message: string) => {
    try {
      await Clipboard.setStringAsync(text);
      showToast(message);
    } catch {
      showToast('Không sao chép được');
    }
  };

  const share = async () => {
    const message = `Học cùng mình trên Ellso! Dùng mã ${code} khi đăng ký: ${referralLink}`;
    // Web: trình duyệt không hỗ trợ share sheet → sao chép link thay thế
    if (Platform.OS === 'web' && !(typeof navigator !== 'undefined' && 'share' in navigator)) {
      return copy(referralLink, 'Đã sao chép link giới thiệu');
    }
    try {
      await Share.share({ message, url: referralLink, title: 'Mời bạn học Ellso' });
    } catch {
      copy(referralLink, 'Đã sao chép link giới thiệu');
    }
  };

  const refreshButton = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={refreshing ? 'Đang làm mới hồ sơ' : 'Làm mới hồ sơ'}
      accessibilityState={{ busy: refreshing }}
      onPress={onRefresh}
      style={({ pressed }) => [styles.glassBtn, { backgroundColor: colors.heroGlass, borderColor: colors.heroGlassLine, opacity: pressed ? 0.75 : 1 }]}
    >
      <Animated.View style={{ transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}>
        <Icon name="refresh" size={20} color={colors.heroOn} />
      </Animated.View>
    </Pressable>
  );

  const qrButton = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Mã QR giới thiệu của bạn"
      onPress={() => setQrOpen(true)}
      style={({ pressed }) => [styles.glassBtn, { backgroundColor: colors.heroGlass, borderColor: colors.heroGlassLine, opacity: pressed ? 0.75 : 1 }]}
    >
      <Icon name="qr" size={20} color={colors.heroOn} />
    </Pressable>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      {/* Nền emerald phía sau nửa trên: kéo quá đầu trang (iOS) vẫn thấy màu hero, không lộ khoảng trắng */}
      <View pointerEvents="none" style={[styles.overscroll, { backgroundColor: colors.heroFrom }]} />

      <Animated.ScrollView
        scrollEventThrottle={16}
        onScroll={onScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: BOTTOM_BAR_SPACE + insets.bottom + 16, backgroundColor: colors.bg }}
      >
        {/* ---------- Hero ---------- */}
        <View style={[styles.hero, { paddingTop: topInset, backgroundColor: colors.heroMid }]} onLayout={(e) => setHeroH(e.nativeEvent.layout.height)}>
          <HeroBackground id="profile-hero" ringsY={topInset + 30} />

          {/* chỗ cho thanh trên cùng cố định (tiêu đề + QR nằm ở thanh đó) */}
          <View style={styles.heroTop} />

          <Animated.View
            style={[
              styles.identity,
              {
                // mờ hết trước khi thanh trên cùng đổi chéo (≈ 25% hero) → không chồng lên tiêu đề
                opacity: scrollY.interpolate({ inputRange: [0, Math.max(1, heroH * 0.24)], outputRange: [1, 0], extrapolate: 'clamp' }),
                transform: [
                  // trôi chậm hơn nội dung (gần như đứng yên) để không trượt lên vùng tiêu đề
                  { translateY: scrollY.interpolate({ inputRange: [-120, 0, 300], outputRange: [-30, 0, 240], extrapolate: 'clamp' }) },
                  { scale: scrollY.interpolate({ inputRange: [-120, 0, 200], outputRange: [1.08, 1, 0.8], extrapolate: 'clamp' }) },
                ],
              },
            ]}
          >
            <Pressable accessibilityRole="link" accessibilityLabel={`${name}. Xem thông tin cá nhân`} onPress={() => go('thong-tin')} style={styles.avatarPress}>
              <BigAvatar initials={initials} uri={user?.avatar} />
            </Pressable>
            <Text style={[styles.name, { color: colors.heroOn }]} numberOfLines={1}>
              {name}
            </Text>
            <Text style={[styles.email, { color: colors.heroOnMuted }]} numberOfLines={1}>
              {user?.email}
            </Text>

            {membership ? (
              // Thành viên: pill vàng nổi bật, bấm → sheet thời hạn gói
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Tài khoản thành viên, hết hạn ${dmy(membership.endsAt)}. Xem chi tiết gói`}
                onPress={() => setMemberOpen(true)}
                style={({ pressed }) => [styles.memberPill, { boxShadow: `0px 3px 0px ${illo.goldEdge}`, transform: [{ scale: pressed ? 0.97 : 1 }] }]}
              >
                <GoldFill id="member-pill" />
                <View style={styles.pillInner}>
                  <Icon name="crown" size={16} strokeWidth={2.3} color={illo.goldInk} />
                  <Text style={[styles.pillText, { color: illo.goldInk }]}>Tài khoản thành viên</Text>
                  <Icon name="chevronRight" size={15} strokeWidth={2.4} color={illo.goldInk} />
                </View>
              </Pressable>
            ) : (
              // Cơ bản: pill trắng + nút Nâng cấp kế bên
              <View style={styles.accountRow}>
                <View accessible accessibilityLabel="Tài khoản cơ bản" style={[styles.basicPill, { backgroundColor: colors.heroOn }]}>
                  <Icon name="basicAccount" size={16} strokeWidth={2.2} color={colors.heroMid} />
                  <Text style={[styles.pillText, { color: colors.heroMid }]}>Tài khoản cơ bản</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Nâng cấp lên tài khoản thành viên"
                  onPress={() => go('quan-ly-goi')}
                  style={({ pressed }) => [styles.upgrade, { boxShadow: `0px 3px 0px ${illo.goldEdge}`, transform: [{ scale: pressed ? 0.97 : 1 }] }]}
                >
                  <GoldFill id="upgrade-btn" />
                  <View style={styles.pillInner}>
                    <Icon name="crown" size={15} strokeWidth={2.3} color={illo.goldInk} />
                    <Text style={[styles.pillText, { color: illo.goldInk }]}>Nâng cấp</Text>
                  </View>
                </Pressable>
              </View>
            )}
          </Animated.View>
        </View>

        {/* ---------- Cài đặt ---------- */}
        <SettingsGroup title="Tài khoản">
          <SettingsRow first icon={<RowIcon name="user" />} label="Thông tin cá nhân" onPress={() => go('thong-tin')} />
          <SettingsRow icon={<RowIcon name="lock" />} label="Mật khẩu & Bảo mật" onPress={() => go('doi-mat-khau')} />
          <SettingsRow icon={<RowIcon name="receipt" />} label="Lịch sử thanh toán" onPress={() => go('lich-su-mua-hang')} />
          <SettingsRow icon={<RowIcon name="crown" />} label="Gói thành viên" value={membership ? `đến ${dmy(membership.endsAt)}` : 'Chưa có'} onPress={() => go('quan-ly-goi')} />
          <SettingsRow icon={<RowIcon name="ticket" />} label="Nhập mã kích hoạt" onPress={() => go('ma-kich-hoat')} />
        </SettingsGroup>

        <SettingsGroup title="Ứng dụng">
          <View style={settingsStyles.rowStatic}>
            <RowIcon name="bell" />
            <Text style={[styles.rowLabel, { color: colors.ink900 }]}>Thông báo hệ thống</Text>
            <Toggle value={systemNotif} onChange={setSystemNotif} label="Thông báo hệ thống" />
          </View>
          <View style={[styles.themeBlock, { borderTopWidth: 1, borderTopColor: colors.line }]}>
            <View style={styles.themeHead}>
              <RowIcon name="palette" />
              <Text style={[styles.rowLabel, { color: colors.ink900 }]}>Giao diện</Text>
            </View>
            <ThemeSegment />
          </View>
        </SettingsGroup>

        <SettingsGroup title="Hỗ trợ">
          <SettingsRow first icon={<RowIcon name="help" />} label="Trung tâm trợ giúp" onPress={() => go('tro-giup')} />
          <SettingsRow icon={<RowIcon name="shield" />} label="Điều khoản & quyền riêng tư" onPress={() => go('dieu-khoan')} />
        </SettingsGroup>

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setLogoutOpen(true)}
            style={({ pressed }) => [styles.logout, { backgroundColor: pressed ? colors.surfaceAlt : colors.card, borderColor: colors.line }]}
          >
            <Icon name="logout" size={18} color={colors.danger} />
            <Text style={[styles.logoutText, { color: colors.danger }]}>Đăng xuất</Text>
          </Pressable>
          <Text style={[styles.version, { color: colors.ink400 }]}>Ellso · Phiên bản {appVersionLabel()}</Text>
        </View>
      </Animated.ScrollView>

      {/* ---------- Thanh trên cùng cố định ----------
          Đầu trang: trong suốt, chỉ có tiêu đề "Hồ sơ" + nút QR nằm trên hero.
          Cuộn xuống: nền hero hiện dần, tiêu đề chuyển thành avatar nhỏ + tên + số xu (đổi chéo, không có khoảng trống). */}
      <View pointerEvents="box-none" style={[styles.topBar, { paddingTop: topInset, height: topInset + COMPACT_H }]}>
        <Animated.View
          pointerEvents="none"
          style={[styles.topBarBg, { backgroundColor: colors.heroMid, boxShadow: colors.navShadow, opacity: barIn }]}
        >
          <HeroBackground id="profile-bar" ringsY={0} glow={false} />
        </Animated.View>

        <View style={styles.topBarRow} pointerEvents="box-none">
          <Animated.Text
            accessibilityRole="header"
            style={[type.screenTitle, styles.topTitle, { color: colors.heroOn, opacity: barOut }]}
            numberOfLines={1}
          >
            Hồ sơ
          </Animated.Text>
          <Animated.View
            pointerEvents="none"
            accessibilityElementsHidden={!compact}
            importantForAccessibility={compact ? 'auto' : 'no-hide-descendants'}
            style={[
              styles.compactIdentity,
              { opacity: barIn, transform: [{ translateY: barIn.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] },
            ]}
          >
            <UserAvatar uri={user?.avatar} initials={initials} size={36} bg={colors.mint100} fg={colors.emerald800} borderColor={colors.heroGlassLine} borderWidth={2} />
            <View style={styles.grow}>
              <Text style={[styles.compactName, { color: colors.heroOn }]} numberOfLines={1}>
                {name}
              </Text>
              <Text style={[type.caption, { color: colors.heroOnMuted }]} numberOfLines={1}>
                {membership ? 'Tài khoản thành viên' : 'Tài khoản cơ bản'}
              </Text>
            </View>
          </Animated.View>
          {refreshButton}
          {qrButton}
        </View>
      </View>

      {/* QR giới thiệu */}
      <BottomSheet visible={qrOpen} onClose={() => setQrOpen(false)} title="Mã QR giới thiệu">
        <View style={styles.qrWrap}>
          <View style={[styles.qrBox, { borderColor: colors.line }]}>
            {/* QR luôn đen trên trắng để máy quét đọc tốt ở cả chế độ tối */}
            <QrCode value={referralLink} size={220} color="#0f172a" background="#ffffff" />
          </View>
          <Text style={[type.caption, styles.center, { color: colors.ink600 }]}>Bạn bè quét mã này để đăng ký với mã giới thiệu của bạn</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Sao chép mã ${code}`}
            onPress={() => copy(code, `Đã sao chép mã ${code}`)}
            style={({ pressed }) => [styles.qrCode, { backgroundColor: colors.mint50, borderColor: colors.emerald500, opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={[styles.qrCodeText, { color: colors.ink900 }]}>{code}</Text>
            <Icon name="copy" size={16} color={colors.emerald700} />
          </Pressable>
          <Text style={[type.caption, { color: colors.ink600 }]}>{displayLink(referralLink)}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={share}
            style={({ pressed }) => [styles.primary, { backgroundColor: pressed ? colors.emerald800 : colors.emerald700 }]}
          >
            <Icon name="share" size={18} color={colors.onEmerald} />
            <Text style={[type.label, { color: colors.onEmerald }]}>Chia sẻ link</Text>
          </Pressable>
        </View>
      </BottomSheet>

      {/* Gói thành viên: thời hạn + Gia hạn */}
      <BottomSheet visible={memberOpen} onClose={() => setMemberOpen(false)} title="Tài khoản thành viên">
        {membership ? (
          <View style={styles.memberSheet}>
            <View style={[styles.memberCard, { boxShadow: `0px 4px 0px ${illo.goldEdge}` }]}>
              <GoldFill id="member-card" />
              <View style={styles.memberCardInner}>
                <Icon name="crown" size={22} strokeWidth={2.2} color={illo.goldInk} />
                <View style={styles.grow}>
                  <Text style={[styles.memberCardTitle, { color: illo.goldInk }]}>Gói thành viên Ellso</Text>
                  <Text style={[type.caption, { color: illo.goldInk }]}>Mở toàn bộ tài liệu và các khoá huấn luyện</Text>
                </View>
                <View style={[styles.daysLeft, { backgroundColor: illo.goldInk }]}>
                  <Text style={[styles.daysLeftText, { color: illo.goldHi }]}>còn {daysUntil(membership.endsAt)} ngày</Text>
                </View>
              </View>
            </View>
            <View style={[styles.dates, { borderColor: colors.line }]}>
              <DateRow icon="calendarStart" label="Bắt đầu" value={membership.startedAt ? dmy(membership.startedAt) : '—'} />
              <View style={[styles.datesDivider, { backgroundColor: colors.line }]} />
              <DateRow icon="calendarEnd" label="Hết hạn" value={dmy(membership.endsAt)} />
            </View>
            <Text style={[type.caption, { color: colors.ink600 }]}>Gia hạn khi còn hạn: thời gian mới được cộng nối tiếp ngay sau ngày hết hạn hiện tại.</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setMemberOpen(false);
                go('quan-ly-goi');
              }}
              style={({ pressed }) => [styles.primary, { backgroundColor: pressed ? colors.emerald800 : colors.emerald700 }]}
            >
              <Icon name="refresh" size={18} color={colors.onEmerald} />
              <Text style={[type.label, { color: colors.onEmerald }]}>Gia hạn</Text>
            </Pressable>
          </View>
        ) : null}
      </BottomSheet>

      {/* Xác nhận đăng xuất (dùng sheet vì Alert không chạy trên web) */}
      <BottomSheet visible={logoutOpen} onClose={() => setLogoutOpen(false)} title="Đăng xuất khỏi Ellso?">
        <Text style={[type.body, { color: colors.ink600 }]}>Bạn sẽ cần đăng nhập lại để tiếp tục học. Tiến độ học vẫn được lưu trên tài khoản.</Text>
        <View style={styles.confirmRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setLogoutOpen(false)}
            style={({ pressed }) => [styles.secondary, { borderColor: colors.line, backgroundColor: pressed ? colors.surfaceAlt : colors.card }]}
          >
            <Text style={[type.label, { color: colors.ink900 }]}>Huỷ</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setLogoutOpen(false);
              // Xoá phiên → status "signedOut" → router tự về màn đăng nhập
              logout();
            }}
            style={({ pressed }) => [styles.danger, { backgroundColor: colors.danger, opacity: pressed ? 0.85 : 1 }]}
          >
            <Text style={[type.label, { color: colors.onEmerald }]}>Đăng xuất</Text>
          </Pressable>
        </View>
      </BottomSheet>

      {toast}
    </View>
  );
}

/** Avatar lớn trên hero: viền kính mờ + vòng gradient mảnh, chữ viết tắt. */
function BigAvatar({ initials, uri }: { initials: string; uri?: string | null }) {
  const { colors, scheme } = useTheme();
  const id = `avatarRing-${scheme}`;
  return (
    <View style={styles.avatarWrap}>
      <Svg width={104} height={104} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.heroGlow} />
            <Stop offset="0.5" stopColor={colors.heroOn} stopOpacity={0.9} />
            <Stop offset="1" stopColor={colors.heroGlow} />
          </LinearGradient>
        </Defs>
        <Circle cx="52" cy="52" r="50" fill="none" stroke={`url(#${id})`} strokeWidth={2.5} />
      </Svg>
      <UserAvatar uri={uri} initials={initials} size={90} bg={colors.mint100} fg={colors.emerald800} borderColor={colors.heroGlassLine} borderWidth={3} />
    </View>
  );
}

/** Nền vàng gradient phủ kín phần tử cha (pill / thẻ thành viên). Cha cần overflow hidden + bo góc. */
function GoldFill({ id }: { id: string }) {
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} preserveAspectRatio="none">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={illo.goldHi} />
          <Stop offset="0.55" stopColor={illo.goldMid} />
          <Stop offset="1" stopColor={illo.goldLo} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

function DateRow({ icon, label, value }: { icon: 'calendarStart' | 'calendarEnd'; label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.dateRow}>
      <RowIcon name={icon} />
      <Text style={[styles.rowLabel, { color: colors.ink600 }]}>{label}</Text>
      <Text style={[styles.dateValue, { color: colors.ink900 }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  center: { textAlign: 'center' },
  onTop: { position: 'relative', zIndex: 1 },
  overscroll: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%' },

  hero: { paddingHorizontal: 16, paddingBottom: 32, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden' },
  heroTop: { height: COMPACT_H },
  glassBtn: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  identity: { alignItems: 'center', paddingTop: 8 },
  avatarPress: { marginBottom: 12 },
  avatarWrap: { width: 104, height: 104, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: fonts.display600, fontSize: 24, lineHeight: 32, maxWidth: '100%' },
  email: { fontFamily: fonts.sans500, fontSize: 14, lineHeight: 20, marginTop: 2 },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  basicPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 34, borderRadius: 9999 },
  upgrade: { height: 34, borderRadius: 9999, overflow: 'hidden', justifyContent: 'center' },
  memberPill: { marginTop: 14, height: 36, borderRadius: 9999, overflow: 'hidden', justifyContent: 'center' },
  pillInner: { position: 'relative', zIndex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14 },
  pillText: { fontFamily: fonts.sans700, fontSize: 13, lineHeight: 18 },

  memberSheet: { gap: 14 },
  memberCard: { borderRadius: 18, overflow: 'hidden' },
  memberCardInner: { position: 'relative', zIndex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  memberCardTitle: { fontFamily: fonts.display600, fontSize: 16, lineHeight: 22 },
  daysLeft: { paddingHorizontal: 10, height: 26, borderRadius: 9999, justifyContent: 'center' },
  daysLeftText: { fontFamily: fonts.sans700, fontSize: 12, lineHeight: 16 },
  dates: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 14 },
  datesDivider: { height: StyleSheet.hairlineWidth },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56 },
  dateValue: { fontFamily: fonts.sans700, fontSize: 15, lineHeight: 22 },

  themeBlock: { gap: 12, paddingTop: 12, paddingRight: 12, paddingBottom: 14, paddingLeft: 14 },
  themeHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowLabel: { flex: 1, fontFamily: fonts.sans500, fontSize: 15, lineHeight: 22 },

  footer: { paddingTop: 24, paddingHorizontal: 16, alignItems: 'center', gap: 10 },
  logout: { alignSelf: 'stretch', height: 52, borderRadius: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  logoutText: { fontFamily: fonts.sans600, fontSize: 15, lineHeight: 22 },
  version: { fontFamily: fonts.sans400, fontSize: 12, lineHeight: 16 },

  topBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, paddingHorizontal: 16 },
  // nền thanh thu gọn dài xuống thêm 10px dưới hàng nội dung → khoảng đệm dưới, không làm xê dịch tiêu đề / nút
  topBarBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: -10, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, overflow: 'hidden' },
  topBarRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  topTitle: { position: 'absolute', left: 0, right: 108 },
  compactIdentity: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 },
  compactName: { fontFamily: fonts.display600, fontSize: 16, lineHeight: 22 },

  qrWrap: { alignItems: 'center', gap: 12 },
  qrBox: { padding: 12, borderRadius: 20, borderWidth: 1, backgroundColor: '#ffffff' },
  qrCode: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 44, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed' },
  qrCodeText: { fontFamily: fonts.display600, fontSize: 18, lineHeight: 24, letterSpacing: 2.2 },
  primary: { alignSelf: 'stretch', height: 48, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  confirmRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  secondary: { flex: 1, height: 48, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  danger: { flex: 1, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
