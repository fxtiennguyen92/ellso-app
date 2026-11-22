import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { AuthField, ErrorText, PrimaryButton } from '@/components/auth/AuthUI';
import { BottomSheet } from '@/components/BottomSheet';
import { Mascot, MASCOTS, type MascotName } from '@/components/mascots/Mascot';
import { FloatingAction, floatingActionSpace } from '@/components/FloatingAction';
import { Icon, type IconName } from '@/components/Icon';
import { SubpageHeader } from '@/components/SubpageHeader';
import { useToast } from '@/components/Toast';
import { UserAvatar } from '@/components/UserAvatar';
import { apiChooseMascot, apiDeleteAvatar, apiUpdateProfile, apiUploadAvatar, isValidPhone, normalizePhone } from '@/data/account';
import { ApiError } from '@/lib/api';
import { type AvatarSource, pickAvatar } from '@/lib/pickAvatar';
import { useKeyboardForm } from '@/hooks/useKeyboardForm';
import { useTheme } from '@/theme/ThemeProvider';
import { illo } from '@/theme/tokens';
import { fonts, type } from '@/theme/typography';

/**
 * Hồ sơ › Thông tin cá nhân.
 * - Ảnh đại diện: chụp / chọn từ thư viện (cắt vuông, 512px) → tải lên ngay; có thể xoá về chữ viết tắt.
 * - Họ tên + số điện thoại: sửa rồi bấm Lưu (PATCH /me). SĐT nhận cả dạng +84, có khoảng trắng.
 * - Email chỉ xem (dùng để đăng nhập).
 */
