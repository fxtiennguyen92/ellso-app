import { router, useFocusEffect } from 'expo-router';
import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { PrimaryButton, SecondaryButton } from '@/components/auth/AuthUI';
import { useDocuments } from '@/components/documents/DocumentsContext';
import { Icon } from '@/components/Icon';
import { SubpageHeader } from '@/components/SubpageHeader';
import { apiChoosePath, apiMyCourse, isNotEnrolled, type MyCourse } from '@/data/learning';
import { ApiError } from '@/lib/api';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/typography';

import { CourseMapScreen } from './CourseMapScreen';
import { MapBones } from '@/components/skeletons';

/**
 * Vào học một khoá (/courses/[id]) — tải GET /my/courses/{id} rồi chọn màn:
 * 1. Chưa ghi danh (404) → báo + nút xem trang giới thiệu khoá.
 * 2. Chưa có lộ trình mà khoá bắt buộc đánh giá năng lực chưa làm → danh sách bài cần làm (tải lại khi quay về).
 * 3. Chưa có lộ trình → câu hỏi chọn lộ trình (mỗi câu chọn 1) → POST …/path → bản đồ.
 * 4. Có lộ trình → bản đồ bài học (CourseMapScreen).
 */
export function CourseLearnScreen({ courseId }: { courseId: string }) {
  const { colors } = useTheme();
  const { token } = useAuth();
  const [data, setData] = useState<MyCourse | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'not_enrolled' | 'error'>('loading');

  const load = useCallback(() => {
    if (!token) return;
    apiMyCourse(token, courseId)
      .then((d) => {
        setData(d);
        setState('ready');
      })
      .catch((e) => setState(isNotEnrolled(e) ? 'not_enrolled' : 'error'));
  }, [token, courseId]);

  // Tải lại khi quay về màn (vd vừa làm xong bài đánh giá năng lực)
  useFocusEffect(load);

  if (state === 'ready' && data?.path) return <CourseMapScreen path={data.path} />;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <SubpageHeader title={data?.courseTitle ?? 'Khoá học'} fallback="/courses" />
      {state === 'loading' ? (
        <MapBones />
      ) : state === 'not_enrolled' ? (
        <Message
          icon="lock"
          title="Bạn chưa mở khoá học này"
          text="Mua khoá học hoặc ghi danh khoá miễn phí ở trang giới thiệu để bắt đầu học."
          action={<PrimaryButton label="Xem thông tin khoá học" icon="info" onPress={() => router.replace({ pathname: '/catalog/[id]', params: { id: courseId } })} />}
        />
      ) : state === 'error' || !data ? (
        <Message icon="alert" title="Không tải được khoá học" text="Kiểm tra kết nối rồi thử lại." action={<SecondaryButton label="Thử lại" onPress={load} />} />
      ) : data.needsPath && data.needsPlacementTest ? (
        <PlacementGate data={data} />
      ) : data.needsPath ? (
        <PathQuestions data={data} onDone={setData} onNeedTests={load} />
      ) : (
        <Message icon="layers" title="Khoá học đang được cập nhật" text="Lộ trình của bạn chưa có bài học nào. Quay lại sau nhé." />
      )}
    </View>
  );
}

function Message({ icon, title, text, action }: { icon: 'lock' | 'alert' | 'layers'; title: string; text: string; action?: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.message}>
      <View style={[styles.messageIcon, { backgroundColor: colors.mint50 }]}>
        <Icon name={icon} size={30} color={colors.emerald700} />
      </View>
      <Text style={[type.h2, styles.centerText, { color: colors.ink900 }]}>{title}</Text>
      <Text style={[type.body, styles.centerText, { color: colors.ink600 }]}>{text}</Text>
      {action ? <View style={styles.messageAction}>{action}</View> : null}
    </View>
  );
}

