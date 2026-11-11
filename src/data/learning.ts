/**
 * Lộ trình học của khoá đã ghi danh (nối ellso-server):
 * - GET  /my/courses/{id}        → chưa có lộ trình: câu hỏi phân loại; có: bản đồ chương / bài / bài thi + tiến độ
 * - POST /my/courses/{id}/path   → trả lời câu hỏi → gán lộ trình → bản đồ (409 placement_test_required nếu còn bài đánh giá)
 */
import type { IconName } from '@/components/Icon';
import { ApiError, apiRequest } from '@/lib/api';
import { CHAPTER_COLOR_ORDER, type ChapterColor } from '@/theme/tokens';

import type { CoursePath, PathChapter, PathLesson } from './courses';

export type PathQuestion = { id: number; question: string; options: { id: number; name: string; description: string | null; selected: boolean }[] };

export type MyCourse = {
  courseId: number;
  courseTitle: string;
  pathName: string | null;
  needsPath: boolean;
  needsPlacementTest: boolean;
  placementTests: { id: number; title: string; completed: boolean }[];
  progress: { total: number; completed: number; percent: number | null };
  questions: PathQuestion[];
  /** Bản đồ (null khi chưa có lộ trình). */
  path: CoursePath | null;
};

type ApiLesson = { id: number; type: 'lesson' | 'coaching'; title: string; state: 'completed' | 'available' | 'locked' };
type ApiChapter =
  | { id: number; type: 'chapter'; title: string; color: string | null; lessons: ApiLesson[] }
  | { id: number; type: 'exam'; title: string; state: 'locked' | 'available' | 'passed' };
type ApiMyCourse = {
  course: { id: number; title: string };
  path: { id: number; name: string } | null;
  needs_path: boolean;
  needs_placement_test: boolean;
  placement_tests: { id: number; title: string; completed: boolean }[];
  progress: { total: number; completed: number; percent: number | null };
  questions?: PathQuestion[];
  chapters?: ApiChapter[];
};

const ICONS: IconName[] = ['bulb', 'layers', 'key', 'target', 'grid', 'branch', 'eye', 'zap', 'message', 'scale'];

const status = (s: string): PathLesson['status'] => (s === 'completed' || s === 'passed' ? 'done' : s === 'available' ? 'next' : 'locked');

/** API → dạng bản đồ của CourseMapScreen. Bài thi (ngang cấp chương) gắn vào cuối chương đứng trước nó. */
function toPath(d: ApiMyCourse): CoursePath | null {
  if (!d.chapters) return null;
  const chapters: PathChapter[] = [];
  let n = 0;
  d.chapters.forEach((ch, i) => {
    if (ch.type === 'exam') {
      const lesson: PathLesson = { id: `exam-${ch.id}`, title: ch.title, kind: 'test', status: status(ch.state), icon: 'clipboard' };
      if (chapters.length) chapters[chapters.length - 1].lessons.push(lesson);
      else chapters.push({ id: `exam-ch-${ch.id}`, title: ch.title, color: 'graphite', lessons: [lesson] });
      return;
    }
    const color = (CHAPTER_COLOR_ORDER as string[]).includes(ch.color ?? '') ? (ch.color as ChapterColor) : CHAPTER_COLOR_ORDER[i % CHAPTER_COLOR_ORDER.length];
    chapters.push({
      id: String(ch.id),
      title: ch.title,
      color,
      lessons: ch.lessons.map((l) => ({
        id: String(l.id),
        title: l.title,
        kind: l.type === 'coaching' ? 'meeting' : 'lesson',
        status: status(l.state),
        icon: l.type === 'coaching' ? 'people' : ICONS[n++ % ICONS.length],
      })),
    });
  });
  return { courseId: String(d.course.id), courseTitle: d.course.title, pathName: d.path?.name ?? 'Mặc định', chapters: chapters.filter((c) => c.lessons.length) };
}

