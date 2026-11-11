import type { Session } from '@/data/auth';
import { kvGet, kvSet } from '@/lib/secureKv';

/** Lưu phiên đăng nhập (token Sanctum + user) — native: Keychain / Keystore, web: localStorage. */
const KEY = 'ellso.session';

export async function loadSession(): Promise<Session | null> {
  const raw = await kvGet(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export async function saveSession(s: Session | null): Promise<void> {
  await kvSet(KEY, s ? JSON.stringify(s) : null);
}
