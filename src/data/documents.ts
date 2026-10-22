/**
 * DỮ LIỆU TẠM cho module Tài liệu — chưa nối CMS.
 *
 * Quy tắc quyền xem (đã chốt 22/10/2026 — canvas "Tài liệu — các trường hợp quyền xem"):
 * - 5 kiểu quyền: miễn phí · gói thành viên · mua riêng · theo bài học · theo khoá học.
 * - Một tài liệu có thể gắn NHIỀU điều kiện; đủ MỘT điều kiện là mở.
 * - Tài liệu gắn bài học: bài đã mở (theo quy tắc mở khoá của lộ trình) là xem được, không cần học xong.
 * - Gói thành viên hết hạn → tài liệu thuộc gói khoá lại ngay, kể cả tài liệu đã lưu.
 * - KHÔNG cho tải về: mọi tài liệu chỉ xem trong app.
 * - Chủ đề (Tư duy, Lãnh đạo…) chỉ dùng để lọc, không hiển thị trên từng tài liệu.
 *
 * Khi nối API: server tính sẵn `unlocked` cho học viên đang đăng nhập; app chỉ hiển thị.
 */
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
};

export type Topic = { id: string; name: string };

export const topics: Topic[] = [
  { id: 'tu-duy', name: 'Tư duy' },
  { id: 'lanh-dao', name: 'Lãnh đạo' },
  { id: 'giao-tiep', name: 'Giao tiếp' },
  { id: 'cong-nghe', name: 'Công nghệ & AI' },
  { id: 'nang-suat', name: 'Năng suất' },
];

const TDPB = { courseId: 'tu-duy-phan-bien', courseTitle: 'Tư duy phản biện' };
const WEB = { courseId: 'tao-web-bang-ai', courseTitle: 'Tạo Web bằng AI' };
const GTTP = { courseId: 'giao-tiep-thuyet-phuc', courseTitle: 'Giao tiếp thuyết phục' };

