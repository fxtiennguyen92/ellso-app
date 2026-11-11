import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, type ScrollViewInstance, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { PrimaryButton, SecondaryButton } from '@/components/auth/AuthUI';
import { Icon, type IconName } from '@/components/Icon';
import { Confetti } from '@/components/placement/Confetti';
import { SCROLL_TOP_SPACE, ScrollTopButton } from '@/components/ScrollTopButton';
import { useToast } from '@/components/Toast';
import { apiLesson, apiMarkRead, apiPlayVideo, type Lesson, lessonErrorKind, type LessonProgress, readingMinutes } from '@/data/lesson';
import { useScreenTopInset } from '@/hooks/useScreenTopInset';
import { useTheme } from '@/theme/ThemeProvider';
import { CHAPTER_COLOR_ORDER, type ChapterColor, chapterPalette } from '@/theme/tokens';
import { fonts, type } from '@/theme/typography';

import { type Accent, StaticBlock } from './LessonBlocks';
import { LessonFeedback } from './LessonFeedback';
import { QuizBlock } from './QuizBlock';
import { useLessonTracking } from './useLessonTracking';
import { VideoBlock } from './VideoBlock';
import { ArticleBones } from '@/components/skeletons';

type LoadState = 'loading' | 'ready' | ReturnType<typeof lessonErrorKind>;

/**
 * Màn Nội dung bài học (mở từ bản đồ lộ trình). GET /lessons/{id} → các khối Editor.js:
 * chữ / tiêu đề / danh sách / trích dẫn / phân cách / ảnh / bảng / code / lưu ý (LessonBlocks), câu hỏi (QuizBlock), video (VideoBlock).
 * - Thanh tiến độ đọc dưới header (màu chương).
 * - Cuộn tới cuối → POST /read. Đọc hết + đúng hết câu hỏi = hoàn thành → pháo giấy.
 * - Cuối bài: đánh giá hữu ích / chưa; theo dõi thời gian học, độ sâu cuộn, video (useLessonTracking).
 * Quay về bản đồ → bản đồ tự tải lại (useFocusEffect ở CourseLearnScreen).
 */
