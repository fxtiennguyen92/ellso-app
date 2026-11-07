/**
 * Tài khoản của học viên đang đăng nhập (app › Hồ sơ) — ellso-server ProfileController:
 * - PATCH  /me           {name, phone}                → {data: user}
 * - POST   /me/avatar    multipart "avatar"          → {data: user}
 * - DELETE /me/avatar                                → {data: user}
 * - POST   /me/password  {current_password, password, password_confirmation}
 *   Đổi xong server đăng xuất mọi thiết bị khác, máy này giữ đăng nhập.
 * - GET    /me/referrer/preview?code=                → {data: {name, email, referral_code}}
 * - POST   /me/referrer  {code}                       → {data: user} — chỉ một lần, không đổi được
 * - GET    /me/devices                                → {data: Device[]} (máy đang dùng đứng đầu)
 * - DELETE /me/devices/{id}                           → đăng xuất tài khoản trên máy đó (không xoá được máy đang dùng)
 * - GET    /me/coins?cursor=                          → {balance, data: CoinTx[], next_cursor} (mới nhất trước, 20 / trang)
 * - GET    /me/referrals?cursor=                      → {total, data: Friend[], next_cursor}
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

export type ReferrerPreview = { name: string; email: string; code: string };

/** Xem trước người giới thiệu theo mã (lỗi 422 → ApiError.field('code')). */
export async function apiPreviewReferrer(token: string, code: string): Promise<ReferrerPreview> {
  const r = await apiRequest<{ data: { name: string; email: string; referral_code: string } }>(
    'GET',
    `/me/referrer/preview?code=${encodeURIComponent(code.trim().toUpperCase())}`,
    { token },
  );
  return { name: r.data.name, email: r.data.email, code: r.data.referral_code };
}

export async function apiSetReferrer(token: string, code: string): Promise<AuthUser> {
  const r = await apiRequest<{ data: ServerUser }>('POST', '/me/referrer', { token, body: { code: code.trim().toUpperCase() } });
  return toUser(r.data);
}

export type Device = {
  id: number;
  name: string;
  platform: 'ios' | 'android' | 'web' | null;
  osVersion: string | null;
  appVersion: string | null;
  lastUsedAt: string | null;
  current: boolean;
};

type ServerDevice = {
  id: number;
  name: string;
  platform: Device['platform'];
  os_version: string | null;
  app_version: string | null;
  last_used_at: string | null;
  current: boolean;
};

export async function apiListDevices(token: string): Promise<Device[]> {
  const r = await apiRequest<{ data: ServerDevice[] }>('GET', '/me/devices', { token });
  return r.data.map((d) => ({
    id: d.id,
    name: d.name,
    platform: d.platform,
    osVersion: d.os_version,
    appVersion: d.app_version,
    lastUsedAt: d.last_used_at,
    current: d.current,
  }));
}

export async function apiRevokeDevice(token: string, id: number): Promise<void> {
  await apiRequest('DELETE', `/me/devices/${id}`, { token });
}

export type CoinTx = { id: number; amount: number; balanceAfter: number; source: string; sourceLabel: string; description: string; createdAt: string };
export type Friend = { id: number; name: string; avatar: string | null; joinedAt: string | null };
export type Page<T> = { items: T[]; nextCursor: string | null };

export async function apiCoinHistory(token: string, cursor?: string | null): Promise<Page<CoinTx> & { balance: number }> {
  const q = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  const r = await apiRequest<{
    balance: number;
    next_cursor: string | null;
    data: { id: number; amount: number; balance_after: number; source: string; source_label: string; description: string; created_at: string }[];
  }>('GET', `/me/coins${q}`, { token });
  return {
    balance: r.balance,
    nextCursor: r.next_cursor,
    items: r.data.map((t) => ({
      id: t.id,
      amount: t.amount,
      balanceAfter: t.balance_after,
      source: t.source,
      sourceLabel: t.source_label,
      description: t.description,
      createdAt: t.created_at,
    })),
  };
}

export async function apiReferrals(token: string, cursor?: string | null): Promise<Page<Friend> & { total: number }> {
  const q = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  const r = await apiRequest<{ total: number; next_cursor: string | null; data: { id: number; name: string; avatar: string | null; joined_at: string | null }[] }>(
    'GET',
    `/me/referrals${q}`,
    { token },
  );
  return { total: r.total, nextCursor: r.next_cursor, items: r.data.map((f) => ({ id: f.id, name: f.name, avatar: f.avatar, joinedAt: f.joined_at })) };
}

/** SĐT Việt Nam (khớp server): bỏ khoảng trắng / dấu chấm / gạch, +84 → 0; hợp lệ = 10 số bắt đầu bằng 0. */
export function normalizePhone(raw: string): string {
  const p = raw.replace(/[\s.\-()]/g, '');
  const m = /^\+?84(\d{9})$/.exec(p);
  return m ? `0${m[1]}` : p;
}
export const isValidPhone = (raw: string) => raw.trim() === '' || /^0\d{9}$/.test(normalizePhone(raw));
