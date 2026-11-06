/**
 * Tài khoản của học viên đang đăng nhập (app › Hồ sơ) — ellso-server ProfileController:
 * - PATCH  /me           {name, phone}                → {data: user}
 * - POST   /me/avatar    multipart "avatar"          → {data: user}
 * - DELETE /me/avatar                                → {data: user}
 * - POST   /me/password  {current_password, password, password_confirmation}
 *   Đổi xong server đăng xuất mọi thiết bị khác, máy này giữ đăng nhập.
 */
import { Platform } from 'react-native';

import { type AuthUser, type ServerUser, toUser } from '@/data/auth';
import { apiRequest } from '@/lib/api';

export async function apiUpdateProfile(token: string, input: { name: string; phone: string }): Promise<AuthUser> {
  const r = await apiRequest<{ data: ServerUser }>('PATCH', '/me', { token, body: { name: input.name, phone: input.phone } });
  return toUser(r.data);
}

/** Gửi ảnh đã cắt vuông / thu nhỏ (JPEG). Web: uri là blob/data URL → đổi sang Blob; native: {uri, name, type}. */
export async function apiUploadAvatar(token: string, uri: string): Promise<AuthUser> {
  const form = new FormData();
  if (Platform.OS === 'web') {
    const blob = await (await fetch(uri)).blob();
    form.append('avatar', blob, 'avatar.jpg');
  } else {
    form.append('avatar', { uri, name: 'avatar.jpg', type: 'image/jpeg' } as unknown as Blob);
  }
  const r = await apiRequest<{ data: ServerUser }>('POST', '/me/avatar', { token, body: form });
  return toUser(r.data);
}

export async function apiDeleteAvatar(token: string): Promise<AuthUser> {
  const r = await apiRequest<{ data: ServerUser }>('DELETE', '/me/avatar', { token });
  return toUser(r.data);
}

export async function apiUpdatePassword(token: string, current: string, password: string): Promise<void> {
  await apiRequest('POST', '/me/password', {
    token,
    body: { current_password: current, password, password_confirmation: password },
  });
}

/** SĐT Việt Nam (khớp server): bỏ khoảng trắng / dấu chấm / gạch, +84 → 0; hợp lệ = 10 số bắt đầu bằng 0. */
export function normalizePhone(raw: string): string {
  const p = raw.replace(/[\s.\-()]/g, '');
  const m = /^\+?84(\d{9})$/.exec(p);
  return m ? `0${m[1]}` : p;
}
export const isValidPhone = (raw: string) => raw.trim() === '' || /^0\d{9}$/.test(normalizePhone(raw));
