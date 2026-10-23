/**
 * API TÀI KHOẢN — gọi ellso-server (Laravel Sanctum, prefix /v1). Xem routes/api.php + AuthController ở server.
 *
 * Luồng:
 * - POST /auth/register (họ tên, email, mã giới thiệu tuỳ chọn) → server gửi MẬT KHẨU TẠM qua email.
 * - POST /auth/login → mật khẩu thật: token đầy đủ + user · mật khẩu tạm: change_token (chỉ dùng được /auth/set-password, hết hạn sau ~15 phút).
 * - POST /auth/set-password (Bearer change_token) → token đầy đủ + user, vào app luôn.
 * - POST /auth/forgot-password · POST /auth/resend-temp-password → luôn trả cùng một câu (không lộ email), kèm resend_after_seconds.
 * - GET /referrals/{code} · GET /me · POST /auth/logout.
 */
import { ApiError, apiRequest } from '@/lib/api';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  initials: string;
  avatar?: string | null;
  referralCode?: string | null;
};
export type Session = {
  token: string;
  user: AuthUser;
  mustChangePassword: boolean;
  /** Hết hạn của change_token (ms epoch) — chỉ có khi mustChangePassword. */
  expiresAt?: number;
};
export type Referrer = { code: string; name: string; initials: string };

export type AuthErrorField = 'name' | 'email' | 'password' | 'code' | 'newPassword' | 'session' | 'form';
export class AuthError extends Error {
  constructor(
    message: string,
    public field: AuthErrorField = 'form',
  ) {
    super(message);
  }
}

/** Mặc định nếu server không gửi resend_after_seconds (khớp config ellso.auth.forgot_password.cooldown_seconds). */
export const RESEND_SECONDS = 120;

export const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());
const normEmail = (e: string) => e.trim().toLowerCase();

export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts.length > 1 ? parts[parts.length - 2][0] : '';
  return (first + parts[parts.length - 1][0]).toUpperCase();
}

type ServerUser = { id: number | string; name: string; email: string; avatar?: string | null; referral_code?: string | null };
const toUser = (u: ServerUser): AuthUser => ({
  id: String(u.id),
  name: u.name,
  email: u.email,
  initials: initialsOf(u.name),
  avatar: u.avatar ?? null,
  referralCode: u.referral_code ?? null,
});

/** Đổi ApiError của server thành AuthError gắn đúng ô trên form. `fields`: tên trường server → ô trên app. */
function toAuthError(e: unknown, fields: Record<string, AuthErrorField> = {}): AuthError {
  if (!(e instanceof ApiError)) return new AuthError('Có lỗi xảy ra, thử lại sau.');
  if (e.status === 422) {
    for (const [serverField, appField] of Object.entries(fields)) {
      const msg = e.field(serverField);
      if (msg) return new AuthError(msg, appField);
    }
  }
  return new AuthError(e.message, 'form');
}

type LoginResponse =
  { requires_password_change: true; change_token: string; expires_in: number } | { requires_password_change: false; token: string; user: ServerUser };

/** POST /auth/login */
export async function apiLogin(email: string, password: string): Promise<Session> {
  try {
    const r = await apiRequest<LoginResponse>('POST', '/auth/login', { body: { email: normEmail(email), password } });
    if (r.requires_password_change) {
      // Server chưa trả thông tin user ở bước này → tạm dùng email vừa nhập
      const mail = normEmail(email);
      return {
        token: r.change_token,
        mustChangePassword: true,
        expiresAt: Date.now() + r.expires_in * 1000,
        user: { id: '', name: '', email: mail, initials: mail.slice(0, 1).toUpperCase() },
      };
    }
    return { token: r.token, user: toUser(r.user), mustChangePassword: false };
  } catch (e) {
    // Sai email / mật khẩu: server gắn vào trường email, app hiện dưới ô mật khẩu
    if (e instanceof ApiError && e.status === 422 && e.field('email') && !e.field('password') && isEmail(email)) {
      throw new AuthError(e.field('email')!, 'password');
    }
    throw toAuthError(e, { email: 'email', password: 'password' });
  }
}

/** POST /auth/register — server tạo mật khẩu tạm và gửi email. */
export async function apiRegister(input: { name: string; email: string; referralCode?: string }): Promise<{ email: string; resendAfter: number }> {
  try {
    const r = await apiRequest<{ email: string; resend_after_seconds?: number }>('POST', '/auth/register', {
      body: { name: input.name.trim(), email: normEmail(input.email), referral_code: input.referralCode ?? null },
    });
    return { email: r.email, resendAfter: r.resend_after_seconds ?? RESEND_SECONDS };
  } catch (e) {
    throw toAuthError(e, { name: 'name', email: 'email', referral_code: 'code' });
  }
}

