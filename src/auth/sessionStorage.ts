import * as SecureStore from 'expo-secure-store';

import type { Session } from '@/data/auth';

/** Lưu phiên đăng nhập (token) — native: Keychain / Keystore qua expo-secure-store. Web: xem sessionStorage.web.ts. */
const KEY = 'ellso.session';

export async function loadSession(): Promise<Session | null> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export async function saveSession(s: Session | null): Promise<void> {
  try {
    if (s) await SecureStore.setItemAsync(KEY, JSON.stringify(s));
    else await SecureStore.deleteItemAsync(KEY);
  } catch {
    // bỏ qua: lần mở app sau sẽ phải đăng nhập lại
  }
}
