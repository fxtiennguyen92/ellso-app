/**
 * API TÀI KHOẢN — BẢN GIẢ LẬP (chưa nối Laravel).
 * Khi có server (Laravel Sanctum, prefix /v1) chỉ cần thay thân các hàm api* bằng fetch,
 * giữ nguyên kiểu trả về & AuthError → màn hình không phải sửa.
 *
 * Luồng (theo ghi chú trên canvas thiết kế):
 * - Đăng ký chỉ cần Họ tên + Email (+ mã giới thiệu tuỳ chọn) → server tạo MẬT KHẨU TẠM, gửi email.
 * - Đăng nhập bằng mật khẩu tạm → server trả mustChangePassword = true → app bắt đặt mật khẩu mới.
 * - Quên mật khẩu: gửi mật khẩu tạm mới qua email → đăng nhập lại → bắt buộc đổi (chung luồng trên).
 */

export type AuthUser = { id: string; name: string; email: string; initials: string };
export type Session = { token: string; user: AuthUser; mustChangePassword: boolean };
export type Referrer = { code: string; name: string; initials: string };

export type AuthErrorField = 'name' | 'email' | 'password' | 'code' | 'newPassword' | 'form';
export class AuthError extends Error {
  constructor(
    message: string,
    public field: AuthErrorField = 'form',
  ) {
    super(message);
  }
}

/** Bản demo: mọi mật khẩu tạm đều là giá trị này (thật: server sinh ngẫu nhiên và gửi email). */
export const DEMO_TEMP_PASSWORD = '123456';
/** Tài khoản demo đã có sẵn. */
export const DEMO_ACCOUNT = { email: 'tien.nguyen@example.com', password: 'Ellso2026' };
/** Thời gian chờ trước khi được gửi lại email (giây). */
export const RESEND_SECONDS = 60;

type StoredUser = AuthUser & { password: string; temp: boolean; referrer?: string };

const users = new Map<string, StoredUser>([
  [DEMO_ACCOUNT.email, { id: 'u1', name: 'Nguyễn Tiến', email: DEMO_ACCOUNT.email, initials: 'NT', password: DEMO_ACCOUNT.password, temp: false }],
]);

const referrers: Record<string, Referrer> = {
  TIEN2026: { code: 'TIEN2026', name: 'Nguyễn Tiến', initials: 'NT' },
};

const delay = (ms = 650) => new Promise((r) => setTimeout(r, ms));
const normEmail = (e: string) => e.trim().toLowerCase();

export const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());

export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts.length > 1 ? parts[parts.length - 2][0] : '';
  return (first + parts[parts.length - 1][0]).toUpperCase();
}

const toSession = (u: StoredUser): Session => ({
  token: `demo-${u.id}-${Date.now()}`,
  user: { id: u.id, name: u.name, email: u.email, initials: u.initials },
  mustChangePassword: u.temp,
});

/** POST /v1/auth/login */
export async function apiLogin(email: string, password: string): Promise<Session> {
  await delay();
  const u = users.get(normEmail(email));
  if (!u || u.password !== password) throw new AuthError('Email hoặc mật khẩu không đúng.', 'password');
  return toSession(u);
}

/** POST /v1/auth/register — server tạo mật khẩu tạm và gửi email. */
export async function apiRegister(input: { name: string; email: string; referralCode?: string }): Promise<{ email: string }> {
  await delay();
  const email = normEmail(input.email);
  if (users.has(email)) throw new AuthError('Email này đã có tài khoản. Hãy đăng nhập hoặc dùng "Quên mật khẩu".', 'email');
  const name = input.name.trim();
  users.set(email, {
    id: `u${users.size + 1}`,
    name,
    email,
    initials: initialsOf(name),
    password: DEMO_TEMP_PASSWORD,
    temp: true,
    referrer: input.referralCode,
  });
  return { email };
}

/** POST /v1/auth/forgot-password — luôn trả thành công (không để lộ email nào đã đăng ký). */
export async function apiForgotPassword(email: string): Promise<{ email: string }> {
  await delay();
  const u = users.get(normEmail(email));
  if (u) {
    u.password = DEMO_TEMP_PASSWORD;
    u.temp = true;
  }
  return { email: normEmail(email) };
}

/** POST /v1/auth/resend — gửi lại email mật khẩu tạm. */
export async function apiResend(_email: string): Promise<void> {
  await delay(500);
}

/** GET /v1/referrals/{code} — kiểm tra mã giới thiệu. */
export async function apiCheckReferral(code: string): Promise<Referrer> {
  await delay(500);
  const r = referrers[code.trim().toUpperCase()];
  if (!r) throw new AuthError('Mã không đúng hoặc đã hết hạn.', 'code');
  return r;
}

/** POST /v1/auth/change-password — đặt mật khẩu mới sau khi đăng nhập bằng mật khẩu tạm. */
export async function apiChangePassword(session: Session, newPassword: string): Promise<Session> {
  await delay();
  const u = users.get(session.user.email);
  if (u?.temp && u.password === newPassword) throw new AuthError('Mật khẩu mới phải khác mật khẩu tạm.', 'newPassword');
  if (u) {
    u.password = newPassword;
    u.temp = false;
  }
  return { ...session, mustChangePassword: false };
}

/** POST /v1/auth/logout */
export async function apiLogout(_session: Session | null): Promise<void> {
  await delay(200);
}

// ---------- Quy tắc mật khẩu mới ----------

export type PasswordRule = { key: string; label: string; ok: boolean };

/** ≥ 8 ký tự · có chữ hoa + chữ thường · có số · khác mật khẩu tạm (nếu app còn nhớ mật khẩu tạm). */
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
