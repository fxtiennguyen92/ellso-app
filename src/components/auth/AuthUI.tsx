import { router } from 'expo-router';
import { forwardRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputInstance,
  type TextInputProps,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/Icon';
import { DEMO_TEMP_PASSWORD } from '@/data/auth';
import { useCountdown } from '@/hooks/useCountdown';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/typography';

/**
 * Bộ khối dùng chung cho các màn tài khoản (đăng nhập, đăng ký, quên mật khẩu, đặt mật khẩu mới).
 * Thiết kế: canvas "Đăng nhập & tài khoản" (Login / Register / ForgotPassword …).
 */

/** Khung màn: nền bg, cuộn được, tránh bàn phím, chân trang (footer) luôn ở đáy khi nội dung ngắn. */
export function AuthScreen({ children, footer, contentStyle }: { children: ReactNode; footer?: ReactNode; contentStyle?: ViewStyle }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: colors.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 28 }, contentStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
        {footer && <View style={styles.footer}>{footer}</View>}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Tiêu đề + mô tả của màn. */
export function AuthTitle({ title, subtitle, center = false }: { title: string; subtitle?: ReactNode; center?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.titleWrap, center && styles.center]}>
      <Text accessibilityRole="header" style={[styles.title, { color: colors.ink900 }, center && styles.textCenter]}>
        {title}
      </Text>
      {subtitle ? <Text style={[styles.subtitle, { color: colors.ink600 }, center && styles.textCenter]}>{subtitle}</Text> : null}
    </View>
  );
}

type FieldProps = Omit<TextInputProps, 'style'> & {
  label: ReactNode;
  icon: IconName;
  error?: string | null;
  /** Ô mật khẩu: thêm nút hiện / ẩn. */
  password?: boolean;
  /** Nội dung thêm ngay dưới ô (vd thanh độ mạnh mật khẩu). */
  below?: ReactNode;
};

/** Ô nhập có nhãn, icon trái, viền + vòng sáng khi focus, báo lỗi đỏ bên dưới. */
export const AuthField = forwardRef<TextInputInstance, FieldProps>(function AuthField(
  { label, icon, error, password = false, below, onFocus, onBlur, ...input },
  ref,
) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [shown, setShown] = useState(false);
  const accent = error ? colors.danger : focused ? colors.emerald700 : colors.ink400;

  return (
    <View style={styles.fieldWrap}>
      <Text style={[type.label, { color: colors.ink900 }]}>{label}</Text>
      <View
        style={[
          styles.field,
          {
            backgroundColor: colors.card,
            borderColor: error ? colors.danger : focused ? colors.emerald700 : colors.line,
            boxShadow: focused ? `0px 0px 0px 4px ${error ? 'rgba(220,38,38,0.14)' : colors.focusRing}` : undefined,
          },
        ]}
      >
        <Icon name={icon} size={20} strokeWidth={1.9} color={accent} />
        <TextInput
          ref={ref}
          {...input}
          secureTextEntry={password && !shown}
          placeholderTextColor={colors.ink400}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, { color: colors.ink900 }]}
        />
        {password && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={shown ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            onPress={() => setShown((v) => !v)}
            style={({ pressed }) => [styles.eye, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Icon name={shown ? 'eyeOff' : 'eye'} size={20} strokeWidth={1.9} color={colors.ink600} />
          </Pressable>
        )}
      </View>
      {below}
      {error ? <ErrorText text={error} /> : null}
    </View>
  );
});

export function ErrorText({ text }: { text: string }) {
  const { colors } = useTheme();
  return (
    <View accessibilityLiveRegion="polite" style={styles.errorRow}>
      <Icon name="info" size={15} strokeWidth={2} color={colors.danger} />
      <Text style={[styles.errorText, { color: colors.danger }]}>{text}</Text>
    </View>
  );
}

/** Nút chính 3D (mép emerald đậm). Tắt: nền line, chữ ink600. */
export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const { colors } = useTheme();
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: off, busy: loading }}
      disabled={off}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primary,
        disabled && !loading
          ? { backgroundColor: colors.line }
          : {
              backgroundColor: pressed ? colors.emerald800 : colors.emerald700,
              boxShadow: `0px ${pressed ? 1 : 4}px 0px ${colors.emeraldEdge}`,
              transform: [{ translateY: pressed ? 3 : 0 }],
            },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.onEmerald} />
      ) : (
        <Text style={[styles.primaryText, { color: disabled ? colors.ink600 : colors.onEmerald }]}>{label}</Text>
      )}
    </Pressable>
  );
}

/** Nút phụ viền (vd "Quét mã QR"). */
export function SecondaryButton({ label, icon, onPress }: { label: string; icon?: IconName; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.secondary, { borderColor: colors.line, backgroundColor: pressed ? colors.surfaceAlt : colors.card }]}
    >
      {icon && <Icon name={icon} size={20} strokeWidth={1.9} color={colors.ink900} />}
      <Text style={[styles.secondaryText, { color: colors.ink900 }]}>{label}</Text>
    </Pressable>
  );
}

/** Nút quay lại (ô vuông bo góc) — mặc định về màn trước, không có thì về /login. */
export function BackButton({ label = 'Quay lại đăng nhập' }: { label?: string }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => goBackToLogin()}
      style={({ pressed }) => [styles.back, { backgroundColor: colors.card, borderColor: colors.line, opacity: pressed ? 0.7 : 1 }]}
    >
      <Icon name="chevronLeft" size={22} color={colors.ink900} />
    </Pressable>
  );
}

