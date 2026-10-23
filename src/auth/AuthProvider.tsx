import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { apiChangePassword, apiLogin, apiLogout, type AuthUser, type Session } from '@/data/auth';

import { loadSession, saveSession } from './sessionStorage';

/**
 * Trạng thái đăng nhập:
 * - loading            : đang đọc phiên đã lưu (splash vẫn hiện)
 * - signedOut          : chưa đăng nhập → nhóm (auth)
 * - mustChangePassword : đăng nhập bằng mật khẩu tạm → chỉ vào được /set-password
 * - signedIn           : vào app (tabs)
 * Root layout dùng Stack.Protected theo `status`, nên chỉ cần đổi status là router tự chuyển màn.
 */
export type AuthStatus = 'loading' | 'signedOut' | 'mustChangePassword' | 'signedIn';

type Ctx = {
  status: AuthStatus;
  user: AuthUser | null;
  /** Mật khẩu tạm vừa dùng để đăng nhập (chỉ giữ trong RAM) — để kiểm tra quy tắc "khác mật khẩu tạm". */
  tempPassword: string | null;
  login: (email: string, password: string) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<Ctx | null>(null);

const statusOf = (s: Session | null): AuthStatus => (!s ? 'signedOut' : s.mustChangePassword ? 'mustChangePassword' : 'signedIn');

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const sessionRef = useRef<Session | null>(null);
  sessionRef.current = session;

  useEffect(() => {
    loadSession()
      .then(setSession)
      .finally(() => setLoaded(true));
  }, []);

  const apply = useCallback((s: Session | null) => {
    setSession(s);
    saveSession(s);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const s = await apiLogin(email, password);
      setTempPassword(s.mustChangePassword ? password : null);
      apply(s);
    },
    [apply],
  );

  const changePassword = useCallback(
    async (newPassword: string) => {
      if (!sessionRef.current) return;
      const s = await apiChangePassword(sessionRef.current, newPassword);
      setTempPassword(null);
      apply(s);
    },
    [apply],
  );

  const logout = useCallback(async () => {
    const s = sessionRef.current;
    setTempPassword(null);
    apply(null);
    apiLogout(s).catch(() => {});
  }, [apply]);

  const value = useMemo<Ctx>(
    () => ({ status: loaded ? statusOf(session) : 'loading', user: session?.user ?? null, tempPassword, login, changePassword, logout }),
    [loaded, session, tempPassword, login, changePassword, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải nằm trong <AuthProvider>');
  return ctx;
}