/** POST /auth/forgot-password */
export async function apiForgotPassword(email: string): Promise<{ email: string; resendAfter: number }> {
  try {
    const r = await apiRequest<{ resend_after_seconds?: number }>('POST', '/auth/forgot-password', { body: { email: normEmail(email) } });
    return { email: normEmail(email), resendAfter: r.resend_after_seconds ?? RESEND_SECONDS };
  } catch (e) {
    throw toAuthError(e, { email: 'email' });
  }
}

/** Gửi lại email mật khẩu tạm: sau đăng ký → /auth/resend-temp-password · quên mật khẩu → /auth/forgot-password. Trả số giây chờ lần sau. */
export async function apiResend(kind: 'register' | 'forgot', email: string): Promise<number> {
  try {
    const r = await apiRequest<{ resend_after_seconds?: number }>(
      'POST',
      kind === 'register' ? '/auth/resend-temp-password' : '/auth/forgot-password',
      {
        body: { email: normEmail(email) },
      },
    );
    return r.resend_after_seconds ?? RESEND_SECONDS;
  } catch (e) {
    throw toAuthError(e);
  }
}

/** GET /referrals/{code} — kiểm tra mã giới thiệu. */
export async function apiCheckReferral(code: string): Promise<Referrer> {
  try {
    const r = await apiRequest<{ referral_code: string; name: string }>('GET', `/referrals/${encodeURIComponent(code.trim().toUpperCase())}`);
    return { code: r.referral_code, name: r.name, initials: initialsOf(r.name) };
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) throw new AuthError(e.message || 'Mã giới thiệu không hợp lệ.', 'code');
    throw toAuthError(e);
  }
}

/** POST /auth/set-password — đặt mật khẩu mới bằng change_token, server trả luôn token đăng nhập. */
export async function apiChangePassword(session: Session, newPassword: string): Promise<Session> {
  try {
    const r = await apiRequest<{ token: string; user: ServerUser }>('POST', '/auth/set-password', {
      token: session.token,
      body: { password: newPassword, password_confirmation: newPassword },
    });
    return { token: r.token, user: toUser(r.user), mustChangePassword: false };
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
      throw new AuthError('Phiên đặt mật khẩu đã hết hạn. Vui lòng đăng nhập lại bằng mật khẩu tạm.', 'session');
    }
    throw toAuthError(e, { password: 'newPassword' });
  }
}

/** GET /me — làm mới thông tin user. Ném ApiError (401 = token hết hiệu lực). */
export async function apiMe(token: string): Promise<AuthUser> {
  const r = await apiRequest<{ data: ServerUser }>('GET', '/me', { token });
  return toUser(r.data);
}

/** POST /auth/logout — thu hồi token của thiết bị này (bỏ qua lỗi mạng). */
export async function apiLogout(session: Session | null): Promise<void> {
  if (!session || session.mustChangePassword) return;
  await apiRequest('POST', '/auth/logout', { token: session.token });
}

// ---------- Quy tắc mật khẩu mới (khớp SetPasswordRequest: min 8, chữ hoa + thường, số, khác mật khẩu tạm) ----------

export type PasswordRule = { key: string; label: string; ok: boolean };
export const PASSWORD_MAX = 100;

export function passwordRules(pw: string, tempPassword?: string | null): PasswordRule[] {
  return [
    { key: 'len', label: 'Ít nhất 8 ký tự', ok: pw.length >= 8 },
    { key: 'case', label: 'Có chữ hoa và chữ thường', ok: /[a-zà-ỹ]/.test(pw) && /[A-ZÀ-Ỹ]/.test(pw) },
    { key: 'digit', label: 'Có ít nhất 1 chữ số', ok: /\d/.test(pw) },
    { key: 'diff', label: 'Khác mật khẩu tạm', ok: pw.length > 0 && pw !== tempPassword },
  ];
}

/** Độ mạnh 0–4 (để vẽ thanh 4 vạch). */
export function passwordStrength(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  if (!pw) return { score: 0, label: '' };
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[a-zà-ỹ]/.test(pw) && /[A-ZÀ-Ỹ]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (pw.length >= 12 || /[^A-Za-z0-9À-ỹ]/.test(pw)) s++;
  const score = Math.max(1, s) as 1 | 2 | 3 | 4;
  return { score, label: ['', 'Yếu', 'Trung bình', 'Khá', 'Mạnh'][score] };
}
