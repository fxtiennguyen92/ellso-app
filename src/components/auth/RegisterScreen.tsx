import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, type TextInputInstance, View } from 'react-native';

import { useToast } from '@/components/Toast';
import { Icon } from '@/components/Icon';
import { apiCheckReferral, apiRegister, AuthError, isEmail, type Referrer } from '@/data/auth';
import { useScreenTopInset } from '@/hooks/useScreenTopInset';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/typography';

import { IdCardArt } from './AuthArt';
import { AuthField, AuthScreen, AuthTitle, BackButton, Checkbox, ErrorText, FooterPrompt, goBackToLogin, Note, PrimaryButton } from './AuthUI';
import { ReferralSheet } from './ReferralSheet';

/**
 * Đăng ký: Họ tên + Email (+ mã giới thiệu tuỳ chọn). Server gửi mật khẩu tạm qua email.
 * Vào từ link / QR mời (`/register?ref=MA`) → ô mã giới thiệu có sẵn người mời.
 */
export function RegisterScreen() {
  const { colors } = useTheme();
  const topInset = useScreenTopInset(12, 28);
  const params = useLocalSearchParams<{ ref?: string }>();
  const [toast, showToast] = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [referrer, setReferrer] = useState<Referrer | null>(null);
  const [agree, setAgree] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; agree?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<TextInputInstance>(null);

  // Link / QR mời: kiểm tra mã trong URL và gắn sẵn người mời
  useEffect(() => {
    if (!params.ref) return;
    apiCheckReferral(params.ref)
      .then(setReferrer)
      .catch(() => showToast('Mã giới thiệu trong link không hợp lệ'));
  }, [params.ref, showToast]);

  const submit = async () => {
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = 'Hãy nhập họ và tên.';
    if (!isEmail(email)) next.email = 'Email chưa đúng định dạng.';
    if (!agree) next.agree = 'Bạn cần đồng ý với Điều khoản và Chính sách bảo mật.';
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    try {
      const res = await apiRegister({ name, email, referralCode: referrer?.code });
      router.replace({ pathname: '/register-sent', params: { email: res.email } });
    } catch (e) {
      if (e instanceof AuthError) setErrors(e.field === 'email' || e.field === 'name' ? { [e.field]: e.message } : { form: e.message });
      else setErrors({ form: 'Không kết nối được máy chủ. Kiểm tra mạng và thử lại.' });
      setLoading(false);
    }
  };

  return (
    <>
      <AuthScreen
        contentStyle={{ paddingTop: topInset }}
        footer={<FooterPrompt text="Đã có tài khoản?" action="Đăng nhập" onPress={() => goBackToLogin()} />}
      >
        <View style={styles.pad16}>
          <BackButton />
        </View>

        <View style={styles.titleRow}>
          <View style={styles.grow}>
            <AuthTitle title="Tạo tài khoản" subtitle="Chỉ cần họ tên và email. Mật khẩu tạm sẽ được gửi qua email." />
          </View>
          <IdCardArt />
        </View>

        <View style={styles.form}>
          <AuthField
            label="Họ và tên"
            icon="user"
            value={name}
            onChangeText={(t) => {
              setName(t);
              if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
            }}
            error={errors.name}
            placeholder="Nguyễn Văn A"
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
            submitBehavior="submit"
          />
          <AuthField
            ref={emailRef}
            label="Email"
            icon="mail"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
            }}
            error={errors.email}
            placeholder="ban@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="done"
          />

          {/* Mã giới thiệu: bấm → popup nhập mã / quét QR */}
          <View style={styles.refWrap}>
            <Text style={[type.label, { color: colors.ink900 }]}>
              Mã giới thiệu <Text style={{ fontFamily: fonts.sans500, color: colors.ink600 }}>(không bắt buộc)</Text>
            </Text>
            {referrer ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Người giới thiệu: ${referrer.name}, mã ${referrer.code}. Bấm để đổi`}
                onPress={() => setSheet(true)}
                style={({ pressed }) => [
                  styles.refFilled,
                  { backgroundColor: colors.violetTint, borderColor: colors.violetLine, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <View style={[styles.refAvatar, { backgroundColor: colors.card }]}>
                  <Text style={[styles.refInitials, { color: colors.violetText }]}>{referrer.initials}</Text>
                </View>
                <View style={styles.grow}>
                  <Text style={[type.label, { color: colors.ink900 }]}>{referrer.name}</Text>
                  <View style={styles.refCode}>
                    <Icon name="check" size={13} strokeWidth={2.6} color={colors.violetText} />
                    <Text style={[styles.refCodeText, { color: colors.violetText }]}>Mã {referrer.code}</Text>
                  </View>
                </View>
                <Text style={[styles.refChange, { color: colors.violetText }]}>Đổi</Text>
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Nhập mã giới thiệu hoặc quét mã QR"
                onPress={() => setSheet(true)}
                style={({ pressed }) => [styles.refEmpty, { backgroundColor: pressed ? colors.surfaceAlt : colors.card, borderColor: colors.line }]}
              >
                <Icon name="ticket" size={20} strokeWidth={1.9} color={colors.ink400} />
                <Text style={[styles.refPlaceholder, { color: colors.ink400 }]}>Nhập mã hoặc quét QR</Text>
                <Icon name="scan" size={20} strokeWidth={1.9} color={colors.ink600} />
              </Pressable>
            )}
          </View>

          <Note>
            Chúng tôi sẽ gửi <Text style={{ fontFamily: fonts.sans700 }}>mật khẩu tạm</Text> tới email này. Lần đầu đăng nhập, bạn sẽ đặt mật khẩu của
            riêng mình.
          </Note>

          <View style={styles.agreeWrap}>
            <Checkbox
              checked={agree}
              onChange={(v) => {
                setAgree(v);
                if (v && errors.agree) setErrors((e) => ({ ...e, agree: undefined }));
              }}
            >
              <Text style={[styles.agree, { color: colors.ink600 }]}>
                Tôi đồng ý với{' '}
                <Text style={[styles.agreeLink, { color: colors.emerald700 }]} onPress={() => showToast('Điều khoản sẽ có ở bước sau')}>
                  Điều khoản
                </Text>{' '}
                và{' '}
                <Text style={[styles.agreeLink, { color: colors.emerald700 }]} onPress={() => showToast('Chính sách bảo mật sẽ có ở bước sau')}>
                  Chính sách bảo mật
                </Text>{' '}
                của Ellso.
              </Text>
            </Checkbox>
            {errors.agree ? <ErrorText text={errors.agree} /> : null}
          </View>

          {errors.form ? <ErrorText text={errors.form} /> : null}
          <PrimaryButton label="Tạo tài khoản" loading={loading} onPress={submit} />
        </View>
      </AuthScreen>

      <ReferralSheet
        visible={sheet}
        current={referrer}
        onClose={() => setSheet(false)}
        onConfirm={(r) => {
          setReferrer(r);
          setSheet(false);
        }}
        onScanQr={() => showToast('Quét mã QR sẽ có ở bản sau')}
      />
      {toast}
    </>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  pad16: { paddingHorizontal: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingTop: 20, paddingHorizontal: 20 },
  form: { paddingTop: 24, paddingHorizontal: 20, gap: 16 },
  refWrap: { gap: 6 },
  refFilled: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 60,
    paddingVertical: 8,
    paddingLeft: 10,
    paddingRight: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  refAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  refInitials: { fontFamily: fonts.display600, fontSize: 14, lineHeight: 18 },
  refCode: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  refCodeText: { fontFamily: fonts.sans400, fontSize: 12, lineHeight: 16 },
  refChange: { fontFamily: fonts.sans600, fontSize: 13, lineHeight: 20 },
  refEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    paddingLeft: 14,
    paddingRight: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  refPlaceholder: { flex: 1, fontFamily: fonts.sans400, fontSize: 15, lineHeight: 20 },
  agreeWrap: { gap: 6 },
  agree: { fontFamily: fonts.sans400, fontSize: 13, lineHeight: 20 },
  agreeLink: { fontFamily: fonts.sans600 },
});