export function PersonalInfoScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, token, updateUser } = useAuth();
  const [toast, showToast] = useToast();

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string; form?: string }>({});
  const [saving, setSaving] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const form = useKeyboardForm();
  const [sheet, setSheet] = useState(false);
  const [uploading, setUploading] = useState(false);

  const nameOk = name.trim().length > 0;
  const phoneOk = isValidPhone(phone);
  const dirty = name.trim() !== (user?.name ?? '') || normalizePhone(phone) !== (user?.phone ?? '');
  const canSave = !!token && dirty && nameOk && phoneOk && !saving;

  const save = async () => {
    if (!canSave || !token) return;
    setSaving(true);
    setErrors({});
    try {
      const u = await apiUpdateProfile(token, { name: name.trim(), phone: normalizePhone(phone) });
      updateUser(u);
      setName(u.name);
      setPhone(u.phone ?? '');
      showToast('Đã lưu thông tin');
    } catch (e) {
      if (e instanceof ApiError) setErrors({ name: e.field('name'), phone: e.field('phone'), form: e.field('name') || e.field('phone') ? undefined : e.message });
      else setErrors({ form: 'Không lưu được, thử lại sau.' });
    } finally {
      setSaving(false);
    }
  };

  const choose = async (source: AvatarSource) => {
    setSheet(false);
    if (!token) return;
    // đợi bảng chọn đóng hẳn rồi mới mở trình chọn ảnh của hệ thống (iOS không mở 2 modal chồng nhau)
    await new Promise((r) => setTimeout(r, 300));
    const picked = await pickAvatar(source);
    if (!picked) return;
    if ('error' in picked) {
      showToast(picked.error);
      return;
    }
    setUploading(true);
    try {
      updateUser(await apiUploadAvatar(token, picked.uri));
      showToast('Đã cập nhật ảnh đại diện');
    } catch (e) {
      showToast(e instanceof ApiError ? (e.field('avatar') ?? e.message) : 'Không tải được ảnh lên, thử lại sau.');
    } finally {
      setUploading(false);
    }
  };

  const chooseMascot = async (m: MascotName) => {
    setSheet(false);
    if (!token || m === user?.avatarMascot) return;
    setUploading(true);
    try {
      updateUser(await apiChooseMascot(token, m));
      showToast(`Đã chọn ${MASCOTS.find((x) => x.name === m)?.label ?? 'mascot'} làm ảnh đại diện`);
    } catch (e) {
      showToast(e instanceof ApiError ? (e.field('mascot') ?? e.message) : 'Không đổi được ảnh đại diện, thử lại sau.');
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    setSheet(false);
    if (!token) return;
    setUploading(true);
    try {
      updateUser(await apiDeleteAvatar(token));
      showToast('Đã xoá ảnh đại diện');
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'Không xoá được ảnh, thử lại sau.');
    } finally {
      setUploading(false);
    }
  };

  const options: { key: string; icon: IconName; label: string; onPress: () => void; danger?: boolean }[] = [
    // Web không chụp trực tiếp được ổn định → chỉ chọn ảnh
    ...(Platform.OS === 'web' ? [] : [{ key: 'camera', icon: 'camera' as const, label: 'Chụp ảnh', onPress: () => choose('camera') }]),
    { key: 'library', icon: 'image', label: Platform.OS === 'web' ? 'Chọn ảnh từ máy' : 'Chọn từ thư viện ảnh', onPress: () => choose('library') },
    ...(user?.avatar || user?.avatarMascot ? [{ key: 'remove', icon: 'trash' as const, label: 'Xoá ảnh đại diện', onPress: removeAvatar, danger: true }] : []),
  ];

  return (
    <KeyboardAvoidingView style={[styles.screen, { backgroundColor: colors.bg }]} behavior="padding">
      <SubpageHeader title="Sửa thông tin cá nhân" scrolled={scrolled} />

      <View style={styles.screen}>
      <ScrollView
        ref={form.scrollRef}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        onScroll={(e) => setScrolled(e.nativeEvent.contentOffset.y > 4)}
        contentContainerStyle={[styles.content, { paddingBottom: floatingActionSpace(insets.bottom) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Ảnh đại diện */}
        <View style={styles.avatarBlock}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Đổi ảnh đại diện"
            disabled={uploading}
            onPress={() => setSheet(true)}
            style={({ pressed }) => [styles.avatarPress, { opacity: pressed ? 0.85 : 1 }]}
          >
            <UserAvatar uri={user?.avatar} mascot={user?.avatarMascot} initials={user?.initials ?? '?'} size={112} bg={colors.mint100} fg={colors.emerald800} borderColor={colors.card} borderWidth={4} />
            {uploading && (
              <View style={[styles.uploading, { backgroundColor: illo.scrim }]}>
                <ActivityIndicator color={colors.onEmerald} />
              </View>
            )}
            <View style={[styles.cameraBadge, { backgroundColor: colors.emerald700, borderColor: colors.bg }]}>
              <Icon name="camera" size={16} strokeWidth={2.2} color={colors.onEmerald} />
            </View>
          </Pressable>
          <Pressable accessibilityRole="button" disabled={uploading} onPress={() => setSheet(true)} hitSlop={8}>
            <Text style={[type.label, { color: colors.emerald700 }]}>{uploading ? 'Đang tải ảnh lên…' : 'Đổi ảnh đại diện'}</Text>
          </Pressable>
        </View>

        {/* cả khối form là một mốc cuộn: bấm ô nào cũng cuộn khối form lên đầu vùng nhìn thấy (2 ô ngắn, vừa màn) */}
        <View style={styles.form} {...form.field('form').wrap}>
          <AuthField
            label="Họ và tên"
            onFocus={form.field('form').onFocus}
            icon="user"
            value={name}
            onChangeText={(t) => {
              setName(t);
              setErrors((x) => ({ ...x, name: undefined, form: undefined }));
            }}
            error={errors.name ?? (!nameOk ? 'Vui lòng nhập họ tên.' : null)}
            placeholder="Nguyễn Văn A"
            autoComplete="name"
            textContentType="name"
            autoCapitalize="words"
            maxLength={255}
            returnKeyType="next"
          />

          <AuthField
            label={
              <Text>
                Số điện thoại <Text style={{ color: colors.ink400, fontFamily: fonts.sans400 }}>(không bắt buộc)</Text>
              </Text>
            }
            icon="phone"
            value={phone}
            onChangeText={(t) => {
              setPhone(t);
              setErrors((x) => ({ ...x, phone: undefined, form: undefined }));
            }}
            onFocus={form.field('form').onFocus}
            onBlur={() => setPhoneTouched(true)}
            error={errors.phone ?? (phoneTouched && !phoneOk ? 'Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0).' : null)}
            placeholder="0912 345 678"
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            maxLength={20}
            returnKeyType="done"
            onSubmitEditing={save}
          />

          {/* Email: chỉ xem */}
          <View style={styles.readonly}>
            <Text style={[type.label, { color: colors.ink900 }]}>Email</Text>
            <View style={[styles.readonlyBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.line }]}>
              <Icon name="mail" size={20} strokeWidth={1.9} color={colors.ink400} />
              <Text style={[styles.readonlyText, { color: colors.ink600 }]} numberOfLines={1}>
                {user?.email}
              </Text>
              <Icon name="lock" size={16} color={colors.ink400} />
            </View>
            <Text style={[type.caption, { color: colors.ink600 }]}>Email dùng để đăng nhập nên không đổi ở đây.</Text>
          </View>

          {errors.form ? <ErrorText text={errors.form} /> : null}
        </View>
      </ScrollView>

      {/* Nút chính nổi trên nội dung; nằm trong khung co theo bàn phím → luôn ngay trên bàn phím */}
      <FloatingAction keyboardOpen={form.keyboardOpen}>
        <PrimaryButton label={dirty ? 'Lưu thay đổi' : 'Chưa có thay đổi'} disabled={!canSave} loading={saving} onPress={save} />
      </FloatingAction>
      </View>

      <BottomSheet visible={sheet} onClose={() => setSheet(false)} title="Ảnh đại diện">
        {/* Chọn mascot: vẽ tại chỗ, chớp mắt và thỉnh thoảng cử động nhẹ khi làm ảnh đại diện */}
        <Text style={[styles.sheetSection, { color: colors.ink600 }]}>Chọn một mascot của Ellso</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mascotRow} style={styles.mascotScroll}>
          {MASCOTS.map((m) => {
            const on = user?.avatarMascot === m.name;
            return (
              <Pressable
                key={m.name}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${m.label}, ${m.role}`}
                onPress={() => chooseMascot(m.name)}
                style={({ pressed }) => [styles.mascotItem, pressed && { transform: [{ scale: 0.96 }] }]}
              >
                <View style={[styles.mascotRing, { borderColor: on ? colors.emerald700 : 'transparent' }]}>
                  <View style={[styles.mascotFace, { backgroundColor: colors.mint50 }]}>
                    <Mascot name={m.name} size={64} crop="face" motion="subtle" />
                  </View>
                  {on && (
                    <View style={[styles.mascotCheck, { backgroundColor: colors.emerald700, borderColor: colors.card }]}>
                      <Icon name="check" size={11} strokeWidth={3.2} color={colors.onEmerald} />
                    </View>
                  )}
                </View>
                <Text style={[styles.mascotLabel, { color: on ? colors.emerald700 : colors.ink900 }]}>{m.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <Text style={[styles.sheetSection, { color: colors.ink600 }]}>Hoặc dùng ảnh của bạn</Text>
        <View style={[styles.sheetList, { borderColor: colors.line, backgroundColor: colors.card }]}>
          {options.map((o, i) => (
            <Pressable
              key={o.key}
              accessibilityRole="button"
              onPress={o.onPress}
              style={({ pressed }) => [
                styles.sheetRow,
                i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
                pressed && { backgroundColor: colors.surfaceAlt },
              ]}
            >
              <View style={[styles.sheetIcon, { backgroundColor: o.danger ? colors.dangerTint : colors.mint50 }]}>
                <Icon name={o.icon} size={18} color={o.danger ? colors.danger : colors.emerald700} />
              </View>
              <Text style={[styles.sheetLabel, { color: o.danger ? colors.danger : colors.ink900 }]}>{o.label}</Text>
            </Pressable>
          ))}
        </View>
      </BottomSheet>

      {toast}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingTop: 8, paddingBottom: 32 },
  avatarBlock: { alignItems: 'center', gap: 12, paddingTop: 8, paddingBottom: 8 },
  avatarPress: { width: 112, height: 112 },
  uploading: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 56, alignItems: 'center', justifyContent: 'center' },
  cameraBadge: { position: 'absolute', right: 0, bottom: 2, width: 36, height: 36, borderRadius: 18, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  form: { paddingTop: 20, paddingHorizontal: 20, gap: 18 },
  readonly: { gap: 8 },
  readonlyBox: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 52, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1 },
  readonlyText: { flex: 1, minWidth: 0, fontFamily: fonts.sans500, fontSize: 15 },
  sheetSection: { fontFamily: fonts.sans600, fontSize: 13, lineHeight: 18, marginBottom: 8 },
  mascotScroll: { flexGrow: 0, marginHorizontal: -4, marginBottom: 16 },
  mascotRow: { gap: 10, paddingHorizontal: 4 },
  mascotItem: { alignItems: 'center', gap: 6, width: 76 },
  mascotRing: { width: 74, height: 74, borderRadius: 37, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  mascotFace: { width: 64, height: 64, borderRadius: 32, overflow: 'hidden' },
  mascotCheck: { position: 'absolute', right: -1, bottom: -1, width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  mascotLabel: { fontFamily: fonts.sans600, fontSize: 13, lineHeight: 18 },
  sheetList: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingHorizontal: 14 },
  sheetIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  sheetLabel: { fontFamily: fonts.sans500, fontSize: 15, lineHeight: 22 },
});
