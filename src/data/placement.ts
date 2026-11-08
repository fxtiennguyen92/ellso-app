/**
 * Bài kiểm tra đầu vào (nối ellso-server). Có thể có nhiều bài, mỗi bài một nhóm năng lực.
 * - GET  /placement-tests                → danh sách + đã làm chưa + số câu + thời gian ước tính
 * - GET  /placement-tests/{id}           → đề (bộ câu cố định của học viên đến khi nộp)
 * - POST /placement-tests/{id}/attempts  → nộp {answers:[{question_id, option_ids}]} → kết quả
 * - GET  /placement-tests/{id}/result    → kết quả gần nhất (null nếu chưa làm)
 */
import { apiRequest } from '@/lib/api';

export type PlacementTestSummary = {
  id: number;
  title: string;
  intro: string | null;
  completed: boolean;
  lastCompletedAt: string | null;
  questionCount: number;
  /** Thời gian ước tính (phút) — chỉ để hiển thị, không đếm ngược. */
  minutes: number;
};

export type PlacementQuestion = {
  id: number;
  type: 'single' | 'multiple' | 'ordering';
  prompt: string;
  hint: string | null;
  minChoices?: number;
  maxChoices?: number;
  options: { id: number; label: string }[];
};

export type PlacementTestDetail = PlacementTestSummary & { questions: PlacementQuestion[] };

export type PlacementResult = {
  id: number;
  testId: number;
  testTitle: string | null;
  completedAt: string;
  dimensions: {
    id: number;
    name: string;
    description: string | null;
    percent: number | null;
    level: { name: string; description: string | null; rank: number; levelCount: number } | null;
  }[];
  recommendedCourses: { id: number; title: string; shortDescription: string | null; coverUrl: string | null }[];
};

type ApiSummary = {
  id: number;
  title: string;
  intro: string | null;
  completed: boolean;
  last_completed_at: string | null;
  question_count: number;
  minutes: number;
};

const fromSummary = (t: ApiSummary): PlacementTestSummary => ({
  id: t.id,
  title: t.title,
  intro: t.intro,
  completed: t.completed,
  lastCompletedAt: t.last_completed_at,
  questionCount: t.question_count,
  minutes: t.minutes,
});

export async function apiPlacementTests(token: string): Promise<PlacementTestSummary[]> {
  const { data } = await apiRequest<{ data: ApiSummary[] }>('GET', '/placement-tests', { token });
  return data.map(fromSummary);
}

export async function apiPlacementTest(token: string, id: string | number): Promise<PlacementTestDetail> {
  type Q = { id: number; type: PlacementQuestion['type']; prompt: string; hint: string | null; min_choices?: number; max_choices?: number; options: { id: number; label: string }[] };
  const { data } = await apiRequest<{ data: ApiSummary & { questions: Q[] } }>('GET', `/placement-tests/${id}`, { token });
  return {
    ...fromSummary(data),
    questions: data.questions.map((q) => ({
      id: q.id,
      type: q.type,
      prompt: q.prompt,
      hint: q.hint,
      minChoices: q.min_choices,
      maxChoices: q.max_choices,
      options: q.options,
    })),
  };
}

type ApiResult = {
  id: number;
  test_id: number;
  test_title: string | null;
  completed_at: string;
  dimensions: {
    id: number;
    name: string;
    description: string | null;
    percent: number | null;
    level: { name: string; description: string | null; rank: number; level_count: number } | null;
  }[];
  recommended_courses: { id: number; title: string; short_description: string | null; cover_url: string | null }[];
};

const fromResult = (r: ApiResult): PlacementResult => ({
  id: r.id,
  testId: r.test_id,
  testTitle: r.test_title,
  completedAt: r.completed_at,
  dimensions: r.dimensions.map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    percent: d.percent,
    level: d.level ? { name: d.level.name, description: d.level.description, rank: d.level.rank, levelCount: d.level.level_count } : null,
  })),
  recommendedCourses: r.recommended_courses.map((c) => ({ id: c.id, title: c.title, shortDescription: c.short_description, coverUrl: c.cover_url })),
});

export async function apiPlacementResult(token: string, id: string | number): Promise<PlacementResult | null> {
  const { data } = await apiRequest<{ data: ApiResult | null }>('GET', `/placement-tests/${id}/result`, { token });
  return data ? fromResult(data) : null;
}

export async function apiSubmitPlacement(token: string, id: string | number, answers: Record<number, number[]>): Promise<PlacementResult> {
  const body = { answers: Object.entries(answers).map(([qid, ids]) => ({ question_id: Number(qid), option_ids: ids })) };
  const { data } = await apiRequest<{ data: ApiResult }>('POST', `/placement-tests/${id}/attempts`, { token, body });
  return fromResult(data);
}