export function LessonScreen({ lessonId, color, courseId }: { lessonId: string; color?: string; courseId?: string }) {
  const { colors, scheme } = useTheme();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const topInset = useScreenTopInset(12, 28);
  const [toast, showToast] = useToast();

  const chapter: ChapterColor = (CHAPTER_COLOR_ORDER as string[]).includes(color ?? '') ? (color as ChapterColor) : 'sage';
  const p = chapterPalette[chapter];
  const accent: Accent = { base: p.base, soft: p.ring, ink: scheme === 'dark' ? p.inkDark : p.base };

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [progress, setProgress] = useState<LessonProgress | null>(null);
  const [answered, setAnswered] = useState<Record<string, boolean>>({});
  const [celebrate, setCelebrate] = useState(false);

  const load = useCallback(() => {
    if (!token) return;
    setState('loading');
    apiLesson(token, lessonId)
      .then((l) => {
        setLesson(l);
        if (l.kind === 'lesson') {
          setProgress(l.progress);
          const a: Record<string, boolean> = {};
          l.blocks.forEach((b) => b.type === 'quiz' && (a[b.id] = b.data.answered));
          setAnswered(a);
        }
        setState('ready');
      })
      .catch((e) => setState(lessonErrorKind(e)));
  }, [token, lessonId]);

  useEffect(load, [load]);

  const ready = state === 'ready' && lesson?.kind === 'lesson' ? lesson : null;
  const track = useLessonTracking(token, ready ? ready.id : null);

  // ── Tiến độ đọc + đánh dấu đã đọc khi cuộn tới cuối
  const scrollRef = useRef<ScrollViewInstance>(null);
  const [readPct, setReadPct] = useState(0);
  const [showTop, setShowTop] = useState(false);
  // Tên bài trên header chỉ hiện khi tiêu đề lớn đầu bài đã cuộn khuất (tránh lặp 2 tiêu đề)
  const heroBottom = useRef(120);
  const [titleOn, setTitleOn] = useState(false);
  const endY = useRef<number | null>(null);
  const viewportH = useRef(0);
  const contentH = useRef(0);
  const marking = useRef(false);
  const quizY = useRef<Record<string, number>>({});

  const updateProgress = useCallback(
    (next: LessonProgress) => {
      setProgress((prev) => {
        if (next.completed && !prev?.completed) setCelebrate(true);
        return next;
      });
    },
    [],
  );

  const checkEnd = useCallback(
    (y: number) => {
      if (!ready || endY.current === null) return;
      if (y + viewportH.current < endY.current) return;
      track.reachedEnd();
      if (progress?.read || marking.current || !token) return;
      marking.current = true;
      apiMarkRead(token, ready.id)
        .then(updateProgress)
        .catch(() => {
          marking.current = false; // thử lại lần cuộn sau
        });
    },
    [ready, progress?.read, token, track, updateProgress],
  );

  const onScroll = (y: number) => {
    const max = contentH.current - viewportH.current;
    setReadPct(max > 0 ? Math.min(1, Math.max(0, y / max)) : 1);
    setShowTop((v) => (v === y > 600 ? v : y > 600));
    setTitleOn((v) => (v === y > heroBottom.current ? v : y > heroBottom.current));
    track.onScroll(y, viewportH.current, contentH.current);
    checkEnd(y);
  };

  const goBack = () => (router.canGoBack() ? router.back() : router.replace(courseId ? `/courses/${courseId}` : '/courses'));

  const remaining = ready ? ready.blocks.filter((b) => b.type === 'quiz' && !answered[b.id]) : [];
  const firstRemaining = remaining[0];

  let quizNo = 0;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      {/* Header cố định + thanh tiến độ đọc */}
      <View style={[styles.header, { paddingTop: topInset, backgroundColor: colors.bg }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại lộ trình"
          onPress={goBack}
          style={({ pressed }) => [styles.back, { backgroundColor: colors.card, borderColor: colors.line, opacity: pressed ? 0.7 : 1 }]}
        >
          <Icon name="chevronLeft" color={colors.ink900} />
        </Pressable>
        <Text
          numberOfLines={1}
          style={[styles.headerTitle, { color: colors.ink900, opacity: titleOn || state !== 'ready' || lesson?.kind !== 'lesson' ? 1 : 0 }]}
        >
          {lesson?.title ?? ''}
        </Text>
        {progress?.completed ? (
          <View accessibilityLabel="Đã hoàn thành" style={[styles.doneDot, { backgroundColor: colors.emerald700 }]}>
            <Icon name="check" size={16} strokeWidth={3} color={colors.onEmerald} />
          </View>
        ) : null}
        {ready && (
          <View
            accessibilityRole="progressbar"
            accessibilityLabel="Tiến độ đọc bài"
            accessibilityValue={{ min: 0, max: 100, now: Math.round(readPct * 100) }}
            style={[styles.track, { backgroundColor: colors.line }]}
          >
            <View style={[styles.fill, { width: `${readPct * 100}%`, backgroundColor: accent.base }]} />
          </View>
        )}
      </View>

      {state === 'loading' ? (
        <ArticleBones />
      ) : state !== 'ready' ? (
        <ErrorView kind={state} onRetry={load} onBack={goBack} />
      ) : lesson?.kind === 'coaching' ? (
        <Message
          icon="people"
          title={lesson.title}
          text="Buổi trao đổi trực tiếp với giáo viên. Tính năng đặt lịch sẽ có trong bản cập nhật tới."
          action={<SecondaryButton label="Về lộ trình" onPress={goBack} />}
        />
      ) : ready ? (
        <ScrollView
          ref={scrollRef}
          scrollEventThrottle={32}
          onScroll={(e) => onScroll(e.nativeEvent.contentOffset.y)}
          onLayout={(e) => {
            viewportH.current = e.nativeEvent.layout.height;
          }}
          onContentSizeChange={(_, h) => {
            contentH.current = h;
            // Bài ngắn, không cần cuộn → coi như đã tới cuối
            if (h <= viewportH.current + 1) checkEnd(0);
          }}
          onTouchStart={track.touch}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SCROLL_TOP_SPACE + 24 }]}
        >
          <View style={styles.hero} onLayout={(e) => (heroBottom.current = e.nativeEvent.layout.y + e.nativeEvent.layout.height - 40)}>
            <Text accessibilityRole="header" style={[type.screenTitle, { color: colors.ink900 }]}>
              {ready.title}
            </Text>
            {ready.summary ? <Text style={[type.body, { color: colors.ink600 }]}>{ready.summary}</Text> : null}
            <View style={styles.meta}>
              <Icon name="clock" size={15} color={colors.ink600} />
              <Text style={[type.caption, { color: colors.ink600 }]}>
                {readingMinutes(ready.blocks)} phút{ready.quizCount ? ` · ${ready.quizCount} câu hỏi` : ''}
              </Text>
            </View>
          </View>

          {ready.blocks.map((b, i) => {
            if (b.type === 'quiz') {
              quizNo += 1;
              return (
                <View key={b.id} onLayout={(e) => (quizY.current[b.id] = e.nativeEvent.layout.y)}>
                  <QuizBlock
                    lessonId={ready.id}
                    blockId={b.id}
                    number={quizNo}
                    data={b.data}
                    onAnswered={(correct, pr) => {
                      track.touch();
                      if (correct) setAnswered((a) => ({ ...a, [b.id]: true }));
                      updateProgress(pr);
                    }}
                  />
                </View>
              );
            }
            if (b.type === 'video') {
              return (
                <VideoBlock
                  key={b.id ?? i}
                  data={b.data}
                  load={() => apiPlayVideo(token ?? '', ready.id, b.data.video_id).then((r) => r.url)}
                  onWatch={track.addVideo}
                />
              );
            }
            return <StaticBlock key={b.id ?? i} block={b} accent={accent} onCopied={() => showToast('Đã sao chép code')} />;
          })}

          {/* Mốc cuối bài: chạm tới đây = đã đọc hết */}
          <View
            onLayout={(e) => {
              endY.current = e.nativeEvent.layout.y + 40;
              if (contentH.current && contentH.current <= viewportH.current + 1) checkEnd(0);
            }}
            style={[styles.divider, { backgroundColor: colors.line }]}
          />

          {progress?.completed ? (
            <View style={[styles.doneCard, { backgroundColor: colors.mint50 }]}>
              <View style={[styles.doneIcon, { backgroundColor: colors.emerald700 }]}>
                <Icon name="trophy" size={26} color={colors.onEmerald} />
              </View>
              <Text style={[type.h2, styles.centerText, { color: colors.emerald800 }]}>Hoàn thành bài học!</Text>
              <Text style={[type.input, styles.centerText, { color: colors.emerald700 }]}>Bài tiếp theo trên lộ trình đã mở.</Text>
            </View>
          ) : firstRemaining ? (
            <View style={[styles.todoCard, { backgroundColor: colors.card, borderColor: colors.line }]}>
              <Text style={[type.label, { color: colors.ink900 }]}>
                Còn {remaining.length} câu hỏi cần trả lời đúng để hoàn thành bài.
              </Text>
              <SecondaryButton
                label="Tới câu hỏi"
                icon="help"
                onPress={() => scrollRef.current?.scrollTo({ y: Math.max(0, (quizY.current[firstRemaining.id!] ?? 0) - 24), animated: true })}
              />
            </View>
          ) : null}

          <LessonFeedback lessonId={ready.id} initial={ready.myFeedback} reasons={ready.feedbackReasons} />

          <PrimaryButton label={progress?.completed ? 'Tiếp tục lộ trình' : 'Về lộ trình'} icon={progress?.completed ? 'map' : undefined} onPress={goBack} />
        </ScrollView>
      ) : null}

      {ready && <ScrollTopButton tabBar={false} visible={showTop} onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })} />}
      {celebrate && <Confetti delay={0} />}
      {toast}
    </View>
  );
}