/** Khoá bắt buộc đánh giá năng lực: liệt kê bài, bài chưa làm có nút Làm bài. */
function PlacementGate({ data }: { data: MyCourse }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 32 }]}>
      <View style={[styles.hero, { backgroundColor: colors.mint50 }]}>
        <Icon name="target" size={28} color={colors.emerald700} />
        <Text style={[type.h2, { color: colors.emerald800 }]}>Đánh giá năng lực trước khi học</Text>
        <Text style={[type.body, { color: colors.emerald700 }]}>
          Kết quả giúp Ellso chọn lộ trình phù hợp với bạn. Mỗi bài chỉ mất vài phút.
        </Text>
      </View>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line }]}>
        {data.placementTests.map((t, i) => (
          <View key={t.id} style={[styles.testRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line }]}>
            <Icon name={t.completed ? 'checkCircle' : 'clipboard'} size={20} color={t.completed ? colors.emerald700 : colors.ink400} />
            <Text style={[type.label, styles.grow, { color: colors.ink900 }]} numberOfLines={2}>
              {t.title}
            </Text>
            {t.completed ? (
              <Text style={[type.captionStrong, { color: colors.emerald700 }]}>Đã làm</Text>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Làm bài ${t.title}`}
                onPress={() => router.push({ pathname: '/placement-tests/[id]', params: { id: String(t.id) } })}
                style={({ pressed }) => [styles.smallBtn, { backgroundColor: pressed ? colors.emerald800 : colors.emerald700 }]}
              >
                <Text style={[type.captionStrong, { color: colors.onEmerald }]}>Làm bài</Text>
              </Pressable>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

/** Câu hỏi chọn lộ trình (mỗi câu chọn 1 đáp án), gửi xong hiện bản đồ. */
function PathQuestions({ data, onDone, onNeedTests }: { data: MyCourse; onDone: (d: MyCourse) => void; onNeedTests: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { showToast } = useDocuments();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const pre: Record<number, number> = {};
    data.questions.forEach((q) => {
      const sel = q.options.find((o) => o.selected);
      if (sel) pre[q.id] = sel.id;
    });
    setAnswers(pre);
  }, [data.questions]);

  const ready = data.questions.every((q) => answers[q.id]);
  const submit = async () => {
    if (!token || !ready) return;
    setBusy(true);
    try {
      const d = await apiChoosePath(token, data.courseId, Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, [v]])));
      onDone(d);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) onNeedTests();
      else showToast(e instanceof ApiError ? e.message : 'Không gửi được, thử lại sau.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 32 }]}>
      <View style={[styles.hero, { backgroundColor: colors.mint50 }]}>
        <Icon name="branch" size={28} color={colors.emerald700} />
        <Text style={[type.h2, { color: colors.emerald800 }]}>Chọn lộ trình phù hợp</Text>
        <Text style={[type.body, { color: colors.emerald700 }]}>Trả lời vài câu ngắn để Ellso gợi ý lộ trình dành riêng cho bạn.</Text>
      </View>
      {data.questions.map((q, qi) => (
        <View key={q.id} style={styles.question}>
          <Text style={[styles.qText, { color: colors.ink900 }]}>
            {qi + 1}. {q.question}
          </Text>
          {q.options.map((o) => {
            const on = answers[q.id] === o.id;
            return (
              <Pressable
                key={o.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                onPress={() => setAnswers((a) => ({ ...a, [q.id]: o.id }))}
                style={({ pressed }) => [
                  styles.option,
                  on
                    ? { backgroundColor: colors.mint50, borderColor: colors.emerald700, boxShadow: `0px 3px 0px ${colors.emerald700}` }
                    : { backgroundColor: colors.card, borderColor: colors.line, boxShadow: `0px 3px 0px ${colors.line}` },
                  pressed && { transform: [{ translateY: 2 }], boxShadow: 'none' },
                ]}
              >
                <View style={[styles.radio, { borderColor: on ? colors.emerald700 : colors.ink400, backgroundColor: on ? colors.emerald700 : 'transparent' }]}>
                  {on ? <View style={[styles.dot, { backgroundColor: colors.onEmerald }]} /> : null}
                </View>
                <View style={styles.grow}>
                  <Text style={[type.label, { color: colors.ink900 }]}>{o.name}</Text>
                  {o.description ? <Text style={[type.caption, { color: colors.ink600 }]}>{o.description}</Text> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
      <View style={styles.submit}>
        <PrimaryButton label="Xem lộ trình của tôi" disabled={!ready} loading={busy} onPress={submit} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  grow: { flex: 1, minWidth: 0 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  centerText: { textAlign: 'center' },
  message: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 32, paddingBottom: 80 },
  messageIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  messageAction: { alignSelf: 'stretch', marginTop: 14 },
  body: { padding: 16, gap: 20 },
  hero: { borderRadius: 20, padding: 18, gap: 6 },
  card: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 14 },
  testRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  smallBtn: { height: 34, paddingHorizontal: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  question: { gap: 10 },
  qText: { fontFamily: fonts.display600, fontSize: 17, lineHeight: 24 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1.5 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  submit: { marginTop: 4 },
});
