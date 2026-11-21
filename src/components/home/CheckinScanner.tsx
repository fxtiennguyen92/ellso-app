import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { PrimaryButton } from '@/components/auth/AuthUI';
import { Icon } from '@/components/Icon';
import { checkinTraining, type CheckinResult } from '@/data/home';
import { ApiError } from '@/lib/api';
import { useTheme } from '@/theme/ThemeProvider';
import { illo, lightColors } from '@/theme/tokens';
import { fonts, type } from '@/theme/typography';

type Props = { visible: boolean; onClose: () => void; onCheckedIn: (r: CheckinResult) => void };

type Phase = { kind: 'scan' } | { kind: 'sending' } | { kind: 'done'; result: CheckinResult } | { kind: 'error'; message: string };

const FRAME = 248;
/** Màn camera luôn tối (cả giao diện sáng lẫn tối) → lấy cố định bảng màu sáng: nền ink-900, chữ trắng, nhấn mint/emerald. */
const DARK = { bg: lightColors.ink900, text: lightColors.onEmerald, accent: lightColors.mint400, frame: lightColors.emerald500, veil: illo.scrim, chip: illo.onCoverSoft };
const hhmm = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/**
 * Màn quét mã QR điểm danh (toàn màn hình, nền tối): học viên quét mã QR của chương trình huấn luyện (in / chiếu ở lớp,
 * lấy ở CMS › Điểm danh) → POST /trainings/checkin → ghi vào buổi của hôm nay. Mã chỉ có hiệu lực trong ngày có buổi.
 * Không có camera / không cấp quyền (vd web trên máy tính) → "Nhập mã" (dán nội dung mã).
 */
