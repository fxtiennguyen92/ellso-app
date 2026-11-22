import type { LessonBlock } from '@/data/lesson';
import { apiRequest } from '@/lib/api';

export type LegalSlug = 'terms' | 'privacy';

export type LegalPage = { slug: LegalSlug; title: string; version: string; effectiveOn: string; blocks: LessonBlock[] };

/** GET /v1/legal/{terms|privacy} — công khai (màn Đăng ký dùng khi chưa đăng nhập). Nội dung sửa ở CMS › Hệ thống › Điều khoản & bảo mật. */
export async function loadLegal(slug: LegalSlug): Promise<LegalPage> {
  const { data } = await apiRequest<{ data: { slug: LegalSlug; title: string; version: string; effective_on: string; blocks: LessonBlock[] } }>(
    'GET',
    `/legal/${slug}`,
  );
  return { slug: data.slug, title: data.title, version: data.version, effectiveOn: data.effective_on, blocks: data.blocks };
}

export const LEGAL_TITLES: Record<LegalSlug, string> = { terms: 'Điều khoản sử dụng', privacy: 'Chính sách bảo mật' };