function ErrorView({ kind, onRetry, onBack }: { kind: Exclude<LoadState, 'loading' | 'ready'>; onRetry: () => void; onBack: () => void }) {
  const back = <SecondaryButton label="Về lộ trình" onPress={onBack} />;
  switch (kind) {
    case 'locked':
      return <Message icon="lock" title="Bài học chưa mở" text="Hoàn thành bài trước trên lộ trình để mở bài này nhé." action={back} />;
    case 'not_enrolled':
      return <Message icon="lock" title="Bạn chưa có khoá học này" text="Thêm khoá học vào giỏ hàng hoặc bắt đầu học thử để xem bài." action={back} />;
    case 'placement':
      return <Message icon="target" title="Cần đánh giá năng lực trước" text="Làm bài đánh giá năng lực của khoá để Ellso chọn lộ trình phù hợp với bạn." action={back} />;
    case 'not_found':
      return <Message icon="alert" title="Không tìm thấy bài học" text="Bài học có thể đã được gỡ hoặc thay đổi." action={back} />;
    default:
      return (
        <Message
          icon="alert"
          title="Không tải được bài học"
          text={kind === 'network' ? 'Kiểm tra kết nối mạng rồi thử lại.' : 'Có lỗi xảy ra, thử lại sau nhé.'}
          action={<PrimaryButton label="Thử lại" icon="retry" onPress={onRetry} />}
        />
      );
  }
}

function Message({ icon, title, text, action }: { icon: IconName; title: string; text: string; action?: React.ReactNode }) {
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

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 18, zIndex: 2 },
  back: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, minWidth: 0, fontFamily: fonts.display600, fontSize: 16, lineHeight: 22 },
  doneDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  track: { position: 'absolute', left: 16, right: 16, bottom: 6, height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 20, paddingTop: 8, gap: 20 },
  hero: { gap: 10, paddingBottom: 4 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  divider: { height: 1, marginTop: 8 },
  doneCard: { alignItems: 'center', gap: 8, padding: 20, borderRadius: 20 },
  doneIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  todoCard: { gap: 12, padding: 16, borderRadius: 18, borderWidth: 1 },
  centerText: { textAlign: 'center' },
  message: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32, paddingBottom: 60 },
  messageIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  messageAction: { alignSelf: 'stretch', marginTop: 12 },
});
