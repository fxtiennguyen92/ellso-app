import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, ScrollView, type ScrollViewInstance, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { PrimaryButton, SecondaryButton } from '@/components/auth/AuthUI';
import { BottomSheet } from '@/components/BottomSheet';
import { FloatingAction, floatingActionSpace } from '@/components/FloatingAction';
import { Icon } from '@/components/Icon';
import { apiPlacementTest, apiSubmitPlacement, type PlacementQuestion, type PlacementTestDetail } from '@/data/placement';
import { useScreenTopInset } from '@/hooks/useScreenTopInset';
import { ApiError } from '@/lib/api';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/typography';

/** Câu đã trả lời đủ điều kiện để đi tiếp chưa (chọn 1 / chọn từ min đến max / sắp xếp đủ mục). */
function isAnswered(q: PlacementQuestion, chosen: number[]) {
  if (q.type === 'single') return chosen.length === 1;
  if (q.type === 'ordering') return chosen.length === q.options.length;
  return chosen.length >= (q.minChoices ?? 1) && chosen.length <= (q.maxChoices ?? q.options.length);
}

function ruleText(q: PlacementQuestion) {
  if (q.type === 'single') return 'Chọn 1 đáp án';
  if (q.type === 'ordering') return 'Bấm lần lượt theo thứ tự, từ ưu tiên nhất. Bấm lại để bỏ.';
  const min = q.minChoices ?? 1;
  const max = q.maxChoices ?? q.options.length;
  return min === max ? `Chọn đúng ${min} đáp án` : `Chọn từ ${min} đến ${max} đáp án`;
}

/**
 * Làm bài kiểm tra đầu vào: mỗi màn một câu, thanh tiến độ trên cùng, nút Câu trước / Tiếp (nổi dưới đáy).
 * Câu cuối → Nộp bài → server chấm → chuyển sang màn kết quả (thay màn này, không quay lại được bài đã nộp).
 * Thời gian chỉ là ước tính, không đếm ngược. Thoát giữa chừng: hỏi xác nhận, câu trả lời không được lưu.
 */