const docs: Doc[] = [
  // ---------- Video
  { id: 'v1', type: 'video', title: 'Tư duy phản biện trong 10 phút', author: 'Phạm Quốc Bảo', topicId: 'tu-duy', cover: 'teal', access: [{ kind: 'free' }], unlocked: true, saved: true, duration: '10:24', publishedAt: '2026-10-20' },
  { id: 'v2', type: 'video', title: 'Phỏng vấn: Lãnh đạo trong thời AI', author: 'Đỗ Minh Quân', topicId: 'lanh-dao', cover: 'plum', access: [{ kind: 'plus' }], unlocked: false, saved: true, duration: '32:10', publishedAt: '2026-10-18' },
  { id: 'v3', type: 'video', title: 'Masterclass: Thuyết trình không run', author: 'Trần Hải Yến', topicId: 'giao-tiep', cover: 'terracotta', access: [{ kind: 'buy', price: 249_000 }, { kind: 'plus' }], unlocked: false, saved: false, duration: '1:12:05', publishedAt: '2026-10-15' },
  { id: 'v4', type: 'video', title: 'Demo: dựng landing page với AI', author: 'Nguyễn Thu Hà', topicId: 'cong-nghe', cover: 'steel', access: [{ kind: 'course', ...WEB }], unlocked: true, saved: true, duration: '24:30', publishedAt: '2026-10-12' },
  { id: 'v5', type: 'video', title: 'Giải mã nguỵ biện qua phim', author: 'Phạm Quốc Bảo', topicId: 'tu-duy', cover: 'sage', access: [{ kind: 'lesson', lesson: 'Bài 8', ...TDPB }], unlocked: true, saved: false, duration: '18:05', publishedAt: '2026-10-10' },
  { id: 'v6', type: 'video', title: 'Kỹ năng phản hồi 1-1', author: 'Trần Hải Yến', topicId: 'giao-tiep', cover: 'rose', access: [{ kind: 'buy', price: 199_000 }], unlocked: true, bought: true, boughtAt: '2026-10-02', saved: false, duration: '45:12', publishedAt: '2026-10-01' },
  { id: 'v7', type: 'video', title: 'Ra quyết định khi thiếu dữ liệu', author: 'Phạm Quốc Bảo', topicId: 'tu-duy', cover: 'indigo', access: [{ kind: 'lesson', lesson: 'Bài 14', ...TDPB }], unlocked: false, saved: false, duration: '21:40', publishedAt: '2026-09-28' },
  { id: 'v8', type: 'video', title: 'Họp hiệu quả trong 30 phút', author: 'Đỗ Minh Quân', topicId: 'nang-suat', cover: 'ochre', access: [{ kind: 'plus' }], unlocked: false, saved: false, duration: '15:02', publishedAt: '2026-09-25' },
  { id: 'v9', type: 'video', title: 'Prompt nâng cao cho giao diện', author: 'Nguyễn Thu Hà', topicId: 'cong-nghe', cover: 'graphite', access: [{ kind: 'course', ...WEB }], unlocked: true, saved: false, duration: '19:45', publishedAt: '2026-09-20' },

  // ---------- PDF
  { id: 'p1', type: 'pdf', title: 'Checklist 12 câu hỏi phản biện', author: 'Phạm Quốc Bảo', topicId: 'tu-duy', cover: 'terracotta', access: [{ kind: 'free' }], unlocked: true, saved: true, publishedAt: '2026-10-19' },
  { id: 'p2', type: 'pdf', title: 'Mẫu kế hoạch 1-1 với nhân viên', author: 'Đỗ Minh Quân', topicId: 'lanh-dao', cover: 'terracotta', access: [{ kind: 'plus' }], unlocked: false, saved: false, publishedAt: '2026-10-17' },
  { id: 'p3', type: 'pdf', title: 'Bảng ma trận quyết định', author: 'Phạm Quốc Bảo', topicId: 'tu-duy', cover: 'terracotta', access: [{ kind: 'lesson', lesson: 'Bài 13', ...TDPB }, { kind: 'plus' }], unlocked: false, saved: false, publishedAt: '2026-10-14' },
  { id: 'p4', type: 'pdf', title: 'Bộ template OKR cho đội nhóm', author: 'Lê Thanh Tùng', topicId: 'nang-suat', cover: 'terracotta', access: [{ kind: 'buy', price: 99_000 }], unlocked: true, bought: true, boughtAt: '2026-09-30', saved: true, publishedAt: '2026-10-11' },
  { id: 'p5', type: 'pdf', title: 'Kịch bản cho những cuộc trò chuyện khó', author: 'Trần Hải Yến', topicId: 'giao-tiep', cover: 'terracotta', access: [{ kind: 'course', ...GTTP }], unlocked: false, saved: false, publishedAt: '2026-10-08' },
  { id: 'p6', type: 'pdf', title: 'Prompt mẫu để dựng giao diện', author: 'Nguyễn Thu Hà', topicId: 'cong-nghe', cover: 'terracotta', access: [{ kind: 'course', ...WEB }], unlocked: true, saved: false, publishedAt: '2026-10-05' },
  { id: 'p7', type: 'pdf', title: 'Sổ tay tổ chức họp nhóm', author: 'Đỗ Minh Quân', topicId: 'nang-suat', cover: 'terracotta', access: [{ kind: 'buy', price: 79_000 }], unlocked: false, saved: false, publishedAt: '2026-10-01' },
  { id: 'p8', type: 'pdf', title: 'Phiếu tự đánh giá thiên kiến', author: 'Phạm Quốc Bảo', topicId: 'tu-duy', cover: 'terracotta', access: [{ kind: 'lesson', lesson: 'Bài 2', ...TDPB }], unlocked: true, saved: false, publishedAt: '2026-09-27' },

  // ---------- Sách
  { id: 'b1', type: 'book', title: 'Nghệ thuật đặt câu hỏi', author: '[Tác giả]', topicId: 'tu-duy', cover: 'indigo', access: [{ kind: 'free' }], unlocked: true, saved: false, publishedAt: '2026-10-20' },
  { id: 'b2', type: 'book', title: 'Lãnh đạo bằng lắng nghe', author: '[Tác giả]', topicId: 'lanh-dao', cover: 'rose', access: [{ kind: 'plus' }], unlocked: false, saved: true, publishedAt: '2026-10-18' },
  { id: 'b3', type: 'book', title: 'Người dẫn dắt điềm tĩnh', author: '[Tác giả]', topicId: 'lanh-dao', cover: 'graphite', access: [{ kind: 'buy', price: 189_000 }], unlocked: false, saved: false, publishedAt: '2026-10-16' },
  { id: 'b4', type: 'book', title: 'Sổ tay phản biện', author: '[Tác giả]', topicId: 'tu-duy', cover: 'sage', access: [{ kind: 'lesson', lesson: 'Bài 6', ...TDPB }], unlocked: true, saved: false, publishedAt: '2026-10-14' },
  { id: 'b5', type: 'book', title: 'AI cho người làm marketing', author: '[Tác giả]', topicId: 'cong-nghe', cover: 'ochre', access: [{ kind: 'course', ...WEB }], unlocked: true, saved: false, publishedAt: '2026-10-12' },
  { id: 'b6', type: 'book', title: 'Đàm phán không đối đầu', author: '[Tác giả]', topicId: 'giao-tiep', cover: 'steel', access: [{ kind: 'buy', price: 159_000 }], unlocked: true, bought: true, boughtAt: '2026-09-21', saved: true, publishedAt: '2026-10-10' },
  { id: 'b7', type: 'book', title: 'Thói quen của nhóm hiệu suất cao', author: '[Tác giả]', topicId: 'nang-suat', cover: 'teal', access: [{ kind: 'plus' }], unlocked: false, saved: false, publishedAt: '2026-10-08' },
  { id: 'b8', type: 'book', title: 'Viết để thuyết phục', author: '[Tác giả]', topicId: 'giao-tiep', cover: 'terracotta', access: [{ kind: 'free' }], unlocked: true, saved: false, publishedAt: '2026-10-06' },
  { id: 'b9', type: 'book', title: 'Tư duy hệ thống cho người mới', author: '[Tác giả]', topicId: 'tu-duy', cover: 'plum', access: [{ kind: 'buy', price: 159_000 }], unlocked: false, saved: false, publishedAt: '2026-10-04' },
  { id: 'b10', type: 'book', title: 'Quản lý năng lượng, không phải thời gian', author: '[Tác giả]', topicId: 'nang-suat', cover: 'indigo', access: [{ kind: 'plus' }], unlocked: false, saved: false, publishedAt: '2026-09-30' },
  { id: 'b11', type: 'book', title: 'Kể chuyện bằng dữ liệu', author: '[Tác giả]', topicId: 'cong-nghe', cover: 'sage', access: [{ kind: 'free' }], unlocked: true, saved: false, publishedAt: '2026-09-26' },
  { id: 'b12', type: 'book', title: 'Phản hồi thẳng thắn', author: '[Tác giả]', topicId: 'lanh-dao', cover: 'rose', access: [{ kind: 'buy', price: 129_000 }], unlocked: false, saved: false, publishedAt: '2026-09-22' },
];

/** Tài liệu đang xem dở (Đang xem). */
const watching = { docId: 'v1', progress: 60, remaining: 'Còn 4 phút' };

// ---------------------------------------------------------------- API giả lập

export function getAllDocs(): Doc[] {
  return docs;
}

export function getWatching() {
  return watching;
}

/** Giả lập gọi API lưu / bỏ lưu (thỉnh thoảng lỗi để thử hoàn tác). */
export async function apiSetSaved(_id: string, _saved: boolean): Promise<void> {
  await new Promise((r) => setTimeout(r, 300));
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