import { router, useFocusEffect } from 'expo-router';
import { type ReactNode, useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { Icon, type IconName } from '@/components/Icon';
import { SubpageHeader } from '@/components/SubpageHeader';
import { useToast } from '@/components/Toast';
import { UserAvatar } from '@/components/UserAvatar';
import { initialsOf } from '@/data/auth';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/typography';

import { AddReferrerSheet } from './AddReferrerSheet';
import { CoinCard } from './CoinCard';

/** "0912345678" → "0912 345 678" */
const formatPhone = (p: string) => (/^\d{10}$/.test(p) ? `${p.slice(0, 4)} ${p.slice(4, 7)} ${p.slice(7)}` : p);

/**
 * Hồ sơ › Thông tin cá nhân (chỉ xem). Ba khối:
 * 1. Thông tin cá nhân (ảnh, họ tên, SĐT, email) + nút "Thay đổi" → /account/edit (màn sửa).
 * 2. Người giới thiệu: đã có → tên + email (không đổi được); chưa có → nút thêm, mở AddReferrerSheet.
 * 3. Xu của bạn (chuyển từ trang Hồ sơ) + nút Lịch sử.
 * Mỗi lần vào màn: làm mới GET /me.
 */
export function AccountInfoScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [toast, showToast] = useToast();

  useFocusEffect(
    useCallback(() => {
      refreshUser();
    }, [refreshUser]),
  );

  if (!user) return null;
  const referrer = user.referrer ?? null;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <SubpageHeader title="Thông tin cá nhân" scrolled={scrolled} />

      <ScrollView
        scrollEventThrottle={16}
        onScroll={(e) => setScrolled(e.nativeEvent.contentOffset.y > 4)}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Thông tin cá nhân */}
        <Section
          title="Thông tin cá nhân"
          action={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Thay đổi thông tin cá nhân"
              onPress={() => router.push('/account/edit')}
              hitSlop={6}
              style={({ pressed }) => [styles.action, { backgroundColor: colors.mint50, opacity: pressed ? 0.75 : 1 }]}
            >
              <Icon name="pencil" size={14} strokeWidth={2.3} color={colors.emerald700} />
              <Text style={[type.captionStrong, { color: colors.emerald700 }]}>Thay đổi</Text>
            </Pressable>
          }
        >
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line }]}>
            <View style={styles.identity}>
              <UserAvatar uri={user.avatar} initials={user.initials} size={56} bg={colors.mint100} fg={colors.emerald800} />
              <View style={styles.grow}>
                <Text style={[styles.name, { color: colors.ink900 }]} numberOfLines={1}>
                  {user.name}
                </Text>
                <Text style={[type.caption, { color: colors.ink600 }]} numberOfLines={1}>
                  {user.membership?.active ? 'Tài khoản thành viên' : 'Tài khoản cơ bản'}
                </Text>
              </View>
            </View>
            <InfoRow icon="user" label="Họ và tên" value={user.name} />
            <InfoRow icon="phone" label="Số điện thoại" value={user.phone ? formatPhone(user.phone) : null} empty="Chưa cập nhật" />
            <InfoRow icon="mail" label="Email" value={user.email} />
          </View>
        </Section>

        {/* 2. Người giới thiệu */}
        <Section title="Người giới thiệu">
          {referrer ? (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line }]}>
              <View style={styles.identity}>
                <UserAvatar initials={initialsOf(referrer.name)} size={48} bg={colors.mint50} fg={colors.emerald800} />
                <View style={styles.grow}>
                  <Text style={[styles.refName, { color: colors.ink900 }]} numberOfLines={1}>
                    {referrer.name}
                  </Text>
                  {referrer.email ? (
                    <Text style={[type.caption, { color: colors.ink600 }]} numberOfLines={1}>
                      {referrer.email}
                    </Text>
                  ) : null}
                </View>
                <Icon name="verified" size={20} color={colors.emerald500} />
              </View>
              <View style={[styles.lockNote, { borderTopColor: colors.line }]}>
                <Icon name="lock" size={14} color={colors.ink400} />
                <Text style={[type.caption, styles.grow, { color: colors.ink600 }]}>Người giới thiệu đã được xác nhận và không thể thay đổi.</Text>
              </View>
            </View>
          ) : (
            <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.line }]}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.mint50 }]}>
                <Icon name="userPlus" size={22} color={colors.emerald700} />
              </View>
              <View style={styles.grow}>
                <Text style={[styles.emptyTitle, { color: colors.ink900 }]}>Chưa có người giới thiệu</Text>
                <Text style={[type.caption, { color: colors.ink600 }]}>Ai đã giới thiệu bạn đến Ellso? Thêm mã của họ.</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Thêm người giới thiệu"
                onPress={() => setAddOpen(true)}
                style={({ pressed }) => [styles.addBtn, { backgroundColor: pressed ? colors.emerald800 : colors.emerald700 }]}
              >
                <Text style={[type.captionStrong, { color: colors.onEmerald }]}>Thêm</Text>
              </Pressable>
            </View>
          )}
        </Section>

        {/* 3. Xu */}
        <Section title="Xu của bạn">
          <CoinCard coins={user.coins ?? 0} onHistory={() => router.push('/profile/lich-su-credit')} />
        </Section>
      </ScrollView>

      <AddReferrerSheet
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        onAdded={() => {
          setAddOpen(false);
          showToast('Đã thêm người giới thiệu');
        }}
      />
      {toast}
    </View>
  );
}

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.ink600 }]}>
          {title}
        </Text>
        {action}
      </View>
      {children}
    </View>
  );
}

function InfoRow({ icon, label, value, empty }: { icon: IconName; label: string; value: string | null; empty?: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { borderTopColor: colors.line }]}>
      <Icon name={icon} size={18} strokeWidth={1.9} color={colors.ink400} />
      <Text style={[styles.rowLabel, { color: colors.ink600 }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: value ? colors.ink900 : colors.ink400 }]} numberOfLines={1}>
        {value ?? empty}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  content: { paddingTop: 8, paddingHorizontal: 16, gap: 24 },
  section: { gap: 10 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 32, paddingHorizontal: 4 },
  sectionTitle: { fontFamily: fonts.sans600, fontSize: 13, lineHeight: 18, textTransform: 'uppercase', letterSpacing: 0.6 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, height: 32, borderRadius: 9999 },
  card: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  name: { fontFamily: fonts.display600, fontSize: 18, lineHeight: 26 },
  refName: { fontFamily: fonts.display600, fontSize: 16, lineHeight: 22 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingHorizontal: 16, borderTopWidth: StyleSheet.hairlineWidth },
  rowLabel: { fontFamily: fonts.sans500, fontSize: 14, lineHeight: 20 },
  rowValue: { flex: 1, minWidth: 0, textAlign: 'right', fontFamily: fonts.sans600, fontSize: 15, lineHeight: 22 },
  lockNote: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth },
  empty: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 20, borderWidth: 1 },
  emptyIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontFamily: fonts.sans600, fontSize: 15, lineHeight: 22 },
  addBtn: { paddingHorizontal: 16, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
