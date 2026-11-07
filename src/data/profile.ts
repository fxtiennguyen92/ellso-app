/**
 * Màn Hồ sơ: tên, email, mã giới thiệu, số xu, gói thành viên lấy từ GET /me (AuthProvider).
 * Phần dưới đây là DỮ LIỆU TẠM còn lại (mẫu link giới thiệu…) + danh sách trang con.
 */

export type Profile = {
  name: string;
  initials: string;
  email: string;
  membership: { name: string; expiresAt: string } | null;
  referral: {
    code: string;
    link: string;
    ratePercent: number;
    creditBalance: number;
    invited: number;
    purchased: number;
  };
  appVersion: string;
};

const profile: Profile = {
  name: 'Nguyễn Tiến',
  initials: 'NT',
  email: 'tien.nguyen@example.com',
  membership: { name: 'Thành viên', expiresAt: '2026-11-30' },
  referral: {
    code: 'TIEN2026',
    link: 'https://ellso.app/r/TIEN2026',
    ratePercent: 10,
    creditBalance: 120,
    invited: 8,
    purchased: 3,
  },
  appVersion: '1.0.0',
};

export function getProfile(): Profile {
  return profile;
}

/** "2026-11-30" → "30/11/2026" */
export const formatDate = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

/** "2026-11-30T…" (ISO) → "30/11/2026" */
export const dmy = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

/** Số ngày còn lại tới ISO (làm tròn lên, tối thiểu 0). */
export const daysUntil = (iso: string) => Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));

/** 1250 → "1.250" */
export const groupThousands = (n: number) => String(Math.max(0, Math.floor(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/** Link hiển thị gọn (bỏ https://) */
export const displayLink = (url: string) => url.replace(/^https?:\/\//, '');

/** Các trang con của Hồ sơ (đang là màn tạm) — key = đường dẫn /profile/<key>. */
export const profileSections = {
  'thong-tin': 'Thông tin cá nhân',
  'mat-khau': 'Mật khẩu',
  'thiet-bi': 'Thiết bị',
  'ban-be': 'Bạn bè',
  xu: 'Xu của tôi',
  'lich-su-mua-hang': 'Lịch sử thanh toán',
  'quan-ly-goi': 'Quản lý gói',
  'tro-giup': 'Trung tâm trợ giúp',
  'dieu-khoan': 'Điều khoản & quyền riêng tư',
} as const;

export type ProfileSection = keyof typeof profileSections;