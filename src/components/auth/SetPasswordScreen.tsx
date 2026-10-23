import { useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, type TextInputInstance, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { EllsoLogo } from '@/components/EllsoLogo';
import { Icon } from '@/components/Icon';
import { AuthError, passwordRules, passwordStrength } from '@/data/auth';
import { useScreenTopInset } from '@/hooks/useScreenTopInset';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/typography';

import { KeyArt } from './AuthArt';
import { AuthField, AuthScreen, ErrorText, PrimaryButton, TextLink } from './AuthUI';

/**
 * Đặt mật khẩu mới — bắt buộc sau khi đăng nhập bằng mật khẩu tạm (đăng ký mới / quên mật khẩu).
 * Không vào được app cho tới khi đổi xong; "Đăng xuất" để quay về màn đăng nhập.
 */
export function SetPasswordScreen() {
  const { colors } = useTheme();
  const { user, tempPassword, changePassword, logout } = useAuth();
  const topInset = useScreenTopInset(12, 28);

  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const confirmRef = useRef<TextInputInstance>(null);

  const rules = useMemo(() => passwordRules(pw, tempPassword), [pw, tempPassword]);
  const strength = passwordStrength(pw);
  const allOk = rules.every((r) => r.ok);
  const mismatch = confirm.length > 0 && confirm !== pw;
  const canSave = allOk && confirm === pw && !loading;

  const strengthColor = [colors.line, colors.danger, colors.orangeBar, colors.spark500, colors.emerald500][strength.score];
  const strengthText = [colors.ink600, colors.danger, colors.orangeText, colors.amberChipText, colors.emerald700][strength.score];

  const save = async () => {
    if (!canSave) return;
    setLoading(true);
    setError(null);
    try {
      await changePassword(pw);
      // thành công: status → signedIn, router tự vào app
    } catch (e) {
      setError(e instanceof AuthError ? e.message : 'Không lưu được mật khẩu, thử lại sau.');
      setLoading(false);
    }
  };

  return (
    <AuthScreen contentStyle={{ paddingTop: topInset }}>
      <View style={styles.top}>
        <EllsoLogo width={96} color={colors.emerald500} />
        <TextLink label="Đăng xuất" muted onPress={logout} />
      </View>

      {/* Trạng thái: đang dùng mật khẩu tạm */}
      <View style={[styles.banner, { backgroundColor: colors.amberChip }]}>
        <KeyArt hole={colors.amberChip} />
        <View style={styles.grow}>
          <Text style={[styles.bannerTitle, { color: colors.amberChipText }]}>Bạn đang dùng mật khẩu tạm</Text>
          <Text style={[styles.bannerText, { color: colors.amberChipText }]}>Hãy đặt mật khẩu của riêng bạn để bắt đầu học.</Text>
        </View>
      </View>

      <View style={styles.form}>
        <View style={styles.head}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.ink900 }]}>
            Đặt mật khẩu mới
          </Text>
          {user && (
            <View style={[styles.who, { backgroundColor: colors.card, borderColor: colors.line }]}>
              <View style={[styles.whoAvatar, { backgroundColor: colors.mint50 }]}>
                <Text style={[styles.whoInitials, { color: colors.emerald700 }]}>{user.initials}</Text>
              </View>
              <Text style={[styles.whoEmail, { color: colors.ink600 }]} numberOfLines={1}>
                {user.email}
              </Text>
            </View>
          )}
        </View>

        <AuthField
          label="Mật khẩu mới"
          icon="lock"
          password
          value={pw}
          onChangeText={(t) => {
            setPw(t);
            setError(null);
          }}
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
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
          icon="lock"
          password
          value={confirm}
          onChangeText={setConfirm}
          error={mismatch ? 'Mật khẩu nhập lại chưa khớp.' : null}
          placeholder="Nhập lại mật khẩu"
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="done"
          onSubmitEditing={save}
        />

        {error ? <ErrorText text={error} /> : null}
        <PrimaryButton label="Lưu mật khẩu & vào học" disabled={!canSave} loading={loading} onPress={save} />
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  banner: {
    marginTop: 16,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  bannerTitle: { fontFamily: fonts.sans700, fontSize: 14, lineHeight: 20 },
  bannerText: { fontFamily: fonts.sans400, fontSize: 13, lineHeight: 19 },
  form: { paddingTop: 24, paddingHorizontal: 20, gap: 16 },
  head: { gap: 6 },
  title: { fontFamily: fonts.display600, fontSize: 26, lineHeight: 34 },
  who: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingLeft: 4,
    paddingRight: 10,
    borderRadius: 9999,
    borderWidth: 1,
  },
  whoAvatar: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  whoInitials: { fontFamily: fonts.display600, fontSize: 10, lineHeight: 12 },
  whoEmail: { flexShrink: 1, fontFamily: fonts.sans400, fontSize: 13, lineHeight: 18 },
  strength: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bars: { flex: 1, flexDirection: 'row', gap: 4 },
  bar: { flex: 1, height: 5, borderRadius: 9999 },
  strengthText: { minWidth: 70, textAlign: 'right', fontFamily: fonts.sans600, fontSize: 12, lineHeight: 16 },
  rules: { marginTop: -4, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, gap: 6 },
  rule: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 15, height: 15, borderRadius: 8, borderWidth: 2, marginHorizontal: 0.5 },
  ruleText: { fontFamily: fonts.sans400, fontSize: 13, lineHeight: 18 },
});
