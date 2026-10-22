/**
 * DỮ LIỆU TẠM cho màn Hồ sơ — chưa nối CMS.
 * Quy tắc giới thiệu bạn bè (đã chốt 22/10/2026):
 * - mỗi học viên có 1 mã + 1 link + 1 mã QR riêng;
 * - người được mời mua gói thành viên → người mời nhận `ratePercent`% giá trị đơn thành credit (tỉ lệ lưu ở DB, mặc định 10%);
 * - 1 credit = 1.000đ, không hết hạn, trừ không giới hạn vào mọi thanh toán.
 */
import { formatPrice } from './courses';

export const CREDIT_VND = 1000;

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

/** Link hiển thị gọn (bỏ https://) */
export const displayLink = (url: string) => url.replace(/^https?:\/\//, '');

export const creditToVnd = (credit: number) => formatPrice(credit * CREDIT_VND);

/** Các trang con của Hồ sơ (đang là màn tạm) — key = đường dẫn /profile/<key>. */
export const profileSections = {
  'thong-tin': 'Thông tin cá nhân',
  'doi-mat-khau': 'Đổi mật khẩu',
  'lich-su-mua-hang': 'Lịch sử mua hàng',
  'ma-kich-hoat': 'Nhập mã kích hoạt',
  'quan-ly-goi': 'Quản lý gói',
  'lich-su-credit': 'Lịch sử credit',
  'tro-giup': 'Trung tâm trợ giúp',
  'dieu-khoan': 'Điều khoản & quyền riêng tư',
} as const;

export type ProfileSection = keyof typeof profileSections;