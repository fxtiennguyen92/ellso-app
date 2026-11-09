/**
 * Nội dung bài học + theo dõi trải nghiệm (nối ellso-server):
 * - GET   /lessons/{id}                         → nội dung (khối Editor.js đã làm sạch), tiến độ, đánh giá của tôi
 * - POST  /lessons/{id}/read                    → đã đọc đến cuối bài → tiến độ
 * - POST  /lessons/{id}/quiz                    → {block_id, option_ids} → {correct, explanation, progress}
 * - POST  /lessons/{id}/videos/{videoId}/play   → link HLS có hạn 5 phút
 * - POST  /lessons/{id}/sessions                → mở phiên học (tracking)
 * - PATCH /lesson-sessions/{id}                 → thời gian học thực, độ sâu cuộn, đọc hết, giây xem video
 * - POST  /lessons/{id}/feedback                → đánh giá cuối bài (hữu ích / chưa + lý do)
 * Lỗi mở bài: 403 lesson_locked | not_enrolled, 409 placement_test_required.
 */
import { ApiError, apiRequest } from '@/lib/api';

// ── Khối nội dung (Editor.js) ─────────────────────────────

export type ListItem = { content: string; meta?: { checked?: boolean }; items?: ListItem[] };

export type LessonBlock =
  | { id?: string; type: 'paragraph'; data: { text: string } }
  | { id?: string; type: 'header'; data: { text: string; level: number } }
  | {
      id?: string;
      type: 'list';
      // list v2: items là object lồng nhau; list v1 (cũ): items là chuỗi
      data: { style: 'ordered' | 'unordered' | 'checklist'; meta?: { start?: number; counterType?: string }; items: (ListItem | string)[] };
    }
  | { id?: string; type: 'quote'; data: { text: string; caption?: string; alignment?: 'left' | 'center' } }
  | { id?: string; type: 'delimiter'; data: Record<string, never> }
  | {
      id?: string;
      type: 'image';
      data: { file: { url: string }; caption?: string; withBorder?: boolean; stretched?: boolean; withBackground?: boolean };
    }
  | { id?: string; type: 'table'; data: { withHeadings?: boolean; content: string[][] } }
  | { id?: string; type: 'code'; data: { code: string } }
  | { id?: string; type: 'warning'; data: { title?: string; message?: string } }
  | { id: string; type: 'quiz'; data: QuizData }
  | { id?: string; type: 'video'; data: VideoData };

export type QuizData = { type: 'single' | 'multiple'; question: string; options: { id: string; text: string }[]; answered: boolean };
export type VideoChapter = { start: number; time: string; title: string };
export type VideoData = { video_id: number; duration_seconds: number | null; caption?: string; chapters: VideoChapter[] };

export type LessonProgress = {
  read: boolean;
  completed: boolean;
  quizzesTotal: number;
  quizzesCorrect: number;
};

export type Feedback = { rating: 1 | -1; reasons: string[]; comment: string | null };

export type Lesson =
  | { kind: 'coaching'; id: number; title: string; courseId: number | null }
  | {
      kind: 'lesson';
      id: number;
      title: string;
      summary: string | null;
      courseId: number | null;
      blocks: LessonBlock[];
      quizCount: number;
      progress: LessonProgress;
      myFeedback: Feedback | null;
      feedbackReasons: { key: string; label: string }[];
    };

type ApiProgress = { read?: boolean; completed?: boolean; quizzes_total?: number; quizzes_correct?: number; read_at?: string | null; completed_at?: string | null };

const progressOf = (p: ApiProgress | undefined): LessonProgress => ({
  read: Boolean(p?.read ?? p?.read_at),
  completed: Boolean(p?.completed ?? p?.completed_at),
  quizzesTotal: p?.quizzes_total ?? 0,
  quizzesCorrect: p?.quizzes_correct ?? 0,
});

export async function apiLesson(token: string, id: string | number): Promise<Lesson> {
  const { data } = await apiRequest<{ data: Record<string, any> }>('GET', `/lessons/${id}`, { token });
  if (data.type === 'coaching') return { kind: 'coaching', id: data.id, title: data.title, courseId: data.course_id ?? null };
  return {
    kind: 'lesson',
    id: data.id,
    title: data.title,
    summary: data.summary ?? null,
    courseId: data.course_id ?? null,
    blocks: (data.content?.blocks ?? []) as LessonBlock[],
    quizCount: data.quiz_count ?? 0,
    progress: progressOf(data.progress),
    myFeedback: data.my_feedback ?? null,
    feedbackReasons: data.feedback_reasons ?? [],
  };
}

