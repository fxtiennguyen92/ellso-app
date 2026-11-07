import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { BottomSheet } from '@/components/BottomSheet';
import { Icon } from '@/components/Icon';
import { apiListDevices, apiRevokeDevice, type Device } from '@/data/account';
import { dmy } from '@/data/profile';
import { ApiError } from '@/lib/api';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/typography';

const PLATFORM: Record<NonNullable<Device['platform']>, string> = { ios: 'iOS', android: 'Android', web: 'Web' };

/** "Vừa xong" · "12 phút trước" · "3 giờ trước" · "Hôm qua, 14:05" · "05/11/2026, 09:30" */
function lastUsed(iso: string | null): string {
  if (!iso) return 'Chưa rõ';
  const d = new Date(iso);
  const mins = Math.floor((Date.now() - d.getTime()) / 60_000);
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  if (mins < 24 * 60 && new Date().getDate() === d.getDate()) return `${Math.floor(mins / 60)} giờ trước`;
  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (y.toDateString() === d.toDateString()) return `Hôm qua, ${hm}`;
  return `${dmy(iso)}, ${hm}`;
}

export type DevicesSectionHandle = { reload: () => void };

/**
 * Mật khẩu & Bảo mật › Thiết bị đăng nhập (GET /v1/me/devices).
 * Mỗi dòng: tên máy, nền tảng + phiên bản, lần dùng cuối. Máy đang dùng có nhãn "Thiết bị này", không xoá được
 * (đăng xuất ở Hồ sơ). Máy khác có nút xoá → sheet xác nhận → DELETE /v1/me/devices/{id} (đăng xuất tài khoản trên máy đó).
 */
export const DevicesSection = forwardRef<DevicesSectionHandle, { onToast: (m: string) => void }>(function DevicesSection({ onToast }, ref) {
  const { colors } = useTheme();
  const { token } = useAuth();
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [confirm, setConfirm] = useState<Device | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setDevices(await apiListDevices(token));
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);
  useImperativeHandle(ref, () => ({ reload: load }), [load]);

  const revoke = async () => {
    if (!token || !confirm || busy) return;
    setBusy(true);
    try {
      await apiRevokeDevice(token, confirm.id);
      setDevices((list) => list?.filter((d) => d.id !== confirm.id) ?? null);
      onToast(`Đã đăng xuất trên ${confirm.name}`);
      setConfirm(null);
    } catch (e) {
      onToast(e instanceof ApiError ? e.message : 'Không đăng xuất được, thử lại sau.');
      if (e instanceof ApiError && e.status === 404) {
        setConfirm(null);
        load();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      {devices === null ? (
        <View style={[styles.card, styles.center, { backgroundColor: colors.card, borderColor: colors.line }]}>
          {loadError ? (
            <Pressable accessibilityRole="button" onPress={load} hitSlop={8}>
              <Text style={[type.label, { color: colors.emerald700 }]}>Không tải được. Thử lại</Text>
            </Pressable>
          ) : (
            <ActivityIndicator color={colors.emerald700} />
          )}
        </View>
      ) : (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line }]}>
          {devices.map((d, i) => {
            const meta = [d.platform ? `${PLATFORM[d.platform]}${d.osVersion ? ` ${d.osVersion}` : ''}` : null, d.appVersion ? `App ${d.appVersion}` : null]
              .filter(Boolean)
              .join(' · ');
            return (
              <View key={d.id} style={[styles.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line }]}>
                <View style={[styles.icon, { backgroundColor: d.current ? colors.mint50 : colors.surfaceAlt }]}>
                  <Icon name={d.platform === 'web' ? 'monitor' : 'phone'} size={20} color={d.current ? colors.emerald700 : colors.ink600} />
                </View>
                <View style={styles.grow}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.name, { color: colors.ink900 }]} numberOfLines={1}>
                      {d.name}
                    </Text>
                    {d.current && (
                      <View style={[styles.badge, { backgroundColor: colors.mint50 }]}>
                        <Text style={[styles.badgeText, { color: colors.emerald700 }]}>Thiết bị này</Text>
                      </View>
                    )}
                  </View>
                  {meta ? (
                    <Text style={[type.caption, { color: colors.ink600 }]} numberOfLines={1}>
                      {meta}
                    </Text>
                  ) : null}
                  <Text style={[type.caption, { color: colors.ink400 }]} numberOfLines={1}>
                    {d.current ? 'Đang dùng' : `Dùng lần cuối: ${lastUsed(d.lastUsedAt)}`}
                  </Text>
                </View>
                {!d.current && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Đăng xuất khỏi ${d.name}`}
                    onPress={() => setConfirm(d)}
                    hitSlop={6}
                    style={({ pressed }) => [styles.remove, { backgroundColor: pressed ? colors.dangerTint : 'transparent' }]}
                  >
                    <Icon name="trash" size={19} color={colors.danger} />
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>
      )}

      <BottomSheet visible={!!confirm} onClose={() => !busy && setConfirm(null)} title="Đăng xuất khỏi thiết bị?">
        <Text style={[type.body, { color: colors.ink600 }]}>
          Tài khoản sẽ bị đăng xuất trên <Text style={{ fontFamily: fonts.sans700, color: colors.ink900 }}>{confirm?.name}</Text>. Muốn dùng lại trên
          thiết bị đó cần đăng nhập lại.
        </Text>
        <View style={styles.confirmRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setConfirm(null)}
            disabled={busy}
            style={({ pressed }) => [styles.secondary, { borderColor: colors.line, backgroundColor: pressed ? colors.surfaceAlt : colors.card }]}
          >
            <Text style={[type.label, { color: colors.ink900 }]}>Huỷ</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy }}
            onPress={revoke}
            style={({ pressed }) => [styles.danger, { backgroundColor: colors.danger, opacity: pressed || busy ? 0.85 : 1 }]}
          >
            {busy ? <ActivityIndicator color={colors.onEmerald} /> : <Text style={[type.label, { color: colors.onEmerald }]}>Đăng xuất</Text>}
          </Pressable>
        </View>
      </BottomSheet>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  grow: { flex: 1, minWidth: 0 },
  card: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  center: { minHeight: 72, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingLeft: 14, paddingRight: 8 },
  icon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flexShrink: 1, fontFamily: fonts.sans600, fontSize: 15, lineHeight: 22 },
  badge: { paddingHorizontal: 8, height: 20, borderRadius: 9999, justifyContent: 'center' },
  badgeText: { fontFamily: fonts.sans600, fontSize: 11, lineHeight: 14 },
  remove: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  confirmRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  secondary: { flex: 1, height: 48, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  danger: { flex: 1, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