export function CheckinScanner({ visible, onClose, onCheckedIn }: Props) {
  const { colors } = useTheme();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<Phase>({ kind: 'scan' });
  const [manual, setManual] = useState(false);
  const [code, setCode] = useState('');
  const [cameraFailed, setCameraFailed] = useState(false);
  const locked = useRef(false); // camera bắn nhiều lần cho cùng một mã → chỉ gửi một lần

  useEffect(() => {
    if (!visible) return;
    setPhase({ kind: 'scan' });
    setManual(false);
    setCode('');
    setCameraFailed(false);
    locked.current = false;
  }, [visible]);

  const send = async (value: string) => {
    if (!token || locked.current || !value.trim()) return;
    locked.current = true;
    setPhase({ kind: 'sending' });
    try {
      const result = await checkinTraining(value.trim(), token);
      setPhase({ kind: 'done', result });
      onCheckedIn(result);
    } catch (e) {
      setPhase({ kind: 'error', message: e instanceof ApiError ? e.message : 'Không điểm danh được, thử lại sau.' });
    }
  };

  const again = () => {
    locked.current = false;
    setPhase({ kind: 'scan' });
  };

  const canUseCamera = !manual && !cameraFailed && permission?.granted;

  return (
    <Modal visible={visible} onRequestClose={onClose} animationType="slide" presentationStyle="fullScreen" statusBarTranslucent>
      <View style={[styles.root, { backgroundColor: DARK.bg }]}>
        {canUseCamera && phase.kind === 'scan' && (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={(r: BarcodeScanningResult) => send(r.data)}
            onMountError={() => setCameraFailed(true)}
          />
        )}

        {/* Đầu màn: tiêu đề + đóng */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <View style={styles.grow}>
            <Text style={[type.eyebrow, { color: DARK.accent }]}>Chương trình huấn luyện</Text>
            <Text style={[type.h2, { color: DARK.text }]}>Quét mã điểm danh</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Đóng" onPress={onClose} hitSlop={8} style={styles.close}>
            <Icon name="close" size={22} color={DARK.text} />
          </Pressable>
        </View>

        <View style={styles.center}>
          {phase.kind === 'done' ? (
            <ResultCard ok title={phase.result.already ? 'Bạn đã điểm danh rồi' : 'Điểm danh thành công'}>
              {phase.result.courseTitle}
              {'\n'}Buổi {phase.result.number} · có mặt lúc {hhmm(phase.result.checkedInAt)}
            </ResultCard>
          ) : phase.kind === 'error' ? (
            <ResultCard title="Chưa điểm danh được">{phase.message}</ResultCard>
          ) : canUseCamera ? (
            <View style={styles.frame} accessibilityLabel="Khung quét mã QR">
              {(['tl', 'tr', 'bl', 'br'] as const).map((c) => (
                <View key={c} style={[styles.corner, styles[c], { borderColor: DARK.frame }]} />
              ))}
              {phase.kind === 'sending' && (
                <View style={styles.sending}>
                  <Text style={[type.label, { color: DARK.text }]}>Đang điểm danh…</Text>
                </View>
              )}
            </View>
          ) : (
            <ManualOrPermission
              manual={manual || cameraFailed || (!!permission && !permission.granted && !permission.canAskAgain)}
              askable={!!permission && !permission.granted && permission.canAskAgain && !cameraFailed && !manual}
              onAsk={requestPermission}
              code={code}
              setCode={setCode}
              busy={phase.kind === 'sending'}
              onSubmit={() => send(code)}
            />
          )}
        </View>

        {/* Chân màn */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          {phase.kind === 'done' ? (
            <PrimaryButton label="Xong" onPress={onClose} />
          ) : phase.kind === 'error' ? (
            <PrimaryButton label="Thử lại" onPress={again} />
          ) : (
            <>
              {canUseCamera && (
                <Text style={[type.caption, styles.hint]}>
                  Hướng camera vào mã QR điểm danh của chương trình (dán ở lớp hoặc trên màn chiếu). Mã chỉ dùng được trong ngày có buổi học.
                </Text>
              )}
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setManual((m) => !m);
                  locked.current = false;
                }}
                style={styles.switch}
                hitSlop={6}
              >
                <Icon name={manual ? 'scanQr' : 'ticket'} size={18} color={DARK.accent} />
                <Text style={[type.label, { color: DARK.accent }]}>{manual ? 'Quét bằng camera' : 'Nhập mã thay vì quét'}</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function ResultCard({ ok = false, title, children }: { ok?: boolean; title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.result, { backgroundColor: colors.card }]} accessibilityLiveRegion="polite">
      <View style={[styles.resultIcon, { backgroundColor: ok ? colors.mint50 : colors.dangerTint }]}>
        <Icon name={ok ? 'check' : 'alert'} size={30} strokeWidth={2.6} color={ok ? colors.emerald700 : colors.danger} />
      </View>
      <Text style={[type.h2, styles.centerText, { color: colors.ink900 }]}>{title}</Text>
      <Text style={[type.body, styles.centerText, { color: colors.ink600 }]}>{children}</Text>
    </View>
  );
}

function ManualOrPermission({
  manual,
  askable,
  onAsk,
  code,
  setCode,
  busy,
  onSubmit,
}: {
  manual: boolean;
  askable: boolean;
  onAsk: () => void;
  code: string;
  setCode: (v: string) => void;
  busy: boolean;
  onSubmit: () => void;
}) {
  const { colors } = useTheme();
  if (askable && !manual) {
    return (
      <View style={[styles.result, { backgroundColor: colors.card }]}>
        <View style={[styles.resultIcon, { backgroundColor: colors.mint50 }]}>
          <Icon name="scanQr" size={30} color={colors.emerald700} />
        </View>
        <Text style={[type.h2, styles.centerText, { color: colors.ink900 }]}>Cho phép dùng camera</Text>
        <Text style={[type.body, styles.centerText, { color: colors.ink600 }]}>Ellso cần camera để quét mã QR điểm danh ở lớp.</Text>
        <View style={styles.full}>
          <PrimaryButton label="Cho phép" onPress={onAsk} />
        </View>
      </View>
    );
  }
  return (
    <View style={[styles.result, { backgroundColor: colors.card }]}>
      <Text style={[type.h2, styles.centerText, { color: colors.ink900 }]}>Nhập mã điểm danh</Text>
      <Text style={[type.caption, styles.centerText, { color: colors.ink600 }]}>
        Dán nội dung mã QR (ELLSO-CHECKIN:…) người hướng dẫn gửi, hoặc mã in dưới mã QR ở lớp.
      </Text>
      <View style={[styles.field, { backgroundColor: colors.bg, borderColor: colors.line }]}>
        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder="ELLSO-CHECKIN:…"
          placeholderTextColor={colors.ink400}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={onSubmit}
          accessibilityLabel="Mã điểm danh"
          style={[styles.input, { color: colors.ink900 }]}
        />
      </View>
      <View style={styles.full}>
        <PrimaryButton label="Điểm danh" disabled={!code.trim()} loading={busy} onPress={onSubmit} />
      </View>
    </View>
  );
}

const C = 34; // cạnh góc khung quét
const styles = StyleSheet.create({
  root: { flex: 1 },
  grow: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 20, paddingBottom: 12, backgroundColor: DARK.veil },
  close: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: DARK.chip },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  frame: { width: FRAME, height: FRAME, alignItems: 'center', justifyContent: 'center' },
  corner: { position: 'absolute', width: C, height: C, },
  tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 22 },
  tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 22 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 22 },
  br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 22 },
  sending: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 9999, backgroundColor: DARK.veil },
  footer: { paddingHorizontal: 20, paddingTop: 16, gap: 14, alignItems: 'stretch', backgroundColor: DARK.veil },
  hint: { color: lightColors.onEmeraldMuted, textAlign: 'center' },
  switch: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 6 },
  result: { width: '100%', maxWidth: 400, borderRadius: 24, padding: 22, gap: 10, alignItems: 'center' },
  resultIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  centerText: { textAlign: 'center' },
  full: { alignSelf: 'stretch', marginTop: 8 },
  field: { alignSelf: 'stretch', height: 54, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1.5, justifyContent: 'center', marginTop: 4 },
  input: {
    height: '100%',
    paddingVertical: 0,
    fontFamily: fonts.sans600,
    fontSize: 15,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
});
