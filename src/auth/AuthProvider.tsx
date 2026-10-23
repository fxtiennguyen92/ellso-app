import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { apiChangePassword, apiLogin, apiLogout, apiMe, AuthError, type AuthUser, type Session } from '@/data/auth';
import { ApiError } from '@/lib/api';

import { loadSession, saveSession } from './sessionStorage';

/**
 * Trạng thái đăng nhập:
 * - loading            : đang đọc phiên đã lưu (splash vẫn hiện)
 * - signedOut          : chưa đăng nhập → login / register / forgot…
 * - mustChangePassword : đăng nhập bằng mật khẩu tạm (đang giữ change_token) → chỉ vào được /set-password
 * - signedIn           : vào app (tabs)
 * Root layout dùng Stack.Protected theo `status`, nên chỉ cần đổi status là router tự chuyển màn.
 */
export type AuthStatus = 'loading' | 'signedOut' | 'mustChangePassword' | 'signedIn';

type Ctx = {
  status: AuthStatus;
  user: AuthUser | null;
  /** Token Sanctum đầy đủ để gọi các API cần đăng nhập (null khi chưa vào app). */
  token: string | null;
  /** Mật khẩu tạm vừa dùng để đăng nhập (chỉ giữ trong RAM) — để kiểm tra quy tắc "khác mật khẩu tạm". */
  tempPassword: string | null;
  /** Thông báo cho màn đăng nhập (vd phiên đặt mật khẩu hết hạn). Đọc xong gọi clearNotice. */
  notice: string | null;
  clearNotice: () => void;
  login: (email: string, password: string) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<Ctx | null>(null);

const statusOf = (s: Session | null): AuthStatus => (!s ? 'signedOut' : s.mustChangePassword ? 'mustChangePassword' : 'signedIn');
const EXPIRED = 'Phiên đặt mật khẩu đã hết hạn. Vui lòng đăng nhập lại bằng mật khẩu tạm.';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const sessionRef = useRef<Session | null>(null);
  sessionRef.current = session;

  const apply = useCallback((s: Session | null) => {
    setSession(s);
    saveSession(s);
  }, []);

  // Mở app: đọc phiên đã lưu. change_token hết hạn → về đăng nhập. Token đầy đủ → làm mới user qua /me (401 = token bị thu hồi).
  useEffect(() => {
    loadSession()
      .then((s) => {
        if (s?.mustChangePassword && (!s.expiresAt || s.expiresAt < Date.now())) {
          setNotice(EXPIRED);
          apply(null);
          return;
        }
        setSession(s);
        if (s && !s.mustChangePassword) {
          apiMe(s.token)
            .then((user) => sessionRef.current?.token === s.token && apply({ ...s, user }))
            .catch((e) => {
              if (e instanceof ApiError && e.status === 401 && sessionRef.current?.token === s.token) apply(null);
              // lỗi mạng: giữ phiên, dùng thông tin đã lưu
            });
        }
      })
      .finally(() => setLoaded(true));
  }, [apply]);

  const login = useCallback(
    async (email: string, password: string) => {
      const s = await apiLogin(email, password);
      setTempPassword(s.mustChangePassword ? password : null);
      setNotice(null);
      apply(s);
    },
    [apply],
  );

  const changePassword = useCallback(
    async (newPassword: string) => {
      const current = sessionRef.current;
      if (!current) return;
      try {
        const s = await apiChangePassword(current, newPassword);
        setTempPassword(null);
        apply(s);
      } catch (e) {
        if (e instanceof AuthError && e.field === 'session') {
          // change_token hết hạn / bị thu hồi → về màn đăng nhập kèm thông báo
          setTempPassword(null);
          setNotice(e.message);
          apply(null);
        }
        throw e;
      }
    },
    [apply],
  );

  const logout = useCallback(async () => {
    const s = sessionRef.current;
    setTempPassword(null);
    apply(null);
    apiLogout(s).catch(() => {});
  }, [apply]);

  const clearNotice = useCallback(() => setNotice(null), []);

  const value = useMemo<Ctx>(
    () => ({
      status: loaded ? statusOf(session) : 'loading',
      user: session?.user ?? null,
      token: session && !session.mustChangePassword ? session.token : null,
      tempPassword,
      notice,
      clearNotice,
      login,
      changePassword,
      logout,
    }),
    [loaded, session, tempPassword, notice, clearNotice, login, changePassword, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải nằm trong <AuthProvider>');
  return ctx;
}
