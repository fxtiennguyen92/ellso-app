/**
 * DỮ LIỆU MÀN HOME — gọi ellso-server (prefix /v1):
 * - GET /campaigns                 → chiến dịch đang hiển thị (banner 16:9), carousel đầu trang
 * - GET /trainings                 → chương trình huấn luyện offline (nhiều buổi), lấy buổi sắp tới
 * - GET /workshops                 → workshop online, buổi gần nhất
 * - GET /documents?type=book       → sách (cần đăng nhập)
 *
 * Mỗi nguồn lỗi riêng không làm hỏng cả trang (Promise.allSettled): mục nào lỗi / trống thì ẩn mục đó.
 * Kết quả lần tải gần nhất được giữ trong bộ nhớ: root layout tải trước lúc splash, Home hiện ngay rồi làm mới.
 */
import { fromApiDoc, type ApiDoc, type Doc } from '@/data/documents';
import { apiRequest } from '@/lib/api';

// ---------- Kiểu dùng chung với màn khác (giữ nguyên) ----------

export type CourseIllustration = 'bulb' | 'web' | 'trophy';
export type CourseTint = 'mint' | 'sky' | 'sun';

/** Một buổi trên lịch (thẻ vé / dòng gọn ở Home). */
export type TutorSession = {
  id: string;
  title: string;
  /** ISO */
  start: string;
  end: string;
  location: string;
  room?: string;
  tutor: { name: string; initials: string };
};

// ---------- Kiểu dữ liệu Home ----------

export type HomeCampaign = {
  id: string;
  title: string;
  summary: string | null;
  bannerUrl: string | null;
  /** ISO — hết hạn hiển thị. */
  endsAt: string;
};

export type HomeTraining = {
  id: string;
  title: string;
  trainer: string | null;
  isFree: boolean;
  price: number;
  seatsLeft: number | null;
  sessionsCount: number;
  registered: boolean;
  /** Buổi sắp tới gần nhất (số thứ tự trong chương trình). */
  next: { number: number; start: string; end: string; place: string | null };
};

export type HomeWorkshop = {
  id: string;
  title: string;
  trainer: string | null;
  isFree: boolean;
  price: number;
  /** Số chỗ mỗi buổi; null = không giới hạn. */
  capacity: number | null;
  upcomingCount: number;
  next: { start: string; end: string };
};

export type HomeFeed = {
  campaigns: HomeCampaign[];
  trainings: HomeTraining[];
  workshops: HomeWorkshop[];
  books: Doc[];
  /** Có ít nhất một nguồn tải lỗi (hiện thông báo nhẹ + kéo để tải lại). */
  failed: boolean;
};

export const emptyFeed: HomeFeed = { campaigns: [], trainings: [], workshops: [], books: [], failed: false };

// ---------- Định dạng từ API ----------

type Id = number | string;
type ApiCampaign = { id: Id; title: string; summary: string | null; banner: { url: string | null }; ends_at: string };
type ApiSession = { number: number; starts_at: string; ends_at: string; location: { label: string; address: string | null } | null };
type ApiTraining = {
  id: Id;
  title: string;
  trainer: { name: string } | null;
  price: number;
  is_free: boolean;
  seats_left: number | null;
  sessions_count: number;
  registered: boolean | null;
  next_session: ApiSession | null;
};
type ApiWorkshop = {
  id: Id;
  title: string;
  trainer: { name: string } | null;
  price: number;
  is_free: boolean;
  capacity: number | null;
  upcoming_sessions_count: number;
  next_session: { starts_at: string; ends_at: string } | null;
};

const toCampaign = (c: ApiCampaign): HomeCampaign => ({
  id: String(c.id),
  title: c.title,
  summary: c.summary,
  bannerUrl: c.banner?.url ?? null,
  endsAt: c.ends_at,
});

