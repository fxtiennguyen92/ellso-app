import { router } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useAuth } from '@/auth/AuthProvider';
import { apiAddToCart, apiCart, apiRemoveFromCart, type Cart, type CartItemType, emptyCart } from '@/data/cart';
import { ApiError } from '@/lib/api';

type Ctx = {
  cart: Cart;
  loading: boolean;
  /** Món (type, id) đang có trong giỏ không. */
  has: (type: CartItemType, id: number) => boolean;
  /**
   * Thêm vào giỏ. open = "Mua ngay": thêm xong chuyển sang tab Giỏ hàng.
   * Trả thông báo lỗi (tiếng Việt) nếu không thêm được, null nếu thành công.
   */
  add: (type: CartItemType, id: number, opts?: { open?: boolean }) => Promise<string | null>;
  remove: (type: CartItemType, id: number) => Promise<string | null>;
  refresh: () => Promise<void>;
};

const CartContext = createContext<Ctx | null>(null);

/**
 * Giỏ hàng dùng chung toàn app (bọc ở root layout): tab Giỏ hàng chỉ hiện khi giỏ có món (BottomBar đọc `cart.count`),
 * trang sách / thẻ khoá học / bảng cách mở tài liệu gọi `add`.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const { token, status } = useAuth();
  const [cart, setCart] = useState<Cart>(emptyCart);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      setCart(await apiCart(token));
    } catch {
      // giữ giỏ cũ khi mất mạng
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (status === 'signedIn') refresh();
    else setCart(emptyCart);
  }, [status, refresh]);

  const has = useCallback((type: CartItemType, id: number) => cart.items.some((i) => i.type === type && i.id === id), [cart]);

  const add = useCallback(
    async (type: CartItemType, id: number, opts?: { open?: boolean }) => {
      if (!token) return 'Bạn cần đăng nhập.';
      try {
        setCart(await apiAddToCart(token, type, id));
        if (opts?.open) router.navigate('/cart');
        return null;
      } catch (e) {
        return e instanceof ApiError ? e.message : 'Không thêm được vào giỏ, thử lại sau.';
      }
    },
    [token],
  );

  const remove = useCallback(
    async (type: CartItemType, id: number) => {
      if (!token) return null;
      const before = cart;
      // Bỏ ngay trên máy cho mượt, lỗi thì trả lại
      setCart((c) => {
        const items = c.items.filter((i) => !(i.type === type && i.id === id));
        return { items, count: items.length, total: items.reduce((s, i) => s + i.price, 0) };
      });
      try {
        setCart(await apiRemoveFromCart(token, type, id));
        return null;
      } catch (e) {
        setCart(before);
        return e instanceof ApiError ? e.message : 'Không bỏ được, thử lại sau.';
      }
    },
    [token, cart],
  );

  const value = useMemo(() => ({ cart, loading, has, add, remove, refresh }), [cart, loading, has, add, remove, refresh]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart phải nằm trong <CartProvider>');
  return ctx;
}