export async function apiMarkRead(token: string, id: number): Promise<LessonProgress> {
  const { data } = await apiRequest<{ data: ApiProgress }>('POST', `/lessons/${id}/read`, { token });
  return progressOf(data);
}

export async function apiAnswerQuiz(
  token: string,
  id: number,
  blockId: string,
  optionIds: string[],
): Promise<{ correct: boolean; explanation: string | null; progress: LessonProgress }> {
  const { data } = await apiRequest<{ data: { correct: boolean; explanation?: string | null; progress: ApiProgress } }>(
    'POST',
    `/lessons/${id}/quiz`,
    { token, body: { block_id: blockId, option_ids: optionIds } },
  );
  return { correct: data.correct, explanation: data.explanation || null, progress: progressOf(data.progress) };
}

export async function apiPlayVideo(token: string, lessonId: number, videoId: number): Promise<{ url: string; expiresAt: string }> {
  const { data } = await apiRequest<{ data: { url: string; expires_at: string } }>('POST', `/lessons/${lessonId}/videos/${videoId}/play`, { token });
  return { url: data.url, expiresAt: data.expires_at };
}

// ── Theo dõi trải nghiệm ─────────────────────────────────

export type SessionStats = { active_seconds: number; max_scroll_percent: number; reached_end: boolean; video_seconds: number };

export async function apiStartSession(token: string, lessonId: number): Promise<number> {
  const { data } = await apiRequest<{ data: { session_id: number } }>('POST', `/lessons/${lessonId}/sessions`, { token });
  return data.session_id;
}

export function apiUpdateSession(token: string, sessionId: number, stats: SessionStats) {
  return apiRequest('PATCH', `/lesson-sessions/${sessionId}`, { token, body: stats });
}

export async function apiSendFeedback(token: string, lessonId: number, fb: { rating: 1 | -1; reasons?: string[]; comment?: string | null }): Promise<Feedback> {
  const { data } = await apiRequest<{ data: Feedback }>('POST', `/lessons/${lessonId}/feedback`, { token, body: fb });
  return data;
}

/** Lỗi mở bài → loại màn báo lỗi. */
export function lessonErrorKind(e: unknown): 'locked' | 'not_enrolled' | 'placement' | 'not_found' | 'network' | 'error' {
  if (!(e instanceof ApiError)) return 'error';
  if (e.status === 0) return 'network';
  if (e.status === 409) return 'placement';
  if (e.code === 'lesson_locked') return 'locked';
  if (e.code === 'not_enrolled') return 'not_enrolled';
  if (e.status === 404) return 'not_found';
  return 'error';
}

// ── Tiện ích nội dung ────────────────────────────────────

const stripTags = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ');

/** Ước lượng phút đọc (~200 từ / phút) + thời lượng video. */
export function readingMinutes(blocks: LessonBlock[]): number {
  let words = 0;
  let videoSeconds = 0;
  const count = (s?: string) => {
    if (s) words += stripTags(s).split(/\s+/).filter(Boolean).length;
  };
  const countItems = (items: (ListItem | string)[]) =>
    items.forEach((it) => {
      if (typeof it === 'string') count(it);
      else {
        count(it.content);
        countItems(it.items ?? []);
      }
    });
  for (const b of blocks) {
    switch (b.type) {
      case 'paragraph':
      case 'header':
        count(b.data.text);
        break;
      case 'quote':
        count(b.data.text);
        break;
      case 'list':
        countItems(b.data.items);
        break;
      case 'table':
        b.data.content.forEach((r) => r.forEach(count));
        break;
      case 'warning':
        count(b.data.title);
        count(b.data.message);
        break;
      case 'quiz':
        count(b.data.question);
        words += 30; // thời gian suy nghĩ
        break;
      case 'video':
        videoSeconds += b.data.duration_seconds ?? 0;
        break;
      case 'code':
        words += b.data.code.split(/\s+/).length;
        break;
    }
  }
  return Math.max(1, Math.round(words / 200 + videoSeconds / 60));
}
