import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, type TextInputInstance, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { EllsoLogo } from '@/components/EllsoLogo';
import { AuthError, isEmail, PASSWORD_MAX } from '@/data/auth';
import { useScreenTopInset } from '@/hooks/useScreenTopInset';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/typography';

import { LoginHeroArt } from './AuthArt';
import { AuthField, AuthScreen, AuthTitle, ErrorText, FooterPrompt, PrimaryButton, TextLink } from './AuthUI';

/**
 * Đăng nhập. Mật khẩu tạm → AuthProvider đặt status "mustChangePassword" → router tự chuyển sang /set-password.
 * Mật khẩu thật → status "signedIn" → vào app.
 */
export function LoginScreen() {
  const { colors } = useTheme();
  const { login, notice, clearNotice } = useAuth();
  const topInset = useScreenTopInset(4, 16);
  const params = useLocalSearchParams<{ email?: string }>();

  const [email, setEmail] = useState(params.email ?? '');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<TextInputInstance>(null);

  // Thông báo từ AuthProvider (vd phiên đặt mật khẩu hết hạn) → hiện như lỗi chung của form
  useEffect(() => {
    if (!notice) return;
    setErrors({ form: notice });
    clearNotice();
  }, [notice, clearNotice]);

  // Quay lại từ màn "đã gửi email" → điền sẵn email, xoá mật khẩu cũ
  useEffect(() => {
    if (params.email) {
      setEmail(params.email);
      setPassword('');
      setErrors({});
    }
  }, [params.email]);

  const submit = async () => {
    const next: typeof errors = {};
    if (!isEmail(email)) next.email = 'Email chưa đúng định dạng.';
    if (!password) next.password = 'Hãy nhập mật khẩu.';
    setErrors(next);
    if (next.email || next.password) return;
    setLoading(true);
    try {
      await login(email.trim(), password);
      // thành công: router tự chuyển màn theo trạng thái đăng nhập
    } catch (e) {
      if (e instanceof AuthError) setErrors(e.field === 'email' || e.field === 'password' ? { [e.field]: e.message } : { form: e.message });
      else setErrors({ form: 'Không kết nối được máy chủ. Kiểm tra mạng và thử lại.' });
      setLoading(false);
    }
  };

  return (
    <AuthScreen footer={<FooterPrompt text="Chưa có tài khoản?" action="Đăng ký" onPress={() => router.push('/register')} />}>
      {/* Header mở (không phải card): logo + slogan, sách 3D */}
      <View style={[styles.hero, { height: 226 + topInset }]}>
        <View style={[StyleSheet.absoluteFill, { top: topInset - 44 }]}>
          <LoginHeroArt />
        </View>
        <View style={[styles.brand, { top: topInset + 28 }]}>
          <EllsoLogo width={118} color={colors.emerald500} />
          <Text style={[styles.slogan, { color: colors.ink600 }]}>Learn to Lead,{'\n'}Innovate to Succeed.</Text>
        </View>
      </View>

      <View style={styles.form}>
        <AuthTitle title="Chào mừng trở lại" subtitle="Đăng nhập để tiếp tục lộ trình học của bạn." />

        <AuthField
          label="Email"
          icon="mail"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            if (errors.email || errors.form) setErrors((e) => ({ ...e, email: undefined, form: undefined }));
          }}
          error={errors.email}
          placeholder="ban@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="username"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          submitBehavior="submit"
        />

        <AuthField
          ref={passwordRef}
          label="Mật khẩu"
          icon="lock"
          password
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            if (errors.password || errors.form) setErrors((e) => ({ ...e, password: undefined, form: undefined }));
          }}
          error={errors.password}
          placeholder="Nhập mật khẩu"
          autoCapitalize="none"
          autoComplete="current-password"
          textContentType="password"
          maxLength={PASSWORD_MAX}
          returnKeyType="go"
          onSubmitEditing={submit}
        />

        <View style={styles.forgot}>
          <TextLink label="Quên mật khẩu?" onPress={() => router.push({ pathname: '/forgot-password', params: email ? { email } : {} })} />
        </View>

        {errors.form ? <ErrorText text={errors.form} /> : null}
        <PrimaryButton label="Đăng nhập" loading={loading} onPress={submit} />
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  hero: { position: 'relative', overflow: 'hidden' },
  brand: { position: 'absolute', left: 24, gap: 10 },
  slogan: { maxWidth: 160, fontFamily: fonts.sans500, fontSize: 13, lineHeight: 19 },
  form: { paddingHorizontal: 20, gap: 16 },
  forgot: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: -10, marginBottom: -6 },
});
