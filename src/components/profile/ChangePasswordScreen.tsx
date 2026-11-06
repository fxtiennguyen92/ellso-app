import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, type TextInputInstance, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { AuthField, ErrorText, Note, PrimaryButton } from '@/components/auth/AuthUI';
import { Icon } from '@/components/Icon';
import { SubpageHeader } from '@/components/SubpageHeader';
import { apiUpdatePassword } from '@/data/account';
import { PASSWORD_MAX, passwordRules, passwordStrength } from '@/data/auth';
import { ApiError } from '@/lib/api';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/typography';

/**
 * Hồ sơ › Đổi mật khẩu (POST /v1/me/password).
 * Cùng quy tắc với màn đặt mật khẩu lần đầu: ≥ 8 ký tự, chữ hoa + chữ thường, có số, tối đa 100;
 * thêm: phải khác mật khẩu hiện tại. Đổi xong server đăng xuất các thiết bị khác, máy này giữ đăng nhập.
 */
export function ChangePasswordScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();

  const [current, setCurrent] = useState('');
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ current?: string; pw?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const newRef = useRef<TextInputInstance>(null);
  const confirmRef = useRef<TextInputInstance>(null);

  const rules = useMemo(() => passwordRules(pw, current, 'Khác mật khẩu hiện tại'), [pw, current]);
  const strength = passwordStrength(pw);
  const allOk = rules.every((r) => r.ok);
  const mismatch = confirm.length > 0 && confirm !== pw;
  const canSave = !!token && current.length > 0 && allOk && confirm === pw && !loading;

  const strengthColor = [colors.line, colors.danger, colors.orangeBar, colors.spark500, colors.emerald500][strength.score];
  const strengthText = [colors.ink600, colors.danger, colors.orangeText, colors.amberChipText, colors.emerald700][strength.score];

  const save = async () => {
    if (!canSave || !token) return;
    setLoading(true);
    setErrors({});
    try {
      await apiUpdatePassword(token, current, pw);
      setDone(true);
    } catch (e) {
      if (e instanceof ApiError) {
        const c = e.field('current_password');
        const p = e.field('password');
        setErrors({ current: c, pw: p, form: c || p ? undefined : e.message });
      } else setErrors({ form: 'Không đổi được mật khẩu, thử lại sau.' });
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.bg }]}>
        <SubpageHeader title="Đổi mật khẩu" />
        <View style={styles.doneWrap}>
          <View style={[styles.doneIcon, { backgroundColor: colors.mint50 }]}>
            <Icon name="shield" size={40} strokeWidth={1.8} color={colors.emerald700} />
          </View>
          <Text accessibilityRole="header" style={[type.sectionTitle, styles.center, { color: colors.ink900 }]}>
            Đã đổi mật khẩu
          </Text>
          <Text style={[type.body, styles.center, { color: colors.ink600 }]}>
            Lần đăng nhập sau hãy dùng mật khẩu mới. Các thiết bị khác đã được đăng xuất để giữ an toàn cho tài khoản.
          </Text>
        </View>
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12), borderTopColor: colors.line }]}>
          <PrimaryButton label="Về Hồ sơ" onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile'))} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={[styles.screen, { backgroundColor: colors.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SubpageHeader title="Đổi mật khẩu" scrolled={scrolled} />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        onScroll={(e) => setScrolled(e.nativeEvent.contentOffset.y > 4)}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Note>Đổi xong, các thiết bị khác đang đăng nhập tài khoản này sẽ bị đăng xuất. Máy này vẫn giữ đăng nhập.</Note>

        <AuthField
          label="Mật khẩu hiện tại"
          icon="lock"
          password
          value={current}
          onChangeText={(t) => {
            setCurrent(t);
            setErrors((x) => ({ ...x, current: undefined, form: undefined }));
          }}
          error={errors.current}
          placeholder="Nhập mật khẩu đang dùng"
          autoCapitalize="none"
          autoComplete="current-password"
          textContentType="password"
          maxLength={PASSWORD_MAX}
          returnKeyType="next"
          onSubmitEditing={() => newRef.current?.focus()}
          submitBehavior="submit"
        />

        <View style={[styles.divider, { backgroundColor: colors.line }]} />

        <AuthField
          ref={newRef}
          label="Mật khẩu mới"
          icon="key"
          password
          value={pw}
          onChangeText={(t) => {
            setPw(t);
            setErrors((x) => ({ ...x, pw: undefined, form: undefined }));
          }}
          error={errors.pw}
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          maxLength={PASSWORD_MAX}
          returnKeyType="next"
          onSubmitEditing={() => confirmRef.current?.focus()}
          submitBehavior="submit"
          below={
            pw ? (
              <View style={styles.strength} accessible accessibilityLabel={`Độ mạnh mật khẩu: ${strength.label}`}>
                <View style={styles.bars}>
                  {[1, 2, 3, 4].map((i) => (
                    <View key={i} style={[styles.bar, { backgroundColor: i <= strength.score ? strengthColor : colors.line }]} />
                  ))}
                </View>
                <Text style={[styles.strengthText, { color: strengthText }]}>{strength.label}</Text>
              </View>
            ) : null
          }
        />

        <View style={[styles.rules, { backgroundColor: colors.card, borderColor: colors.line }]}>
          {rules.map((r) => (
            <View key={r.key} style={styles.rule} accessible accessibilityLabel={`${r.label}: ${r.ok ? 'đạt' : 'chưa đạt'}`}>
              {r.ok ? (
                <Icon name="check" size={16} strokeWidth={2.6} color={colors.emerald500} />
              ) : (
                <View style={[styles.dot, { borderColor: colors.ink400 }]} />
              )}
              <Text style={[styles.ruleText, { color: r.ok ? colors.ink900 : colors.ink600 }]}>{r.label}</Text>
            </View>
          ))}
        </View>

        <AuthField
          ref={confirmRef}
          label="Nhập lại mật khẩu mới"
          icon="key"
          password
          value={confirm}
          onChangeText={setConfirm}
          error={mismatch ? 'Mật khẩu nhập lại chưa khớp.' : null}
          placeholder="Nhập lại mật khẩu mới"
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          maxLength={PASSWORD_MAX}
          returnKeyType="done"
          onSubmitEditing={save}
        />

        {errors.form ? <ErrorText text={errors.form} /> : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12), backgroundColor: colors.bg, borderTopColor: colors.line }]}>
        <PrimaryButton label="Đổi mật khẩu" disabled={!canSave} loading={loading} onPress={save} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { textAlign: 'center' },
  content: { paddingTop: 8, paddingHorizontal: 20, paddingBottom: 32, gap: 18 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 2 },
  strength: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bars: { flex: 1, flexDirection: 'row', gap: 4 },
  bar: { flex: 1, height: 5, borderRadius: 9999 },
  strengthText: { minWidth: 70, textAlign: 'right', fontFamily: fonts.sans600, fontSize: 12, lineHeight: 16 },
  rules: { marginTop: -6, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, gap: 6 },
  rule: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 15, height: 15, borderRadius: 8, borderWidth: 2, marginHorizontal: 0.5 },
  ruleText: { fontFamily: fonts.sans400, fontSize: 13, lineHeight: 18 },
  footer: { paddingTop: 12, paddingHorizontal: 20, borderTopWidth: StyleSheet.hairlineWidth },
  doneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  doneIcon: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
});
