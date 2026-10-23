import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { Icon } from '@/components/Icon';
import { apiCheckReferral, AuthError, type Referrer } from '@/data/auth';
import { NATIVE_DRIVER } from '@/hooks/useLoop';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/typography';

import { ErrorText, PrimaryButton, SecondaryButton } from './AuthUI';

type Props = {
  visible: boolean;
  /** Người giới thiệu đang chọn (để điền sẵn mã khi mở lại). */
  current: Referrer | null;
  onClose: () => void;
  /** null = bỏ mã giới thiệu. */
  onConfirm: (r: Referrer | null) => void;
  onScanQr: () => void;
};

type Check = { state: 'idle' } | { state: 'checking' } | { state: 'valid'; referrer: Referrer } | { state: 'invalid'; message: string };

/**
 * Popup "Mã giới thiệu": nhập mã (tự kiểm tra sau khi ngừng gõ) hoặc quét QR.
 * Hợp lệ → hiện tên người mời, bấm Xác nhận để quay lại form đăng ký. Sai → báo lỗi đỏ dưới ô nhập.
 */
export function ReferralSheet({ visible, current, onClose, onConfirm, onScanQr }: Props) {
  const { colors } = useTheme();
  const [code, setCode] = useState('');
  const [check, setCheck] = useState<Check>({ state: 'idle' });
  const [focused, setFocused] = useState(false);
  const reqId = useRef(0);
  const pop = useRef(new Animated.Value(0)).current;

  // Mở lại: điền sẵn mã đang dùng
  useEffect(() => {
    if (!visible) return;
    setCode(current?.code ?? '');
    setCheck(current ? { state: 'valid', referrer: current } : { state: 'idle' });
  }, [visible, current]);

  // Kiểm tra mã sau 500ms ngừng gõ
  useEffect(() => {
    const c = code.trim();
    if (!visible) return;
    if (current && c === current.code) {
      reqId.current++;
      setCheck({ state: 'valid', referrer: current });
      return;
    }
    if (c.length < 4) {
      setCheck({ state: 'idle' });
      return;
    }
    const id = ++reqId.current;
    setCheck({ state: 'checking' });
    const t = setTimeout(() => {
      apiCheckReferral(c)
        .then((referrer) => id === reqId.current && setCheck({ state: 'valid', referrer }))
        .catch(
          (e) =>
            id === reqId.current &&
            setCheck({ state: 'invalid', message: e instanceof AuthError ? e.message : 'Không kiểm tra được mã, thử lại sau.' }),
        );
    }, 500);
    return () => clearTimeout(t);
  }, [code, visible, current]);

  useEffect(() => {
    if (check.state !== 'valid') return pop.setValue(0);
    Animated.timing(pop, { toValue: 1, duration: 500, easing: Easing.out(Easing.back(2)), useNativeDriver: NATIVE_DRIVER }).start();
  }, [check.state, pop]);

  const invalid = check.state === 'invalid';
  const empty = code.trim() === '';
  const canConfirm = check.state === 'valid' || (empty && !!current);

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Mã giới thiệu">
      <View style={styles.wrap}>
        <Text style={[styles.desc, { color: colors.ink600 }]}>Nhập mã của người giới thiệu, hoặc quét mã QR trong trang Hồ sơ của họ.</Text>

        <View style={styles.fieldWrap}>
          <View
            style={[
              styles.field,
              {
                backgroundColor: colors.card,
                borderColor: invalid ? colors.danger : focused ? colors.emerald700 : colors.line,
                boxShadow: focused ? `0px 0px 0px 4px ${invalid ? 'rgba(220,38,38,0.14)' : colors.focusRing}` : undefined,
              },
            ]}
          >
            <TextInput
              value={code}
              onChangeText={(t) => setCode(t.toUpperCase().replace(/\s/g, ''))}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              autoCapitalize="characters"
              autoCorrect={false}
              autoComplete="off"
              placeholder="VD: TIEN2026"
              placeholderTextColor={colors.ink400}
              accessibilityLabel="Mã giới thiệu"
              maxLength={16}
              style={[styles.input, { color: colors.ink900 }]}
            />
            {check.state === 'checking' && <ActivityIndicator color={colors.emerald700} />}
            {check.state === 'valid' && (
              <Animated.View
                style={[
                  styles.ok,
                  {
                    backgroundColor: colors.emerald500,
                    opacity: pop,
                    transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
                  },
                ]}
              >
                <Icon name="check" size={15} strokeWidth={3} color="#ffffff" />
              </Animated.View>
            )}
          </View>
          {invalid && <ErrorText text={check.message} />}
        </View>

        {check.state === 'valid' && (
          <View accessibilityLiveRegion="polite" style={[styles.referrer, { backgroundColor: colors.violetTint, borderColor: colors.violetLine }]}>
            <View style={[styles.avatar, { backgroundColor: colors.card }]}>
              <Text style={[styles.avatarText, { color: colors.violetText }]}>{check.referrer.initials}</Text>
            </View>
            <View style={styles.grow}>
              <Text style={[styles.refEyebrow, { color: colors.violetText }]}>Mã hợp lệ · Người giới thiệu</Text>
              <Text style={[styles.refName, { color: colors.ink900 }]}>{check.referrer.name}</Text>
            </View>
          </View>
        )}

        <View style={styles.or}>
          <View style={[styles.orLine, { backgroundColor: colors.line }]} />
          <Text style={[type.caption, { color: colors.ink400 }]}>hoặc</Text>
          <View style={[styles.orLine, { backgroundColor: colors.line }]} />
        </View>

        <SecondaryButton label="Quét mã QR" icon="scan" onPress={onScanQr} />
        <PrimaryButton
          label={empty && current ? 'Không dùng mã giới thiệu' : 'Xác nhận'}
          disabled={!canConfirm}
          onPress={() => onConfirm(check.state === 'valid' ? check.referrer : null)}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  grow: { flex: 1, minWidth: 0 },
  desc: { fontFamily: fonts.sans400, fontSize: 14, lineHeight: 21, marginTop: -6 },
  fieldWrap: { gap: 6 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 56, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1.5 },
  input: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    paddingVertical: 0,
    fontFamily: fonts.display600,
    fontSize: 20,
    letterSpacing: 2.4,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  ok: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  referrer: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1.5 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.display600, fontSize: 15, lineHeight: 20 },
  refEyebrow: { fontFamily: fonts.sans600, fontSize: 12, lineHeight: 16 },
  refName: { fontFamily: fonts.sans600, fontSize: 16, lineHeight: 22 },
  or: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  orLine: { flex: 1, height: 1 },
});
