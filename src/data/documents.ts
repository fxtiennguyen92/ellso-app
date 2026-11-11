/**
 * Tài liệu (video · PDF · sách) — nối ellso-server (GET /documents, /documents/topics, /my/courses…).
 *
 * Quy tắc quyền xem (đã chốt 22/10/2026 — canvas "Tài liệu — các trường hợp quyền xem"):
 * - 5 kiểu quyền: miễn phí · gói thành viên · mua riêng · theo bài học · theo khoá học.
 * - Một tài liệu có thể gắn NHIỀU điều kiện; đủ MỘT điều kiện là mở.
 * - Tài liệu gắn bài học: bài đã mở (theo quy tắc mở khoá của lộ trình) là xem được, không cần học xong.
 * - Gói thành viên hết hạn → tài liệu thuộc gói khoá lại ngay, kể cả tài liệu đã lưu.
 * - KHÔNG cho tải về: mọi tài liệu chỉ xem trong app.
 * - Chủ đề (Tư duy, Lãnh đạo…) chỉ dùng để lọc, không hiển thị trên từng tài liệu.
 *
 * Server tính sẵn `unlocked` cho học viên đang đăng nhập; app chỉ hiển thị.
 */
import { apiRequest } from '@/lib/api';
import type { ChapterColor } from '@/theme/tokens';

export type DocType = 'video' | 'pdf' | 'book';

export type Access =
  | { kind: 'free' }
  | { kind: 'plus' }
  | { kind: 'buy'; price: number }
  | { kind: 'lesson'; lesson: string; courseId: string; courseTitle: string }
  | { kind: 'course'; courseId: string; courseTitle: string };

export type Doc = {
  id: string;
  type: DocType;
  title: string;
  author: string;
  topicId: string;
  /** Màu bìa — lấy từ bảng màu chương (chapterPalette). */
  cover: ChapterColor;
  /** Điều kiện mở; đủ 1 là mở. Thứ tự = thứ tự gợi ý trong bảng "Cách mở". */
  access: Access[];
  /** Học viên hiện tại xem được chưa (server tính). */
  unlocked: boolean;
  /** Đã mua riêng (để hiện chip "Đã mua"). */
  bought?: boolean;
  boughtAt?: string;
  saved: boolean;
  /** Video: "10:24" */
  duration?: string;
  publishedAt: string;
  /** Ảnh bìa tải lên trên CMS (không có → bìa màu theo `cover`). */
  coverUrl?: string | null;
};

// ---------------------------------------------------------------- Định dạng từ API (GET /v1/documents…)

type ApiAccess =
  | { kind: 'free' | 'plus' }
  | { kind: 'buy'; price: number }
  | { kind: 'lesson'; lesson: string | null; course_id: number | null; course_title: string | null }
  | { kind: 'course'; course_id: number | null; course_title: string | null };

export type ApiDoc = {
  id: number | string;
  type: DocType;
  title: string;
  author: string | null;
  topic_id: number | null;
  cover: ChapterColor | null;
  cover_url: string | null;
  access: ApiAccess[];
  unlocked: boolean;
  bought: boolean;
  bought_at: string | null;
  saved: boolean;
  duration: string | null;
  published_at: string | null;
};

const COVER_FALLBACK: ChapterColor[] = ['indigo', 'rose', 'graphite', 'sage', 'ochre', 'steel', 'teal', 'terracotta', 'plum'];

export function fromApiDoc(d: ApiDoc): Doc {
  const id = String(d.id);
  return {
    id,
    type: d.type,
    title: d.title,
    author: d.author ?? '',
    topicId: d.topic_id != null ? String(d.topic_id) : '',
    cover: d.cover ?? COVER_FALLBACK[Number(d.id) % COVER_FALLBACK.length] ?? 'sage',
    coverUrl: d.cover_url,
    access: d.access.map((a): Access => {
      switch (a.kind) {
        case 'buy':
          return { kind: 'buy', price: a.price };
        case 'lesson':
          return { kind: 'lesson', lesson: a.lesson ?? 'Bài học', courseId: String(a.course_id ?? ''), courseTitle: a.course_title ?? '' };
        case 'course':
          return { kind: 'course', courseId: String(a.course_id ?? ''), courseTitle: a.course_title ?? '' };
        default:
          return { kind: a.kind };
      }
    }),
    unlocked: d.unlocked,
    bought: d.bought,
    boughtAt: d.bought_at ?? undefined,
    saved: d.saved,
    duration: d.duration ?? undefined,
    publishedAt: d.published_at ?? '',
  };
}

