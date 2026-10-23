import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useToast } from '@/components/Toast';
import { apiResend, RESEND_SECONDS } from '@/data/auth';
import { useScreenTopInset } from '@/hooks/useScreenTopInset';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/typography';

import { EnvelopeArt } from './AuthArt';
import { AuthScreen, DevHint, goBackToLogin, Note, PrimaryButton, ResendNote } from './AuthUI';

/**
 * Màn "đã gửi email" dùng chung:
 * - kind="register": Đăng ký — đã gửi mật khẩu tạm (phong bì xanh + dấu tích)
 * - kind="forgot"  : Quên mật khẩu — đã gửi mật khẩu tạm mới (phong bì tím + chìa khoá)
 * Nút chính về màn đăng nhập và điền sẵn email.
 */
export function SentScreen({ kind }: { kind: 'register' | 'forgot' }) {
  const { colors } = useTheme();
  const topInset = useScreenTopInset(12, 28);
  const { email = '' } = useLocalSearchParams<{ email?: string }>();
  const [toast, showToast] = useToast();
  const register = kind === 'register';

  return (
    <>
      <AuthScreen
        contentStyle={{ paddingTop: topInset + 40, paddingHorizontal: 24 }}
        footer={<PrimaryButton label={register ? 'Đến trang đăng nhập' : 'Quay lại đăng nhập'} onPress={() => goBackToLogin({ email })} />}
      >
        <View style={styles.center}>
          <EnvelopeArt tone={register ? 'mint' : 'violet'} badge={register ? 'check' : 'key'} />

          <Text accessibilityRole="header" style={[styles.title, { color: colors.ink900 }]}>
            {register ? 'Kiểm tra hộp thư của bạn' : 'Đã gửi mật khẩu tạm mới'}
          </Text>
          <Text style={[styles.text, { color: colors.ink600 }]}>
            {register ? 'Thông tin đăng nhập của bạn đã được gửi đến' : 'Thông tin đăng nhập mới đã được gửi đến'}
            {'\n'}
            <Text style={[styles.email, { color: colors.ink900 }]}>{email}</Text>
          </Text>

          <View style={styles.resend}>
            <ResendNote
              seconds={RESEND_SECONDS}
              onResend={async () => {
                await apiResend(email);
                showToast('Đã gửi lại email');
              }}
            />
          </View>

          {!register && (
            <View style={styles.note}>
              <Note tone="card" iconColor={colors.violetText}>
                Mật khẩu cũ không còn dùng được. Đăng nhập bằng mật khẩu tạm, app sẽ yêu cầu bạn đặt mật khẩu mới ngay sau đó.
              </Note>
            </View>
          )}
          <View style={styles.dev}>
            <DevHint />
          </View>
        </View>
      </AuthScreen>
      {toast}
    </>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
  title: { marginTop: 32, textAlign: 'center', fontFamily: fonts.display600, fontSize: 26, lineHeight: 34 },
  text: { marginTop: 10, textAlign: 'center', fontFamily: fonts.sans400, fontSize: 15, lineHeight: 23 },
  email: { fontFamily: fonts.sans700 },
  resend: { marginTop: 14 },
  note: { marginTop: 20, alignSelf: 'stretch' },
  dev: { marginTop: 16 },
});