const toTraining = (t: ApiTraining): HomeTraining | null =>
  t.next_session
    ? {
        id: String(t.id),
        title: t.title,
        trainer: t.trainer?.name ?? null,
        isFree: t.is_free,
        price: t.price,
        seatsLeft: t.seats_left,
        sessionsCount: t.sessions_count,
        registered: !!t.registered,
        next: {
          number: t.next_session.number,
          start: t.next_session.starts_at,
          end: t.next_session.ends_at,
          place: t.next_session.location?.label ?? null,
        },
      }
    : null;

const toWorkshop = (w: ApiWorkshop): HomeWorkshop | null =>
  w.next_session
    ? {
        id: String(w.id),
        title: w.title,
        trainer: w.trainer?.name ?? null,
        isFree: w.is_free,
        price: w.price,
        capacity: w.capacity,
        upcomingCount: w.upcoming_sessions_count,
        next: { start: w.next_session.starts_at, end: w.next_session.ends_at },
      }
    : null;

const nonNull = <T,>(x: T | null): x is T => x !== null;

// ---------- Tải + bộ nhớ đệm ----------

let cache: { token: string; feed: HomeFeed } | null = null;

/** Lần tải gần nhất (nếu cùng tài khoản) — Home hiện ngay khi mở. */
export function cachedHomeFeed(token: string | null): HomeFeed | null {
  return token && cache?.token === token ? cache.feed : null;
}

export async function loadHomeFeed(token: string): Promise<HomeFeed> {
  const [campaigns, trainings, workshops, books] = await Promise.allSettled([
    apiRequest<{ data: ApiCampaign[] }>('GET', '/campaigns'),
    apiRequest<{ data: ApiTraining[] }>('GET', '/trainings', { token }),
    apiRequest<{ data: ApiWorkshop[] }>('GET', '/workshops', { token }),
    apiRequest<{ data: ApiDoc[] }>('GET', '/documents?type=book', { token }),
  ]);

  const feed: HomeFeed = {
    campaigns: campaigns.status === 'fulfilled' ? campaigns.value.data.map(toCampaign) : [],
    trainings: trainings.status === 'fulfilled' ? trainings.value.data.map(toTraining).filter(nonNull) : [],
    workshops: workshops.status === 'fulfilled' ? workshops.value.data.map(toWorkshop).filter(nonNull) : [],
    books: books.status === 'fulfilled' ? books.value.data.map(fromApiDoc) : [],
    failed: [campaigns, trainings, workshops, books].some((r) => r.status === 'rejected'),
  };
  cache = { token, feed };
  return feed;
}

// ---------- Định dạng ngày giờ / tiền tiếng Việt ----------

const WEEKDAYS = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
const WEEKDAYS_SHORT = ['CN', 'TH 2', 'TH 3', 'TH 4', 'TH 5', 'TH 6', 'TH 7'];

const pad = (n: number) => String(n).padStart(2, '0');

export function formatSession(session: Pick<TutorSession, 'start' | 'end'>, now = new Date()) {
  const start = new Date(session.start);
  const end = new Date(session.end);
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysLeft = Math.round((startDay.getTime() - today.getTime()) / 86_400_000);

  return {
    weekday: WEEKDAYS[start.getDay()],
    weekdayShort: WEEKDAYS_SHORT[start.getDay()],
    day: String(start.getDate()),
    month: `Th ${start.getMonth() + 1}`,
    startTime: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
    endTime: `${pad(end.getHours())}:${pad(end.getMinutes())}`,
    countdown: daysLeft <= 0 ? 'Hôm nay' : daysLeft === 1 ? 'Ngày mai' : `Còn ${daysLeft} ngày`,
  };
}

/** "Đến hết 25/12" */
export const untilLabel = (iso: string) => {
  const d = new Date(iso);
  return `Đến hết ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
};

/** 200000 → "200.000 ₫" */
export const formatVnd = (n: number) => `${n.toLocaleString('vi-VN')} ₫`;

/** Phí tham gia: 0 = miễn phí với học viên có gói thành viên. */
export const feeLabel = (isFree: boolean, price: number) => (isFree ? 'Miễn phí cho thành viên' : formatVnd(price));
