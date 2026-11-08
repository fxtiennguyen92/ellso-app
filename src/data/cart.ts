/**
 * Giỏ hàng (lưu trên ellso-server, đồng bộ mọi máy). Chưa có thanh toán.
 * - GET    /cart                  → {items, count, total}
 * - POST   /cart {type, id}       → thêm (đã có thì giữ nguyên), trả giỏ mới
 * - DELETE /cart/{type}/{id}      → bỏ ra, trả giỏ mới
 * Server tự bỏ khỏi giỏ món không còn mua được (đã có quyền, ngừng bán).
 */
import { apiRequest } from '@/lib/api';
import type { ChapterColor } from '@/theme/tokens';

export type CartItemType = 'course' | 'document';

export type CartItem = {
  type: CartItemType;
  id: number;
  /** course | book | pdf | video */
  kind: string;
  title: string;
  subtitle: string | null;
  /** Màu bìa đã chọn (sách) — khoá học: null */
  cover: ChapterColor | null;
  coverUrl: string | null;
  price: number;
};

export type Cart = { items: CartItem[]; count: number; total: number };

export const emptyCart: Cart = { items: [], count: 0, total: 0 };

type ApiCart = {
  items: { type: CartItemType; id: number; kind: string; title: string; subtitle: string | null; cover: string | null; cover_url: string | null; price: number }[];
  count: number;
  total: number;
};

const fromApi = (c: ApiCart): Cart => ({
  count: c.count,
  total: c.total,
  items: c.items.map((i) => ({
    type: i.type,
    id: i.id,
    kind: i.kind,
    title: i.title,
    subtitle: i.subtitle,
    cover: (i.cover as ChapterColor | null) ?? null,
    coverUrl: i.cover_url,
    price: i.price,
  })),
});

export async function apiCart(token: string): Promise<Cart> {
  const { data } = await apiRequest<{ data: ApiCart }>('GET', '/cart', { token });
  return fromApi(data);
}

export async function apiAddToCart(token: string, type: CartItemType, id: number): Promise<Cart> {
  const { data } = await apiRequest<{ data: ApiCart }>('POST', '/cart', { token, body: { type, id } });
  return fromApi(data);
}

export async function apiRemoveFromCart(token: string, type: CartItemType, id: number): Promise<Cart> {
  const { data } = await apiRequest<{ data: ApiCart }>('DELETE', `/cart/${type}/${id}`, { token });
  return fromApi(data);
}

export const kindLabel = (kind: string) =>
  ({ course: 'Khoá học', book: 'Sách điện tử', pdf: 'Tài liệu PDF', video: 'Video' })[kind] ?? 'Sản phẩm';