const fromApi = (d: ApiMyCourse): MyCourse => ({
  courseId: d.course.id,
  courseTitle: d.course.title,
  pathName: d.path?.name ?? null,
  needsPath: d.needs_path,
  needsPlacementTest: d.needs_placement_test,
  placementTests: d.placement_tests,
  progress: d.progress,
  questions: d.questions ?? [],
  path: toPath(d),
});

export async function apiMyCourse(token: string, id: string | number): Promise<MyCourse> {
  const { data } = await apiRequest<{ data: ApiMyCourse }>('GET', `/my/courses/${id}`, { token });
  return fromApi(data);
}

/** Gửi câu trả lời phân loại → gán lộ trình. Còn bài đánh giá bắt buộc → ném ApiError status 409. */
export async function apiChoosePath(token: string, id: string | number, answers: Record<number, number[]>): Promise<MyCourse> {
  const { data } = await apiRequest<{ data: ApiMyCourse }>('POST', `/my/courses/${id}/path`, { token, body: { answers } });
  return fromApi(data);
}

export const isNotEnrolled = (e: unknown) => e instanceof ApiError && e.status === 404;

// ── Tiếp tục khoá học (tab Khoá học) ──────────────────────

export type ContinueCourse = {
  id: number;
  title: string;
  coverUrl: string | null;
  percent: number;
  completed: number;
  total: number;
  /** Bài học kế tiếp (null: chưa chọn lộ trình / còn bài đánh giá / đã xong hết). */
  nextLesson: string | null;
  needsPath: boolean;
  needsPlacementTest: boolean;
  started: boolean;
  done: boolean;
  /** Ngày hoàn thành khoá (ISO) — null nếu chưa xong. */
  completedAt: string | null;
  /** Khoá miễn phí (tự vào) — chưa học bài nào thì không tính là "đang học". */
  free: boolean;
};

type ApiMyCourseSummary = {
  course: { id: number; title: string; cover_url: string | null };
  needs_path: boolean;
  needs_placement_test: boolean;
  progress: { total: number; completed: number; percent: number | null };
  next_lesson: { id: number; title: string } | null;
  source: 'admin' | 'purchase' | 'free' | 'code';
  started: boolean;
  completed_at: string | null;
};

/**
 * GET /my/courses → các khoá cho mục "Tiếp tục khoá học": mọi khoá đã mua / được cấp (kể cả chưa học),
 * và khoá miễn phí đã học ít nhất 1 bài. Server đã xếp theo lần học gần nhất; khoá đã học xong xuống cuối.
 */
export async function apiContinueCourses(token: string): Promise<ContinueCourse[]> {
  const list = (await apiMyCourseList(token)).filter((c) => !c.free || c.started);
  return [...list.filter((c) => !c.done), ...list.filter((c) => c.done)];
}

/** Khoá học của tôi: Đang học (đã mua / được cấp, hoặc miễn phí đã học ≥ 1 bài, chưa xong) · Đã hoàn thành (mới nhất trước). */
export async function apiMyCoursesSplit(token: string): Promise<{ learning: ContinueCourse[]; completed: ContinueCourse[] }> {
  const list = await apiMyCourseList(token);
  return {
    learning: list.filter((c) => !c.done && (!c.free || c.started)),
    completed: list.filter((c) => c.done).sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? '')),
  };
}

/** GET /my/courses → mọi khoá đã ghi danh (server xếp theo lần học gần nhất). */
async function apiMyCourseList(token: string): Promise<ContinueCourse[]> {
  const { data } = await apiRequest<{ data: ApiMyCourseSummary[] }>('GET', '/my/courses', { token });
  return data.map((d) => ({
      id: d.course.id,
      title: d.course.title,
      coverUrl: d.course.cover_url,
      percent: d.progress.percent ?? 0,
      completed: d.progress.completed,
      total: d.progress.total,
      nextLesson: d.next_lesson?.title ?? null,
      needsPath: d.needs_path,
      needsPlacementTest: d.needs_placement_test,
      started: d.started,
      done: d.completed_at !== null || (d.progress.total > 0 && d.progress.completed >= d.progress.total),
      completedAt: d.completed_at,
      free: d.source === 'free',
    }));
}
