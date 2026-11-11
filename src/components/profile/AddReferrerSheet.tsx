import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, type TextInputInstance, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { Checkbox, ErrorText, PrimaryButton } from '@/components/auth/AuthUI';
import { BottomSheet } from '@/components/BottomSheet';
import { Icon } from '@/components/Icon';
import { UserAvatar } from '@/components/UserAvatar';
import { apiPreviewReferrer, apiSetReferrer, type ReferrerPreview } from '@/data/account';
import { initialsOf } from '@/data/auth';
import { ApiError } from '@/lib/api';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/typography';

type Props = { visible: boolean; onClose: () => void; onAdded: () => void };

/**
 * Popup "Thêm người giới thiệu" (màn Thông tin cá nhân):
 * 1. Nhập mã → Kiểm tra (GET /me/referrer/preview) → hiện tên + email người giới thiệu.
 * 2. Tích xác nhận "không thể thay đổi sau khi thêm" → Xác nhận thêm (POST /me/referrer).
 * Có ô nhập: BottomSheet đã bọc KeyboardAvoidingView (padding), nút nằm ngay dưới ô nên luôn trên bàn phím.
 */
export function AddReferrerSheet({ visible, onClose, onAdded }: Props) {
  const { colors } = useTheme();
  const { token, updateUser } = useAuth();
  const [code, setCode] = useState('');
  const [focused, setFocused] = useState(false);
  const [preview, setPreview] = useState<ReferrerPreview | null>(null);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<TextInputInstance>(null);

  // Mỗi lần mở: bắt đầu lại từ bước nhập mã
  useEffect(() => {
    if (!visible) return;
    setCode('');
    setPreview(null);
    setAgree(false);
    setError(null);
  }, [visible]);

  const errorOf = (e: unknown) =>
    e instanceof ApiError ? (e.field('code') ?? e.message) : 'Không kết nối được, thử lại sau.';

  const check = async () => {
    if (!token || code.trim().length < 4 || busy) return;
    setBusy(true);
    setError(null);
    try {
      setPreview(await apiPreviewReferrer(token, code));
    } catch (e) {
      setError(errorOf(e));
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!token || !preview || !agree || busy) return;
    setBusy(true);
    setError(null);
    try {
      updateUser(await apiSetReferrer(token, preview.code));
      onAdded();
    } catch (e) {
      setError(errorOf(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Thêm người giới thiệu">
      {!preview ? (
        <View style={styles.wrap}>
          <Text style={[type.body, { color: colors.ink600 }]}>Nhập mã giới thiệu của người đã giới thiệu bạn đến Ellso.</Text>
          <View
            style={[
              styles.field,
              {
                backgroundColor: colors.card,
                borderColor: error ? colors.danger : focused ? colors.emerald700 : colors.line,
                boxShadow: focused ? `0px 0px 0px 4px ${colors.focusRing}` : undefined,
              },
            ]}
          >
            <Icon name="ticket" size={20} strokeWidth={1.9} color={colors.ink400} />
            <TextInput
              ref={inputRef}
              value={code}
              onChangeText={(t) => {
                setCode(t.toUpperCase().replace(/\s/g, ''));
                setError(null);
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              autoCapitalize="characters"
              autoCorrect={false}
              autoComplete="off"
              placeholder="VD: TIEN2026"
              placeholderTextColor={colors.ink400}
              accessibilityLabel="Mã giới thiệu"
              maxLength={16}
              returnKeyType="done"
              onSubmitEditing={check}
              style={[styles.input, { color: colors.ink900 }]}
            />
            {busy && <ActivityIndicator color={colors.emerald700} />}
          </View>
          {error ? <ErrorText text={error} /> : null}
          <PrimaryButton label="Kiểm tra mã" disabled={code.trim().length < 4} loading={busy} onPress={check} />
        </View>
      ) : (
        <View style={styles.wrap}>
          <View accessibilityLiveRegion="polite" style={[styles.person, { backgroundColor: colors.mint50, borderColor: colors.mint100 }]}>
            <UserAvatar initials={initialsOf(preview.name)} size={48} bg={colors.card} fg={colors.emerald800} />
            <View style={styles.grow}>
              <Text style={[styles.eyebrow, { color: colors.emerald700 }]}>Mã hợp lệ · {preview.code}</Text>
              <Text style={[styles.name, { color: colors.ink900 }]} numberOfLines={1}>
                {preview.name}
              </Text>
              <Text style={[type.caption, { color: colors.ink600 }]} numberOfLines={1}>
                {preview.email}
              </Text>
            </View>
          </View>

          <View style={[styles.warn, { backgroundColor: colors.orangeTint, borderColor: colors.orangeLine }]}>
            <Icon name="alert" size={18} color={colors.orangeText} />
            <Text style={[styles.warnText, { color: colors.orangeText }]}>
              Người giới thiệu sẽ không thể thay đổi sau khi đã thêm. Hãy kiểm tra kỹ tên và email.
            </Text>
          </View>

          <Checkbox checked={agree} onChange={setAgree}>
            <Text style={[type.body, { color: colors.ink900 }]}>Tôi đã kiểm tra và hiểu người giới thiệu không thể thay đổi</Text>
          </Checkbox>

          {error ? <ErrorText text={error} /> : null}
          <PrimaryButton label="Xác nhận thêm" disabled={!agree} loading={busy} onPress={confirm} />
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setPreview(null);
              setAgree(false);
              setError(null);
              setTimeout(() => inputRef.current?.focus(), 50);
            }}
            hitSlop={8}
            style={styles.again}
          >
            <Text style={[type.label, { color: colors.emerald700 }]}>Nhập mã khác</Text>
          </Pressable>
        </View>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  grow: { flex: 1, minWidth: 0 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 52, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1.5 },
  input: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    fontFamily: fonts.display600,
    fontSize: 17,
    letterSpacing: 1.6,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  person: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  eyebrow: { fontFamily: fonts.sans600, fontSize: 12, lineHeight: 16 },
  name: { fontFamily: fonts.display600, fontSize: 17, lineHeight: 24 },
  warn: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 14, borderWidth: 1 },
  warnText: { flex: 1, fontFamily: fonts.sans500, fontSize: 13, lineHeight: 19 },
  again: { alignSelf: 'center', paddingVertical: 4 },
});
