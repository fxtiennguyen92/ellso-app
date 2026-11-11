import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { PrimaryButton } from '@/components/auth/AuthUI';
import { CenterDialog } from '@/components/CenterDialog';
import { Icon } from '@/components/Icon';
import { apiSendFeedback, type Feedback } from '@/data/lesson';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/typography';

/**
 * Cuối bài: "Bài học có hữu ích không?" — Hữu ích gửi ngay; Chưa hữu ích mở popup chọn lý do (+ góp ý ngắn, tuỳ chọn).
 * Đã đánh giá vẫn đổi được. Kết quả xem ở CMS → Bài học → Thống kê học.
 */
export function LessonFeedback({
  lessonId,
  initial,
  reasons,
}: {
  lessonId: number;
  initial: Feedback | null;
  reasons: { key: string; label: string }[];
}) {
  const { colors } = useTheme();
  const { token } = useAuth();
  const [fb, setFb] = useState<Feedback | null>(initial);
  const [ask, setAsk] = useState(false);
  const [picked, setPicked] = useState<string[]>(initial?.rating === -1 ? initial.reasons : []);
  const [comment, setComment] = useState(initial?.rating === -1 ? (initial.comment ?? '') : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async (rating: 1 | -1) => {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const r = await apiSendFeedback(token, lessonId, rating === 1 ? { rating } : { rating, reasons: picked, comment: comment.trim() || null });
      setFb(r);
      setAsk(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chưa gửi được, thử lại nhé.');
    } finally {
      setBusy(false);
    }
  };

  const Choice = ({ rating }: { rating: 1 | -1 }) => {
    const on = fb?.rating === rating;
    const up = rating === 1;
    const ink = on ? (up ? colors.emerald800 : colors.danger) : colors.ink900;
    const line = on ? (up ? colors.emerald500 : colors.danger) : colors.line;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: on }}
        disabled={busy}
        onPress={() => (up ? send(1) : setAsk(true))}
        style={({ pressed }) => [
          styles.choice,
          { backgroundColor: on ? (up ? colors.mint50 : colors.dangerTint) : colors.card, borderColor: line },
          { boxShadow: `0px ${pressed ? 1 : 3}px 0px ${line}`, transform: [{ translateY: pressed ? 2 : 0 }] },
        ]}
      >
        <Icon name={up ? 'thumbsUp' : 'thumbsDown'} size={20} color={ink} duotone={on} />
        <Text style={[type.label, { color: ink }]}>{up ? 'Hữu ích' : 'Chưa hữu ích'}</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.wrap}>
      <Text style={[type.cardTitle, styles.center, { color: colors.ink900 }]}>Bài học này có hữu ích với bạn không?</Text>
      <View style={styles.row}>
        <Choice rating={1} />
        <Choice rating={-1} />
      </View>
      {fb ? (
        <Text accessibilityLiveRegion="polite" style={[type.caption, styles.center, { color: colors.ink600 }]}>
          Cảm ơn bạn đã góp ý!
        </Text>
      ) : null}
      {error && !ask ? <Text style={[type.caption, styles.center, { color: colors.danger }]}>{error}</Text> : null}

      <CenterDialog visible={ask} onClose={() => setAsk(false)} title="Bài học chưa ổn ở đâu?">
        <View style={styles.dialog}>
          <View style={styles.chips}>
            {reasons.map((r) => {
              const on = picked.includes(r.key);
              return (
                <Pressable
                  key={r.key}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  onPress={() => setPicked((p) => (on ? p.filter((x) => x !== r.key) : [...p, r.key]))}
                  style={[styles.chip, { backgroundColor: on ? colors.mint50 : colors.card, borderColor: on ? colors.emerald700 : colors.line }]}
                >
                  {on && <Icon name="check" size={14} strokeWidth={3} color={colors.emerald700} />}
                  <Text style={[type.label, { color: on ? colors.emerald800 : colors.ink900 }]}>{r.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Góp ý thêm (không bắt buộc)"
            placeholderTextColor={colors.ink400}
            maxLength={500}
            multiline
            accessibilityLabel="Góp ý thêm"
            style={[styles.input, { color: colors.ink900, backgroundColor: colors.bg, borderColor: colors.line }]}
          />
          {error ? <Text style={[type.caption, { color: colors.danger }]}>{error}</Text> : null}
          <PrimaryButton label="Gửi góp ý" loading={busy} disabled={!picked.length && !comment.trim()} onPress={() => send(-1)} />
        </View>
      </CenterDialog>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  center: { textAlign: 'center' },
  row: { flexDirection: 'row', gap: 12 },
  choice: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 16, borderWidth: 1.5 },
  dialog: { gap: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 38, borderRadius: 19, borderWidth: 1.5 },
  input: { minHeight: 80, maxHeight: 140, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontFamily: fonts.sans400, fontSize: 15, textAlignVertical: 'top' },
});
