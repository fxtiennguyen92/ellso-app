import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useAuth } from '@/auth/AuthProvider';
import { BOTTOM_BAR_SPACE } from '@/components/BottomBar';
import { BottomSheet } from '@/components/BottomSheet';
import { Icon } from '@/components/Icon';
import { QrCode } from '@/components/QrCode';
import { useToast } from '@/components/Toast';
import { displayLink, formatDate, getProfile, type ProfileSection } from '@/data/profile';
import { useScreenTopInset } from '@/hooks/useScreenTopInset';
import { useTheme } from '@/theme/ThemeProvider';
import { illo } from '@/theme/tokens';
import { fonts, type } from '@/theme/typography';

import { ReferralCard } from './ReferralCard';
import { RowIcon, SettingsGroup, SettingsRow, settingsStyles, ThemeSegment, Toggle } from './SettingsParts';

const go = (section: ProfileSection) => router.push(`/profile/${section}`);

/** Tab Hồ sơ. */
export function ProfileScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const topInset = useScreenTopInset();
  const { user, logout } = useAuth();
  // Tên / email / chữ viết tắt lấy từ tài khoản đang đăng nhập; phần còn lại vẫn là data tạm
  const profile = { ...getProfile(), ...(user ? { name: user.name, email: user.email, initials: user.initials } : null) };
  const { referral } = profile;

  const [scrollY, setScrollY] = useState(0);
  const [qrOpen, setQrOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [systemNotif, setSystemNotif] = useState(true);
  const [toast, showToast] = useToast();

  const copy = async (text: string, message: string) => {
    try {
      await Clipboard.setStringAsync(text);
      showToast(message);
    } catch {
      showToast('Không sao chép được');
    }
  };

  const share = async () => {
    const message = `Học cùng mình trên Ellso! Dùng mã ${referral.code} khi đăng ký: ${referral.link}`;
    // Web: trình duyệt không hỗ trợ share sheet → sao chép link thay thế
    if (Platform.OS === 'web' && !(typeof navigator !== 'undefined' && 'share' in navigator)) {
      return copy(referral.link, 'Đã sao chép link giới thiệu');
    }
    try {
      await Share.share({ message, url: referral.link, title: 'Mời bạn học Ellso' });
    } catch {
      copy(referral.link, 'Đã sao chép link giới thiệu');
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      {/* Header cố định */}
      <View
        style={[
          styles.header,
          { paddingTop: topInset, backgroundColor: colors.bg, borderBottomColor: scrollY > 4 ? colors.line : 'transparent' },
        ]}
      >
        <Text accessibilityRole="header" style={[type.screenTitle, styles.grow, { color: colors.ink900 }]}>
          Hồ sơ
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mã QR giới thiệu của bạn"
          onPress={() => setQrOpen(true)}
          style={({ pressed }) => [styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.line, opacity: pressed ? 0.7 : 1 }]}
        >
          <Icon name="qr" strokeWidth={1.9} color={colors.ink900} />
        </Pressable>
      </View>

      <ScrollView
        scrollEventThrottle={16}
        onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 4, paddingBottom: BOTTOM_BAR_SPACE + insets.bottom + 16 }}
      >
        {/* Thẻ hồ sơ */}
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`${profile.name}, ${profile.email}. Sửa thông tin cá nhân`}
          onPress={() => go('thong-tin')}
          style={({ pressed }) => [styles.profileCard, { opacity: pressed ? 0.8 : 1 }]}
        >
          <Avatar initials={profile.initials} />
          <Text style={[type.sectionTitle, { color: colors.ink900 }]}>{profile.name}</Text>
          <Text style={[styles.email, { color: colors.ink600 }]}>{profile.email}</Text>
        </Pressable>

        {/* Gói thành viên */}
        {profile.membership && (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`Gói ${profile.membership.name}, còn hạn đến ${formatDate(profile.membership.expiresAt)}. Quản lý gói`}
            onPress={() => go('quan-ly-goi')}
            style={({ pressed }) => [styles.member, { backgroundColor: colors.amberChip, transform: [{ scale: pressed ? 0.99 : 1 }] }]}
          >
            <View style={[styles.crown, { boxShadow: `0px 4px 0px ${illo.goldEdge}` }]}>
              <Svg width={44} height={44} style={StyleSheet.absoluteFill}>
                <Defs>
                  <LinearGradient id="crownBg" x1="0.15" y1="0" x2="0.85" y2="1">
                    <Stop offset="0" stopColor={illo.goldHi} />
                    <Stop offset="1" stopColor={illo.goldLo} />
                  </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width="44" height="44" rx="14" fill="url(#crownBg)" />
              </Svg>
              {/* bọc để icon nằm trên lớp gradient (web vẽ lớp absolute đè phần tử thường) */}
              <View style={styles.onTop}>
                <Icon name="crown" strokeWidth={2.1} color="#ffffff" />
              </View>
            </View>
            <View style={styles.grow}>
              <Text style={[styles.memberName, { color: colors.ink900 }]}>{profile.membership.name}</Text>
              <Text style={[styles.memberSub, { color: colors.amberChipText }]}>
                Còn hạn đến {formatDate(profile.membership.expiresAt)}
              </Text>
            </View>
            <Text style={[type.captionStrong, { color: colors.amberChipText }]}>Quản lý gói</Text>
            <Icon name="chevronRight" size={18} color={colors.amberChipText} />
          </Pressable>
        )}

        <ReferralCard referral={referral} />

        <SettingsGroup title="Tài khoản">
          <SettingsRow
            first
            icon={<RowIcon name="user" bg={colors.mint50} fg={colors.emerald700} />}
            label="Thông tin cá nhân"
            onPress={() => go('thong-tin')}
          />
          <SettingsRow
            icon={<RowIcon name="lock" bg={colors.surfaceAlt} fg={colors.ink600} />}
            label="Đổi mật khẩu"
            onPress={() => go('doi-mat-khau')}
          />
          <SettingsRow
            icon={<RowIcon name="receipt" bg={colors.skyTint} fg={colors.skyText} />}
            label="Lịch sử mua hàng"
            onPress={() => go('lich-su-mua-hang')}
          />
          <SettingsRow
            icon={<RowIcon name="ticket" bg={colors.violetTint} fg={colors.violetText} />}
            label="Nhập mã kích hoạt"
            onPress={() => go('ma-kich-hoat')}
          />
        </SettingsGroup>

        <SettingsGroup title="Ứng dụng">
          <View style={settingsStyles.rowStatic}>
            <RowIcon name="bell" bg={colors.orangeTint} fg={colors.orangeText} />
            <Text style={[styles.rowLabel, { color: colors.ink900 }]}>Thông báo hệ thống</Text>
            <Toggle value={systemNotif} onChange={setSystemNotif} label="Thông báo hệ thống" />
          </View>
          <View style={[styles.themeBlock, { borderTopWidth: 1, borderTopColor: colors.line }]}>
            <View style={styles.themeHead}>
              <RowIcon name="moon" bg={colors.violetTint} fg={colors.violetText} />
              <Text style={[styles.rowLabel, { color: colors.ink900 }]}>Giao diện</Text>
            </View>
            <ThemeSegment />
          </View>
        </SettingsGroup>

        <SettingsGroup title="Hỗ trợ">
          <SettingsRow
            first
            icon={<RowIcon name="help" bg={colors.surfaceAlt} fg={colors.ink600} />}
            label="Trung tâm trợ giúp"
            onPress={() => go('tro-giup')}
          />
          <SettingsRow
            icon={<RowIcon name="shield" bg={colors.surfaceAlt} fg={colors.ink600} />}
            label="Điều khoản & quyền riêng tư"
            onPress={() => go('dieu-khoan')}
          />
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
          <Text style={[styles.version, { color: colors.ink400 }]}>Ellso · Phiên bản {profile.appVersion}</Text>
        </View>
      </ScrollView>

      {/* QR giới thiệu */}
      <BottomSheet visible={qrOpen} onClose={() => setQrOpen(false)} title="Mã QR giới thiệu">
        <View style={styles.qrWrap}>
          <View style={[styles.qrBox, { borderColor: colors.line }]}>
            {/* QR luôn đen trên trắng để máy quét đọc tốt ở cả chế độ tối */}
            <QrCode value={referral.link} size={220} color="#0f172a" background="#ffffff" />
          </View>
          <Text style={[type.caption, styles.center, { color: colors.ink600 }]}>
            Bạn bè quét mã này để đăng ký với mã giới thiệu của bạn
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Sao chép mã ${referral.code}`}
            onPress={() => copy(referral.code, `Đã sao chép mã ${referral.code}`)}
            style={({ pressed }) => [styles.qrCode, { backgroundColor: colors.mint50, borderColor: colors.emerald500, opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={[styles.qrCodeText, { color: colors.ink900 }]}>{referral.code}</Text>
            <Icon name="copy" size={16} color={colors.emerald700} />
          </Pressable>
          <Text style={[type.caption, { color: colors.ink600 }]}>{displayLink(referral.link)}</Text>
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

      {/* Xác nhận đăng xuất (dùng sheet vì Alert không chạy trên web) */}
      <BottomSheet visible={logoutOpen} onClose={() => setLogoutOpen(false)} title="Đăng xuất khỏi Ellso?">
        <Text style={[type.body, { color: colors.ink600 }]}>
          Bạn sẽ cần đăng nhập lại để tiếp tục học. Tiến độ học vẫn được lưu trên tài khoản.
        </Text>
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
            <Text style={[type.label, { color: '#ffffff' }]}>Đăng xuất</Text>
          </Pressable>
        </View>
      </BottomSheet>

      {toast}
    </View>
  );
}

/** Avatar 88px với viền gradient vàng–xanh. */
function Avatar({ initials }: { initials: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.avatarWrap}>
      <Svg width={88} height={88} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="avatarRing" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={illo.goldMid} />
            <Stop offset="0.5" stopColor={colors.emerald500} />
            <Stop offset="1" stopColor={illo.goldMid} />
          </LinearGradient>
        </Defs>
        <Circle cx="44" cy="44" r="42.5" fill="none" stroke="url(#avatarRing)" strokeWidth={3} />
      </Svg>
      <View style={[styles.avatar, { backgroundColor: colors.mint100, borderColor: colors.card }]}>
        <Text style={[styles.avatarText, { color: colors.emerald800 }]}>{initials}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  center: { textAlign: 'center' },
  onTop: { position: 'relative', zIndex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, zIndex: 10 },
  iconBtn: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  profileCard: { marginTop: 8, marginHorizontal: 16, paddingTop: 8, paddingBottom: 8, alignItems: 'center', gap: 4 },
  avatarWrap: { width: 88, height: 88, marginBottom: 8, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 82, height: 82, borderRadius: 41, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.display600, fontSize: 28, lineHeight: 34 },
  email: { fontFamily: fonts.sans400, fontSize: 14, lineHeight: 20 },

  member: { marginTop: 12, marginHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingLeft: 14, paddingRight: 12, borderRadius: 20 },
  crown: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  memberName: { fontFamily: fonts.display600, fontSize: 16, lineHeight: 22 },
  memberSub: { fontFamily: fonts.sans400, fontSize: 12, lineHeight: 16 },

  themeBlock: { gap: 12, paddingTop: 12, paddingRight: 12, paddingBottom: 14, paddingLeft: 14 },
  themeHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowLabel: { flex: 1, fontFamily: fonts.sans500, fontSize: 15, lineHeight: 22 },

  footer: { paddingTop: 24, paddingHorizontal: 16, alignItems: 'center', gap: 10 },
  logout: { alignSelf: 'stretch', height: 52, borderRadius: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  logoutText: { fontFamily: fonts.sans600, fontSize: 15, lineHeight: 22 },
  version: { fontFamily: fonts.sans400, fontSize: 12, lineHeight: 16 },

  qrWrap: { alignItems: 'center', gap: 12 },
  qrBox: { padding: 12, borderRadius: 20, borderWidth: 1, backgroundColor: '#ffffff' },
  qrCode: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 44, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed' },
  qrCodeText: { fontFamily: fonts.display600, fontSize: 18, lineHeight: 24, letterSpacing: 2.2 },
  primary: { alignSelf: 'stretch', height: 48, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  confirmRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  secondary: { flex: 1, height: 48, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  danger: { flex: 1, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
