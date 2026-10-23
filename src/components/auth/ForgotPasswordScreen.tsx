import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { apiForgotPassword, AuthError, isEmail } from '@/data/auth';
import { useScreenTopInset } from '@/hooks/useScreenTopInset';

import { LockArt } from './AuthArt';
import { AuthField, AuthScreen, AuthTitle, BackButton, ErrorText, FooterPrompt, goBackToLogin, PrimaryButton } from './AuthUI';

/** Quên mật khẩu: nhập email → server gửi mật khẩu tạm mới → đăng nhập lại → bắt buộc đặt mật khẩu mới. */
export function ForgotPasswordScreen() {
  const topInset = useScreenTopInset(12, 28);
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!isEmail(email)) return setError('Email chưa đúng định dạng.');
    setLoading(true);
    setFormError(null);
    try {
      const res = await apiForgotPassword(email);
      router.replace({ pathname: '/forgot-sent', params: { email: res.email, resend: String(res.resendAfter) } });
    } catch (e) {
      if (e instanceof AuthError && e.field === 'email') setError(e.message);
      else setFormError(e instanceof AuthError ? e.message : 'Không kết nối được máy chủ. Kiểm tra mạng và thử lại.');
      setLoading(false);
    }
  };

  return (
    <AuthScreen
      contentStyle={{ paddingTop: topInset }}
      footer={<FooterPrompt text="Nhớ ra rồi?" action="Đăng nhập" onPress={() => goBackToLogin()} />}
    >
      <View style={styles.pad16}>
        <BackButton />
      </View>
      <View style={styles.art}>
        <LockArt />
      </View>
      <View style={styles.form}>
        <AuthTitle
          center
          title="Quên mật khẩu?"
          subtitle="Nhập email bạn đã đăng ký. Chúng tôi sẽ gửi một mật khẩu tạm mới để bạn đăng nhập và đặt lại mật khẩu."
        />
        <View style={styles.field}>
          <AuthField
            label="Email"
            icon="mail"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setError(null);
            }}
            error={error}
            placeholder="ban@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="send"
            onSubmitEditing={submit}
          />
        </View>
        {formError ? <ErrorText text={formError} /> : null}
        <PrimaryButton label="Gửi mật khẩu tạm" loading={loading} onPress={submit} />
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  pad16: { paddingHorizontal: 16 },
  art: { alignItems: 'center', marginTop: 24 },
  form: { paddingTop: 24, paddingHorizontal: 20, gap: 16 },
  field: { marginTop: 4 },
});
