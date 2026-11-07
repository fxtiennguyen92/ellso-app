import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { PrimaryButton } from '@/components/auth/AuthUI';
import { FloatingAction } from '@/components/FloatingAction';
import { Icon } from '@/components/Icon';
import { useToast } from '@/components/Toast';
import { UserAvatar } from '@/components/UserAvatar';
import { initialsOf } from '@/data/auth';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/typography';

import { AddReferrerSheet } from './AddReferrerSheet';
import { SubpageShell } from './SubpageShell';

/**
 * Hồ sơ › Người giới thiệu.
 * - Đã có: tên + email người giới thiệu, ghi chú không thể thay đổi.
 * - Chưa có: giải thích ngắn + nút nổi "Thêm người giới thiệu" → AddReferrerSheet (nhập mã → xem tên + email → xác nhận).
 */
export function ReferrerScreen() {
  const { colors } = useTheme();
  const { user, refreshUser } = useAuth();
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
    <SubpageShell
      title="Người giới thiệu"
      floating={
        referrer ? undefined : (
          <FloatingAction>
            <PrimaryButton label="Thêm người giới thiệu" onPress={() => setAddOpen(true)} />
          </FloatingAction>
        )
      }
      overlay={
        <>
          <AddReferrerSheet
            visible={addOpen}
            onClose={() => setAddOpen(false)}
            onAdded={() => {
              setAddOpen(false);
              showToast('Đã thêm người giới thiệu');
            }}
          />
          {toast}
        </>
      }
    >
      {referrer ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line }]}>
          <View style={styles.identity}>
            <UserAvatar initials={initialsOf(referrer.name)} size={56} bg={colors.mint50} fg={colors.emerald800} />
            <View style={styles.grow}>
              <Text style={[type.caption, { color: colors.ink600 }]}>Người giới thiệu bạn</Text>
              <Text style={[styles.name, { color: colors.ink900 }]} numberOfLines={1}>
                {referrer.name}
              </Text>
              {referrer.email ? (
                <Text style={[type.caption, { color: colors.ink600 }]} numberOfLines={1}>
                  {referrer.email}
                </Text>
              ) : null}
            </View>
            <Icon name="verified" size={22} color={colors.emerald500} />
          </View>
          <View style={[styles.lockNote, { borderTopColor: colors.line }]}>
            <Icon name="lock" size={14} color={colors.ink400} />
            <Text style={[type.caption, styles.grow, { color: colors.ink600 }]}>Người giới thiệu đã được xác nhận và không thể thay đổi.</Text>
          </View>
        </View>
      ) : (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.mint50 }]}>
            <Icon name="userPlus" size={36} strokeWidth={1.8} color={colors.emerald700} />
          </View>
          <Text accessibilityRole="header" style={[type.sectionTitle, styles.center, { color: colors.ink900 }]}>
            Chưa có người giới thiệu
          </Text>
          <Text style={[type.body, styles.center, { color: colors.ink600 }]}>
            Ai đã giới thiệu bạn đến Ellso? Nhập mã giới thiệu của họ. Người giới thiệu chỉ thêm được một lần và không thể thay đổi.
          </Text>
        </View>
      )}
    </SubpageShell>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  center: { textAlign: 'center' },
  card: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginTop: 8 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  name: { fontFamily: fonts.display600, fontSize: 18, lineHeight: 26 },
  lockNote: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth },
  empty: { alignItems: 'center', gap: 12, paddingTop: 48, paddingHorizontal: 16 },
  emptyIcon: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
});
