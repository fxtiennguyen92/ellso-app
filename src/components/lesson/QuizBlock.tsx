import { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { PrimaryButton, SecondaryButton } from '@/components/auth/AuthUI';
import { Icon } from '@/components/Icon';
import { apiAnswerQuiz, type LessonProgress, type QuizData } from '@/data/lesson';
import { NATIVE_DRIVER } from '@/hooks/useLoop';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/typography';

type Result = { correct: boolean; explanation: string | null } | null;

/**
 * Câu hỏi trắc nghiệm trong bài (server chấm — app không biết đáp án):
 * chọn (1 hoặc nhiều) → Kiểm tra → đúng: tô xanh + giải thích; sai: tô đỏ, rung nhẹ → Thử lại đến khi đúng.
 * Câu đã trả lời đúng ở lần học trước: hiện lại đáp án đã chọn (tô xanh) + giải thích, không cần làm lại.
 */
export function QuizBlock({
  lessonId,
  blockId,
  number,
  data,
  onAnswered,
}: {
  lessonId: number;
  blockId: string;
  number: number;
  data: QuizData;
  onAnswered: (correct: boolean, progress: LessonProgress) => void;
}) {
  const { colors } = useTheme();
  const { token } = useAuth();
  const multiple = data.type === 'multiple';
  // Đã trả lời đúng ở lần học trước → hiện lại đúng đáp án đã chọn + giải thích (như lúc vừa làm xong)
  const [picked, setPicked] = useState<string[]>(data.answered ? (data.my_answer ?? []) : []);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result>(data.answered ? { correct: true, explanation: data.explanation ?? null } : null);
  const [error, setError] = useState<string | null>(null);
  const shake = useRef(new Animated.Value(0)).current;
  const done = data.answered || result?.correct === true;

  const toggle = (id: string) => {
    if (done || result) return;
    setPicked((p) => (multiple ? (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]) : [id]));
  };

  const check = async () => {
    if (!token || !picked.length) return;
    setBusy(true);
    setError(null);
    try {
      const r = await apiAnswerQuiz(token, lessonId, blockId, picked);
      setResult({ correct: r.correct, explanation: r.explanation });
      onAnswered(r.correct, r.progress);
      if (!r.correct) {
        shake.setValue(0);
        Animated.sequence(
          [8, -8, 6, -6, 0].map((v) => Animated.timing(shake, { toValue: v, duration: 55, useNativeDriver: NATIVE_DRIVER })),
        ).start();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không gửi được câu trả lời, thử lại nhé.');
    } finally {
      setBusy(false);
    }
  };

  const retry = () => {
    setResult(null);
    setPicked([]);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: done ? colors.mint100 : colors.line }]}>
      <View style={styles.head}>
        <View style={[styles.badge, { backgroundColor: done ? colors.mint50 : colors.surfaceAlt }]}>
          <Icon name={done ? 'checkCircle' : 'help'} size={14} color={done ? colors.emerald700 : colors.ink600} />
          <Text style={[type.chip, { color: done ? colors.emerald700 : colors.ink600 }]}>Câu hỏi {number}</Text>
        </View>
        <Text style={[type.caption, { color: colors.ink600 }]}>{multiple ? 'Chọn tất cả đáp án đúng' : 'Chọn 1 đáp án'}</Text>
      </View>

      <Text style={[styles.question, { color: colors.ink900 }]}>{data.question}</Text>

      <Animated.View style={[styles.options, { transform: [{ translateX: shake }] }]}>
        {data.options.map((o) => {
          const sel = picked.includes(o.id);
          const right = sel && result?.correct === true;
          const wrong = sel && result?.correct === false;
          const tone = right
            ? { bg: colors.mint50, line: colors.emerald500, edge: colors.emerald500, ink: colors.emerald800 }
            : wrong
              ? { bg: colors.dangerTint, line: colors.danger, edge: colors.danger, ink: colors.danger }
              : sel
                ? { bg: colors.mint50, line: colors.emerald700, edge: colors.emerald700, ink: colors.ink900 }
                : { bg: colors.card, line: colors.line, edge: colors.line, ink: colors.ink900 };
          const locked = done || !!result || busy;
          return (
            <Pressable
              key={o.id}
              accessibilityRole={multiple ? 'checkbox' : 'radio'}
              accessibilityState={{ checked: sel, disabled: locked }}
              disabled={locked}
              onPress={() => toggle(o.id)}
              style={({ pressed }) => [
                styles.option,
                { backgroundColor: tone.bg, borderColor: tone.line },
                // Đáp án là thứ bấm được → mép 3D; khoá (đã xong) thì phẳng
                !locked && { boxShadow: `0px ${pressed ? 1 : 3}px 0px ${tone.edge}`, transform: [{ translateY: pressed ? 2 : 0 }] },
                done && !sel && { opacity: 0.6 },
              ]}
            >
              <View
                style={[
                  multiple ? styles.box : styles.radio,
                  { borderColor: sel ? tone.line : colors.ink400 },
                  sel && { backgroundColor: tone.line },
                ]}
              >
                {sel && <Icon name={wrong ? 'close' : 'check'} size={12} strokeWidth={3.2} color="#ffffff" />}
              </View>
              <Text style={[type.input, styles.grow, { color: tone.ink }]}>{o.text}</Text>
            </Pressable>
          );
        })}
      </Animated.View>

      {result?.correct ? (
        <View accessibilityLiveRegion="polite" style={[styles.feedback, { backgroundColor: colors.mint50 }]}>
          <Text style={[type.label, { color: colors.emerald800 }]}>{data.answered ? 'Bạn đã trả lời đúng' : 'Chính xác!'}</Text>
          {result.explanation ? <Text style={[type.input, { color: colors.ink900 }]}>{result.explanation}</Text> : null}
        </View>
      ) : result ? (
        <View accessibilityLiveRegion="polite" style={styles.wrongRow}>
          <Text style={[type.label, styles.grow, { color: colors.danger }]}>
            {multiple ? 'Chưa đúng — kiểm tra lại các lựa chọn nhé.' : 'Chưa đúng, thử lại nhé.'}
          </Text>
          <View style={styles.retry}>
            <SecondaryButton label="Thử lại" icon="retry" onPress={retry} />
          </View>
        </View>
      ) : (
        <>
          {error ? <Text style={[type.caption, { color: colors.danger }]}>{error}</Text> : null}
          <PrimaryButton label="Kiểm tra" disabled={!picked.length} loading={busy} onPress={check} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1.5, borderRadius: 20, padding: 16, gap: 14 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, height: 26, borderRadius: 13 },
  question: { fontFamily: fonts.display600, fontSize: 17, lineHeight: 25 },
  options: { gap: 10 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, borderWidth: 1.5 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  grow: { flex: 1, minWidth: 0 },
  feedback: { borderRadius: 14, padding: 14, gap: 4 },
  wrongRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  retry: { minWidth: 120 },
});
