import type { Session } from '@/data/auth';

/** Web: expo-secure-store không chạy trên web → dùng localStorage (bọc try/catch vì có thể bị chặn). */
const KEY = 'ellso.session';

export async function loadSession(): Promise<Session | null> {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export async function saveSession(s: Session | null): Promise<void> {
  try {
    if (s) window.localStorage.setItem(KEY, JSON.stringify(s));
    else window.localStorage.removeItem(KEY);
  } catch {
    // bỏ qua
  }
}
