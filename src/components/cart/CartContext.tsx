import { router } from 'expo-router';
import { createContext, type RefObject, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View, type ViewInstance } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { apiAddToCart, apiCart, apiRemoveFromCart, type Cart, type CartItemType, emptyCart } from '@/data/cart';
import { ApiError } from '@/lib/api';

import { CartFlyLayer, type FlyPoint } from './CartFly';

type Ctx = {
  cart: Cart;
  loading: boolean;
  /** Món (type, id) đang có trong giỏ không. */
  has: (type: CartItemType, id: number) => boolean;
  /**
   * Thêm vào giỏ. open = "Mua ngay": thêm xong chuyển sang tab Giỏ hàng.
   * Trả thông báo lỗi (tiếng Việt) nếu không thêm được, null nếu thành công.
   */
  add: (type: CartItemType, id: number, opts?: { open?: boolean; from?: FlyPoint | null }) => Promise<string | null>;
  remove: (type: CartItemType, id: number) => Promise<string | null>;
  refresh: () => Promise<void>;
  /** BottomBar gắn vào icon Giỏ hàng — đích của chấm xanh bay vào giỏ. */
  anchorRef: RefObject<ViewInstance | null>;
  /** Tăng mỗi lần chấm xanh rơi trúng giỏ → BottomBar cho icon "hứng" (nảy + lắc nhẹ). */
  landTick: number;
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
  const anchorRef = useRef<ViewInstance | null>(null);
  const [landTick, setLandTick] = useState(0);
  const [flights, setFlights] = useState<{ id: number; from: FlyPoint | null }[]>([]);
  const flightId = useRef(0);

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
    async (type: CartItemType, id: number, opts?: { open?: boolean; from?: FlyPoint | null }) => {
      if (!token) return 'Bạn cần đăng nhập.';
      try {
        setCart(await apiAddToCart(token, type, id));
        // Chấm xanh bay từ chỗ bấm vào tab Giỏ hàng (mọi nút thêm vào giỏ)
        setFlights((f) => [...f, { id: ++flightId.current, from: opts?.from ?? null }]);
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
        return { ...c, items, count: items.length, total: items.reduce((s, i) => s + i.price, 0) };
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

  const onFlightDone = useCallback((fid: number, landed: boolean) => {
    setFlights((f) => f.filter((x) => x.id !== fid));
    if (landed) setLandTick((n) => n + 1);
  }, []);

  const value = useMemo(
    () => ({ cart, loading, has, add, remove, refresh, anchorRef, landTick }),
    [cart, loading, has, add, remove, refresh, landTick],
  );
  return (
    <CartContext.Provider value={value}>
      <View style={styles.fill}>
        {children}
        <CartFlyLayer flights={flights} anchorRef={anchorRef} onDone={onFlightDone} />
      </View>
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart phải nằm trong <CartProvider>');
  return ctx;
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