export type Topic = { id: string; name: string };

// ---------------------------------------------------------------- API (ellso-server)

/** GET /documents (mọi loại, mới nhất trước, tối đa 200) — server tính sẵn unlocked / saved / bought cho học viên. */
export async function apiDocuments(token: string): Promise<Doc[]> {
  const { data } = await apiRequest<{ data: ApiDoc[] }>('GET', '/documents', { token });
  return data.map(fromApiDoc);
}

/** Tìm tài liệu (video · PDF · sách) theo tên / tác giả, từng đợt `perPage` — màn Tìm kiếm. */
export async function apiSearchDocuments(token: string, search: string, page: number, perPage: number): Promise<{ items: Doc[]; hasMore: boolean; total: number }> {
  const res = await apiRequest<{ data: ApiDoc[]; meta: { has_more: boolean; total: number } }>(
    'GET',
    `/documents?q=${encodeURIComponent(search)}&page=${page}&per_page=${perPage}`,
    { token },
  );
  return { items: res.data.map(fromApiDoc), hasMore: res.meta.has_more, total: res.meta.total };
}

/** GET /documents/topics — chủ đề để lọc. */
export async function apiDocumentTopics(token: string): Promise<Topic[]> {
  const { data } = await apiRequest<{ data: { id: number; name: string }[] }>('GET', '/documents/topics', { token });
  return data.map((t) => ({ id: String(t.id), name: t.name }));
}

export async function apiSetSaved(token: string, id: string, saved: boolean): Promise<void> {
  await apiRequest(saved ? 'POST' : 'DELETE', `/documents/${id}/save`, { token });
}

export type DocDetail = Doc & { description: string | null; chapters: { start: number; time: string; title: string }[] };

/** GET /documents/{id} — chi tiết (mô tả, mốc thời gian video). */
export async function apiDocument(token: string, id: string): Promise<DocDetail> {
  const { data } = await apiRequest<{ data: ApiDoc & { description: string | null; chapters?: DocDetail['chapters'] } }>('GET', `/documents/${id}`, { token });
  return { ...fromApiDoc(data), description: data.description, chapters: data.chapters ?? [] };
}

/** Video: POST /documents/{id}/play → link HLS (hạn 5 phút). */
export async function apiPlayDocument(token: string, id: string): Promise<{ url: string }> {
  const { data } = await apiRequest<{ data: { url: string } }>('POST', `/documents/${id}/play`, { token });
  return data;
}

/** PDF / sách: POST /documents/{id}/open → trang đọc của server (pdf.js / epub.js), hạn 5 phút. */
export async function apiOpenDocument(token: string, id: string): Promise<{ readerUrl: string | null; url: string }> {
  const { data } = await apiRequest<{ data: { url: string; reader_url: string | null } }>('POST', `/documents/${id}/open`, { token });
  return { readerUrl: data.reader_url, url: data.url };
}

/** Id các khoá học viên đang có (để nhóm "Từ khoá học của bạn" ở Tài liệu của tôi). */
export async function apiMyCourseIds(token: string): Promise<Set<string>> {
  const { data } = await apiRequest<{ data: { course: { id: number } }[] }>('GET', '/my/courses', { token });
  return new Set(data.map((d) => String(d.course.id)));
}

// ---------------------------------------------------------------- tiện ích

export const typeLabel: Record<DocType, { title: string; unit: string }> = {
  video: { title: 'Video', unit: 'video' },
  pdf: { title: 'File PDF', unit: 'file PDF' },
  book: { title: 'Sách', unit: 'cuốn sách' },
};

/** So khớp không dấu: "tu duy" khớp "Tư duy". */
export const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();

export const matchQuery = (d: Doc, q: string) => {
  const n = normalize(q);
  return !n || normalize(d.title).includes(n) || normalize(d.author).includes(n);
};

export type SortKey = 'newest' | 'oldest' | 'az';
export const sortLabels: Record<SortKey, string> = { newest: 'Mới nhất', oldest: 'Cũ nhất', az: 'Tên A–Z' };

export function sortDocs(list: Doc[], key: SortKey) {
  const out = [...list];
  if (key === 'newest') out.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  if (key === 'oldest') out.sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));
  if (key === 'az') out.sort((a, b) => normalize(a.title).localeCompare(normalize(b.title)));
  return out;
}