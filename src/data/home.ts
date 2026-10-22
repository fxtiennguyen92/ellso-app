/**
 * DỮ LIỆU TẠM cho màn Home — chưa nối CMS.
 * Khi có API (ellso-server, prefix /v1), chỉ cần thay getHomeData() bằng lời gọi fetch
 * trả về đúng kiểu HomeData bên dưới; các component không phải sửa.
 */

export type CourseIllustration = 'bulb' | 'web' | 'trophy';
export type CourseTint = 'mint' | 'sky' | 'sun';

export type Course = {
  id: string;
  title: string;
  /** Tên lộ trình đang học (chip góc trái). */
  pathLabel: string;
  nextLesson: { number: number; title: string };
  /** 0–100 */
  progress: number;
  illustration: CourseIllustration;
  tint: CourseTint;
};

export type TutorSession = {
  id: string;
  title: string;
  /** ISO, giờ địa phương */
  start: string;
  end: string;
  location: string;
  room?: string;
  tutor: { name: string; initials: string };
};

/** Chiến dịch marketing hiển thị ở thẻ lớn dưới ô tìm kiếm. */
export type Campaign = {
  id: string;
  /** Dòng nhỏ phía trên (tên dịp). */
  eyebrow: string;
  title: string;
  /** Số to nổi bật, vd "-10%". */
  highlight: string;
  description: string;
  /** ISO — ngày kết thúc ưu đãi. */
  endsAt: string;
  cta: string;
};

export type HomeData = {
  student: { name: string; initials: string; unreadNotifications: number };
  campaign: Campaign | null;
  /** Lịch huấn luyện: các buổi huấn luyện nhóm sắp tới (hiển thị 3 buổi gần nhất). */
  trainings: TutorSession[];
  courses: Course[];
  daily: {
    quiz: { total: number; remaining: number };
    podcast: { total: number; remaining: number };
  };
  sessions: TutorSession[];
};

const data: HomeData = {
  student: { name: 'Nguyễn Tiến', initials: 'NT', unreadNotifications: 2 },
  campaign: {
    id: 'giang-sinh-2026',
    eyebrow: 'Ưu đãi Giáng Sinh',
    title: 'Giảm 10% khoá học Tư duy phản biện',
    highlight: '-10%',
    description: 'Quà cuối năm cho bạn — áp dụng khi đăng ký trước Giáng Sinh.',
    endsAt: '2026-12-25T23:59:00',
    cta: 'Xem ưu đãi',
  },
  trainings: [
    {
      id: 't1',
      title: 'Huấn luyện nhóm: Thuyết trình tự tin',
      start: '2026-10-23T18:30:00',
      end: '2026-10-23T20:30:00',
      location: '[Địa điểm]',
      room: 'Phòng 201',
      tutor: { name: 'Minh Khoa', initials: 'MK' },
    },
    {
      id: 't2',
      title: 'Huấn luyện: Phản hồi 1-1 hiệu quả',
      start: '2026-10-27T19:00:00',
      end: '2026-10-27T21:00:00',
      location: '[Địa điểm]',
      room: 'Phòng 105',
      tutor: { name: 'Thuỳ Vân', initials: 'TV' },
    },
    {
      id: 't3',
      title: 'Huấn luyện: Tư duy phản biện ứng dụng',
      start: '2026-10-31T09:00:00',
      end: '2026-10-31T11:30:00',
      location: '[Địa điểm]',
      room: 'Hội trường A',
      tutor: { name: 'Quốc Bảo', initials: 'QB' },
    },
  ],
  courses: [
    {
      id: 'tu-duy-phan-bien',
      title: 'Tư duy phản biện',
      pathLabel: 'Marketing',
      nextLesson: { number: 9, title: 'Đặt câu hỏi đúng' },
      progress: 40,
      illustration: 'bulb',
      tint: 'mint',
    },
    {
      id: 'tao-web-bang-ai',
      title: 'Tạo Web bằng AI',
      pathLabel: 'Marketing',
      nextLesson: { number: 3, title: 'Prompt cho giao diện' },
      progress: 15,
      illustration: 'web',
      tint: 'sky',
    },
    {
      id: 'lanh-dao-bang-thau-hieu',
      title: 'Lãnh đạo bằng thấu hiểu',
      pathLabel: 'Chung',
      nextLesson: { number: 14, title: 'Phản hồi 1-1' },
      progress: 72,
      illustration: 'trophy',
      tint: 'sun',
    },
  ],
  daily: {
    quiz: { total: 5, remaining: 3 },
    podcast: { total: 3, remaining: 2 },
  },
  sessions: [
    {
      id: 's1',
      title: 'Coaching 1-1: Tư duy phản biện',
      start: '2026-10-21T14:00:00',
      end: '2026-10-21T15:30:00',
      location: '[Địa điểm]',
      room: 'Phòng 302',
      tutor: { name: 'Thuỳ Vân', initials: 'TV' },
    },
    {
      id: 's2',
      title: 'Workshop: Dẫn dắt cuộc họp',
      start: '2026-10-24T09:00:00',
      end: '2026-10-24T11:30:00',
      location: '[Địa điểm]',
      tutor: { name: 'Thuỳ Vân', initials: 'TV' },
    },
  ],
};

/** Giả lập gọi API (có độ trễ nhỏ) để splash có việc "chuẩn bị". */
export async function getHomeData(): Promise<HomeData> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return data;
}

/** Bản đồng bộ — dùng sau khi đã prefetch ở root layout. */
export function getHomeDataSync(): HomeData {
  return data;
}

// ---------- Định dạng ngày giờ tiếng Việt ----------

const WEEKDAYS = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
const WEEKDAYS_SHORT = ['CN', 'TH 2', 'TH 3', 'TH 4', 'TH 5', 'TH 6', 'TH 7'];

const pad = (n: number) => String(n).padStart(2, '0');

export function formatSession(session: TutorSession, now = new Date()) {
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