export function goBackToLogin(params?: { email?: string }) {
  if (params?.email) router.dismissTo({ pathname: '/login', params });
  else if (router.canGoBack()) router.back();
  else router.replace('/login');
}

/** Liên kết chữ emerald. */
export function TextLink({ label, onPress, muted = false }: { label: string; onPress: () => void; muted?: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable accessibilityRole="link" onPress={onPress} hitSlop={8} style={styles.link}>
      {({ pressed }) => <Text style={[type.label, { color: muted ? colors.ink600 : pressed ? colors.emerald800 : colors.emerald700 }]}>{label}</Text>}
    </Pressable>
  );
}

/** "Chưa có tài khoản? Đăng ký" ở chân màn. */
export function FooterPrompt({ text, action, onPress }: { text: string; action: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.prompt}>
      <Text style={[styles.promptText, { color: colors.ink600 }]}>{text}</Text>
      <TextLink label={action} onPress={onPress} />
    </View>
  );
}

/** Ô tick (đồng ý điều khoản). */
export function Checkbox({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={() => onChange(!checked)} style={styles.check}>
      <View
        style={[
          styles.box,
          checked
            ? { backgroundColor: colors.emerald700, borderColor: colors.emerald700 }
            : { backgroundColor: colors.card, borderColor: colors.ink400 },
        ]}
      >
        {checked && <Icon name="check" size={14} strokeWidth={3.2} color={colors.onEmerald} />}
      </View>
      <View style={styles.flex}>{children}</View>
    </Pressable>
  );
}

/** Hộp ghi chú (icon i). tone mint = thông tin chung, card = trung tính. */
export function Note({ children, tone = 'mint', iconColor }: { children: ReactNode; tone?: 'mint' | 'card'; iconColor?: string }) {
  const { colors } = useTheme();
  const mint = tone === 'mint';
  return (
    <View
      style={[styles.note, mint ? { backgroundColor: colors.mint50 } : { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line }]}
    >
      <Icon name="info" size={20} strokeWidth={1.9} color={iconColor ?? (mint ? colors.emerald800 : colors.ink600)} />
      <Text style={[styles.noteText, { color: mint ? colors.emerald800 : colors.ink600 }]}>{children}</Text>
    </View>
  );
}

/** "Vui lòng kiểm tra mục Spam hoặc gửi lại sau 0:48" — đếm ngược 60 giây rồi cho bấm gửi lại. */
export function ResendNote({ seconds, onResend }: { seconds: number; onResend: () => Promise<void> }) {
  const { colors } = useTheme();
  const { done, label, restart } = useCountdown(seconds);
  const [sending, setSending] = useState(false);
  return (
    <View style={[styles.resend, { backgroundColor: colors.card, borderColor: colors.line }]}>
      <Text style={[styles.resendText, { color: colors.ink600 }]}>Vui lòng kiểm tra mục Spam hoặc </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !done || sending }}
        disabled={!done || sending}
        onPress={async () => {
          setSending(true);
          try {
            await onResend();
            restart();
          } finally {
            setSending(false);
          }
        }}
      >
        <Text style={[styles.resendText, { fontFamily: fonts.sans600, color: done && !sending ? colors.emerald700 : colors.ink400 }]}>
          {sending ? 'đang gửi…' : done ? 'gửi lại email' : `gửi lại sau ${label}`}
        </Text>
      </Pressable>
    </View>
  );
}

/** Gợi ý chỉ hiện khi chạy dev (bản giả lập chưa có email thật). */
export function DevHint() {
  const { colors } = useTheme();
  if (!__DEV__) return null;
  return <Text style={[styles.dev, { color: colors.ink400, borderColor: colors.line }]}>Bản demo: mật khẩu tạm luôn là {DEMO_TEMP_PASSWORD}</Text>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },
  footer: { marginTop: 'auto', paddingTop: 24 },
  center: { alignItems: 'center' },
  textCenter: { textAlign: 'center' },
  titleWrap: { gap: 4 },
  title: { fontFamily: fonts.display600, fontSize: 26, lineHeight: 34 },
  subtitle: { fontFamily: fonts.sans400, fontSize: 14, lineHeight: 21 },

  fieldWrap: { gap: 6 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 52, paddingLeft: 14, paddingRight: 4, borderRadius: 14, borderWidth: 1.5 },
  input: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    paddingVertical: 0,
    fontFamily: fonts.sans400,
    fontSize: 15,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  eye: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  errorRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  errorText: { flex: 1, fontFamily: fonts.sans500, fontSize: 13, lineHeight: 18 },

  primary: { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  primaryText: { fontFamily: fonts.sans600, fontSize: 16, lineHeight: 22 },
  secondary: { height: 52, borderRadius: 16, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  secondaryText: { fontFamily: fonts.sans600, fontSize: 15, lineHeight: 22 },
  back: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  link: { paddingVertical: 10 },
  prompt: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, flexWrap: 'wrap' },
  promptText: { fontFamily: fonts.sans400, fontSize: 14, lineHeight: 20 },

  check: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 2 },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginTop: -1 },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16 },
  noteText: { flex: 1, fontFamily: fonts.sans400, fontSize: 13, lineHeight: 19 },
  resend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  resendText: { fontFamily: fonts.sans400, fontSize: 13, lineHeight: 20 },
  dev: {
    alignSelf: 'center',
    fontFamily: fonts.sans500,
    fontSize: 12,
    lineHeight: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
});
