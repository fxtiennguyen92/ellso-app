/**
 * Sách: trang thông tin + đọc thử / đọc cả cuốn (nối ellso-server).
 * - GET  /documents/{id}          → item tài liệu + description, topic, file {format, size, length}
 * - GET  /documents?type=book     → danh sách sách (mục "Sách khác")
 * - POST /documents/{id}/preview  → {reader_url, format, pages|chapters} — ai đăng nhập cũng đọc thử được
 * - POST /documents/{id}/open     → {reader_url, …} — chỉ khi đã mở khoá (403 locked)
 * reader_url = trang /v1/reader trên server (pdf.js / epub.js), mở trong WebView (máy) hoặc iframe (web).
 */
import { type ApiDoc, type Doc, fromApiDoc } from '@/data/documents';
import { apiRequest } from '@/lib/api';

export type BookDetail = Doc & {
  description: string | null;
  topic: string | null;
  teacher: { id: number; name: string; avatar: string | null } | null;
  format: 'pdf' | 'epub' | null;
  size: number | null;
  /** Số trang (PDF) / số chương (EPUB) cả cuốn. */
  length: number | null;
  preview: { available: boolean; count: number | null };
};

type ApiBook = ApiDoc & {
  description?: string | null;
  topic?: string | null;
  teacher?: { id: number; name: string; avatar: string | null } | null;
  file?: { format: string | null; size: number | null; length?: number | null } | null;
  preview?: { available: boolean; pages?: number | null; chapters?: number | null } | null;
};

export async function apiBook(token: string, id: string): Promise<BookDetail> {
  const { data } = await apiRequest<{ data: ApiBook }>('GET', `/documents/${id}`, { token });
  const fmt = data.file?.format === 'epub' ? 'epub' : data.file?.format === 'pdf' ? 'pdf' : null;
  return {
    ...fromApiDoc(data),
    description: data.description ?? null,
    topic: data.topic ?? null,
    teacher: data.teacher ?? null,
    format: fmt,
    size: data.file?.size ?? null,
    length: data.file?.length ?? null,
    preview: { available: !!data.preview?.available, count: data.preview?.pages ?? data.preview?.chapters ?? null },
  };
}

export async function apiBooks(token: string): Promise<Doc[]> {
  const { data } = await apiRequest<{ data: ApiDoc[] }>('GET', '/documents?type=book', { token });
  return data.map(fromApiDoc);
}

export type ReaderMode = 'preview' | 'full';

/** Link trang đọc (hạn file ~5 phút: lấy ngay trước khi mở). */
export async function apiReaderUrl(token: string, id: string, mode: ReaderMode): Promise<string> {
  const { data } = await apiRequest<{ data: { reader_url: string } }>('POST', `/documents/${id}/${mode === 'full' ? 'open' : 'preview'}`, { token });
  return data.reader_url;
}

export const unitLabel = (format: BookDetail['format']) => (format === 'epub' ? 'chương' : 'trang');

/** 1_234_567 → "1,2 MB" */
export const fileSize = (bytes: number | null) => {
  if (!bytes) return null;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
};
