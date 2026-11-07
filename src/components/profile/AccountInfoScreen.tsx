import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { Icon, type IconName } from '@/components/Icon';
import { SubpageHeader } from '@/components/SubpageHeader';
import { UserAvatar } from '@/components/UserAvatar';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/typography';

import { InfoSection } from './InfoSection';

/** "0912345678" → "0912 345 678" */
const formatPhone = (p: string) => (/^\d{10}$/.test(p) ? `${p.slice(0, 4)} ${p.slice(4, 7)} ${p.slice(7)}` : p);

/**
 * Hồ sơ › Thông tin cá nhân (chỉ xem):
 * 1. Thông tin cá nhân (ảnh, họ tên, SĐT, email) + nút "Thay đổi" → /account/edit (màn sửa).
 * Mỗi lần vào màn: làm mới GET /me.
 */
export function AccountInfoScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshUser();
    }, [refreshUser]),
  );

  if (!user) return null;

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
        <InfoSection
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
        </InfoSection>

      </ScrollView>

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
  action: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, height: 32, borderRadius: 9999 },
  card: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  name: { fontFamily: fonts.display600, fontSize: 18, lineHeight: 26 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingHorizontal: 16, borderTopWidth: StyleSheet.hairlineWidth },
  rowLabel: { fontFamily: fonts.sans500, fontSize: 14, lineHeight: 20 },
  rowValue: { flex: 1, minWidth: 0, textAlign: 'right', fontFamily: fonts.sans600, fontSize: 15, lineHeight: 22 },
});