export function PlacementTakeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const topInset = useScreenTopInset(8, 20);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();

  const [test, setTest] = useState<PlacementTestDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!token || !id) return;
    apiPlacementTest(token, id)
      .then(setTest)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Không tải được bài kiểm tra.'));
  }, [token, id]);

  const total = test?.questions.length ?? 0;
  useEffect(() => {
    if (!total) return;
    Animated.timing(progress, { toValue: (index + 1) / total, duration: 280, useNativeDriver: false }).start();
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [index, total, progress]);

  const q = test?.questions[index];
  const chosen = q ? (answers[q.id] ?? []) : [];
  const ok = q ? isAnswered(q, chosen) : false;
  const last = index === total - 1;

  const pick = (optionId: number) => {
    if (!q) return;
    setAnswers((a) => {
      const cur = a[q.id] ?? [];
      let next: number[];
      if (q.type === 'single') next = [optionId];
      else if (cur.includes(optionId)) next = cur.filter((x) => x !== optionId);
      else if (q.type === 'multiple' && cur.length >= (q.maxChoices ?? q.options.length)) next = cur; // đã đủ số được chọn
      else next = [...cur, optionId];
      return { ...a, [q.id]: next };
    });
  };

  const submit = async () => {
    if (!token || !test) return;
    setSubmitting(true);
    try {
      await apiSubmitPlacement(token, test.id, answers);
      router.replace({ pathname: '/placement-tests/[id]/result', params: { id: String(test.id), fresh: '1' } });
    } catch (e) {
      setSubmitting(false);
      setError(e instanceof ApiError ? e.message : 'Không nộp được bài, thử lại sau.');
    }
  };

  const exit = () => (router.canGoBack() ? router.back() : router.replace('/courses'));

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { paddingTop: topInset, borderBottomColor: colors.line }]}>
        <View style={styles.headRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Thoát bài kiểm tra"
            hitSlop={6}
            onPress={() => (Object.keys(answers).length ? setConfirmExit(true) : exit())}
            style={({ pressed }) => [styles.close, { backgroundColor: colors.card, borderColor: colors.line, opacity: pressed ? 0.7 : 1 }]}
          >
            <Icon name="close" size={20} color={colors.ink900} />
          </Pressable>
          <View style={styles.grow}>
            <Text style={[type.caption, { color: colors.ink600 }]} numberOfLines={1}>
              {test?.title ?? 'Bài kiểm tra đầu vào'}
            </Text>
            <Text style={[styles.counter, { color: colors.ink900 }]}>{total ? `Câu ${index + 1} / ${total}` : ' '}</Text>
          </View>
        </View>
        <View style={[styles.track, { backgroundColor: colors.surfaceAlt }]}>
          <Animated.View
            style={[styles.fill, { backgroundColor: colors.emerald500, width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]}
          />
        </View>
      </View>

      {!test ? (
        <View style={styles.center}>
          {error ? (
            <>
              <Text style={[type.body, { color: colors.ink600, textAlign: 'center' }]}>{error}</Text>
              <SecondaryButton label="Quay lại" onPress={exit} />
            </>
          ) : (
            <ActivityIndicator color={colors.emerald700} />
          )}
        </View>
      ) : q ? (
        <View style={styles.grow}>
          <ScrollView ref={scrollRef} contentContainerStyle={[styles.body, { paddingBottom: floatingActionSpace(insets.bottom) }]} showsVerticalScrollIndicator={false}>
            <Text style={[styles.prompt, { color: colors.ink900 }]}>{q.prompt}</Text>
            {q.hint ? <Text style={[type.body, { color: colors.ink600 }]}>{q.hint}</Text> : null}
            <View style={[styles.rule, { backgroundColor: colors.mint50 }]}>
              <Icon name={q.type === 'ordering' ? 'layers' : 'check'} size={14} strokeWidth={2.4} color={colors.emerald700} />
              <Text style={[type.captionStrong, { color: colors.emerald700 }]}>{ruleText(q)}</Text>
            </View>

            <View style={styles.options}>
              {q.options.map((o) => {
                const pos = chosen.indexOf(o.id);
                const on = pos >= 0;
                return (
                  <Pressable
                    key={o.id}
                    accessibilityRole={q.type === 'single' ? 'radio' : 'checkbox'}
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={q.type === 'ordering' && on ? `${o.label}, thứ tự ${pos + 1}` : o.label}
                    onPress={() => pick(o.id)}
                    style={({ pressed }) => [
                      styles.option,
                      on
                        ? { backgroundColor: colors.mint50, borderColor: colors.emerald700, boxShadow: `0px 3px 0px ${colors.emerald700}` }
                        : { backgroundColor: colors.card, borderColor: colors.line, boxShadow: `0px 3px 0px ${colors.line}` },
                      pressed && { transform: [{ translateY: 2 }], boxShadow: 'none' },
                    ]}
                  >
                    <View
                      style={[
                        q.type === 'single' ? styles.radio : styles.box,
                        { borderColor: on ? colors.emerald700 : colors.ink400, backgroundColor: on ? colors.emerald700 : 'transparent' },
                      ]}
                    >
                      {on && q.type === 'ordering' ? (
                        <Text style={[styles.order, { color: colors.onEmerald }]}>{pos + 1}</Text>
                      ) : on && q.type === 'multiple' ? (
                        <Icon name="check" size={14} strokeWidth={3.2} color={colors.onEmerald} />
                      ) : on ? (
                        <View style={[styles.dot, { backgroundColor: colors.onEmerald }]} />
                      ) : null}
                    </View>
                    <Text style={[styles.optionText, { color: colors.ink900 }]}>{o.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            {error ? <Text style={[type.captionStrong, { color: colors.danger }]}>{error}</Text> : null}
          </ScrollView>

          <FloatingAction row>
            {index > 0 ? <SecondaryButton label="Câu trước" icon="chevronLeft" onPress={() => setIndex((i) => i - 1)} /> : null}
            <PrimaryButton
              label={last ? 'Nộp bài' : 'Câu tiếp'}
              icon={last ? 'check' : undefined}
              disabled={!ok}
              loading={submitting}
              onPress={() => (last ? submit() : setIndex((i) => i + 1))}
            />
          </FloatingAction>
        </View>
      ) : null}

      <BottomSheet visible={confirmExit} onClose={() => setConfirmExit(false)} title="Thoát bài kiểm tra?">
        <Text style={[type.body, { color: colors.ink600 }]}>Các câu đã trả lời sẽ không được lưu. Lần sau bạn cần làm lại từ đầu.</Text>
        <View style={styles.sheetRow}>
          <View style={styles.grow}>
            <SecondaryButton label="Thoát" onPress={() => { setConfirmExit(false); setTimeout(exit, 200); }} />
          </View>
          <View style={styles.grow}>
            <PrimaryButton label="Làm tiếp" onPress={() => setConfirmExit(false)} />
          </View>
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  header: { paddingHorizontal: 16, paddingBottom: 16, gap: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  close: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  counter: { fontFamily: fonts.display600, fontSize: 17, lineHeight: 24 },
  track: { height: 8, borderRadius: 9999, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 9999 },
  body: { padding: 20, gap: 14 },
  prompt: { fontFamily: fonts.display600, fontSize: 21, lineHeight: 30 },
  rule: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9999 },
  options: { gap: 12, marginTop: 6 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 58, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16, borderWidth: 1.5 },
  optionText: { flex: 1, fontFamily: fonts.sans500, fontSize: 16, lineHeight: 23 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  box: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 9, height: 9, borderRadius: 5 },
  order: { fontFamily: fonts.sans700, fontSize: 13, lineHeight: 16 },
  sheetRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
});
