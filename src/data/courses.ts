/**
 * DỮ LIỆU TẠM cho tab Khoá học và màn Lộ trình học — chưa nối CMS.
 * Kiểu dữ liệu bám theo elearning-spec (khoá học → lộ trình → chương có màu → bài trong lộ trình).
 * Khi có API chỉ cần thay các hàm get… ở cuối file.
 */
import type { IconName } from '@/components/Icon';
import type { ChapterColor } from '@/theme/tokens';

import type { CourseIllustration, CourseTint } from './home';

// ---------------------------------------------------------------- Danh sách

export type EnrolledCourse = {
  id: string;
  title: string;
  /** Vị trí hiện tại, ví dụ "Chương 2 · Bài 9/20" */
  chapterNo: number;
  lessonNo: number;
  lessonTotal: number;
  progress: number; // 0–100
  illustration: CourseIllustration;
  tint: CourseTint;
};

export type ExploreIllustration = 'chat' | 'clock' | 'bars' | 'globe';
export type ExploreTint = 'orange' | 'mint' | 'sky' | 'violet';

export type Category = { id: string; name: string };

export type ExploreCourse = {
  id: string;
  title: string;
  categoryId: string;
  instructor: { name: string; initials: string };
  chapters: number;
  lessons: number;
  /** VND; 0 = miễn phí */
  price: number;
  originalPrice?: number;
  isNew?: boolean;
  illustration: ExploreIllustration;
  tint: ExploreTint;
};

export const categories: Category[] = [
  { id: 'soft-skills', name: 'Kỹ năng mềm' },
  { id: 'leadership', name: 'Lãnh đạo' },
  { id: 'tech-ai', name: 'Công nghệ & AI' },
  { id: 'productivity', name: 'Năng suất' },
];

const enrolled: EnrolledCourse[] = [
  {
    id: 'tu-duy-phan-bien',
    title: 'Tư duy phản biện',
    chapterNo: 2,
    lessonNo: 9,
    lessonTotal: 20,
    progress: 40,
    illustration: 'bulb',
    tint: 'mint',
  },
  {
    id: 'tao-web-bang-ai',
    title: 'Tạo Web bằng AI',
    chapterNo: 1,
    lessonNo: 3,
    lessonTotal: 14,
    progress: 15,
    illustration: 'web',
    tint: 'sky',
  },
  {
    id: 'lanh-dao-bang-thau-hieu',
    title: 'Lãnh đạo bằng thấu hiểu',
    chapterNo: 3,
    lessonNo: 14,
    lessonTotal: 18,
    progress: 72,
    illustration: 'trophy',
    tint: 'sun',
  },
];

const explore: ExploreCourse[] = [
  {
    id: 'giao-tiep-thuyet-phuc',
    title: 'Giao tiếp thuyết phục',
    categoryId: 'soft-skills',
    instructor: { name: 'Trần Hải Yến', initials: 'HY' },
    chapters: 6,
    lessons: 32,
    price: 690_000,
    originalPrice: 890_000,
    illustration: 'chat',
    tint: 'orange',
  },
  {
    id: 'quan-ly-thoi-gian',
    title: 'Quản lý thời gian hiệu quả',
    categoryId: 'productivity',
    instructor: { name: 'Phạm Quốc Bảo', initials: 'QB' },
    chapters: 4,
    lessons: 18,
    price: 0,
    isNew: true,
    illustration: 'clock',
    tint: 'mint',
  },
  {
    id: 'phan-tich-du-lieu',
    title: 'Phân tích dữ liệu cho người mới',
    categoryId: 'tech-ai',
    instructor: { name: 'Nguyễn Thu Hà', initials: 'TH' },
    chapters: 7,
    lessons: 41,
    price: 1_290_000,
    illustration: 'bars',
    tint: 'sky',
  },
  {
    id: 'dan-dat-doi-nhom-tu-xa',
    title: 'Dẫn dắt đội nhóm từ xa',
    categoryId: 'leadership',
    instructor: { name: 'Đỗ Minh Quân', initials: 'MQ' },
    chapters: 5,
    lessons: 26,
    price: 890_000,
    illustration: 'globe',
    tint: 'violet',
  },
];

/** Khoá đã có sẵn trong giỏ (giả lập). */
export const initialCart = ['giao-tiep-thuyet-phuc'];

// ---------------------------------------------------------------- Lộ trình

export type LessonKind = 'lesson' | 'meeting' | 'test';
/** done = đã qua · next = bài kế tiếp (học được) · locked = chưa mở */
export type LessonStatus = 'done' | 'next' | 'locked';

export type PathLesson = {
  id: string;
  title: string;
  kind: LessonKind;
  status: LessonStatus;
  icon: IconName;
  /** Bài thường: thời lượng ước tính, ví dụ "12 phút" */
  duration?: string;
  /** Bài gặp gia sư: ngày hẹn (đã đặt lịch) */
  meetingDate?: string;
};

export type PathChapter = {
  id: string;
  title: string;
  color: ChapterColor;
  lessons: PathLesson[];
};

export type CoursePath = {
  courseId: string;
  courseTitle: string;
  pathName: string;
  chapters: PathChapter[];
};

const paths: Record<string, CoursePath> = {
  'tu-duy-phan-bien': {
    courseId: 'tu-duy-phan-bien',
    courseTitle: 'Tư duy phản biện',
    pathName: 'Làm được',
    chapters: [
      {
        id: 'c1',
        title: 'Nhận diện lối mòn tư duy',
        color: 'sage',
        lessons: [
          { id: 'l1', title: 'Tư duy phản biện là gì?', kind: 'lesson', status: 'done', icon: 'bulb' },
          { id: 'l2', title: 'Thiên kiến xác nhận', kind: 'lesson', status: 'done', icon: 'eye' },
          { id: 'l3', title: 'Lối tắt của não bộ', kind: 'lesson', status: 'done', icon: 'zap' },
          { id: 'l4', title: 'Tách sự kiện và ý kiến', kind: 'lesson', status: 'done', icon: 'scale' },
          { id: 'l5', title: 'Coaching 1-1: Nhận diện lối mòn', kind: 'meeting', status: 'done', icon: 'people' },
        ],
      },
      {
        id: 'c2',
        title: 'Đặt câu hỏi & đánh giá lập luận',
        color: 'teal',
        lessons: [
          { id: 'l6', title: 'Cấu trúc một lập luận', kind: 'lesson', status: 'done', icon: 'layers' },
          { id: 'l7', title: 'Tìm giả định ẩn', kind: 'lesson', status: 'done', icon: 'key' },
          { id: 'l8', title: 'Nguỵ biện thường gặp', kind: 'lesson', status: 'done', icon: 'alert' },
          { id: 'l9', title: 'Đặt câu hỏi đúng', kind: 'lesson', status: 'next', icon: 'help', duration: '12 phút' },
          {
            id: 'l10',
            title: 'Coaching 1-1: Tư duy phản biện',
            kind: 'meeting',
            status: 'locked',
            icon: 'people',
            meetingDate: '21/10',
          },
          { id: 'l11', title: 'Phản biện không gây mất lòng', kind: 'lesson', status: 'locked', icon: 'message' },
          { id: 'l12', title: 'Kiểm tra chương 2', kind: 'test', status: 'locked', icon: 'clipboard' },
        ],
      },
      {
        id: 'c3',
        title: 'Ra quyết định sáng suốt',
        color: 'steel',
        lessons: [
          { id: 'l13', title: 'Ma trận quyết định', kind: 'lesson', status: 'locked', icon: 'grid' },
          { id: 'l14', title: 'Cân nhắc nhiều lựa chọn', kind: 'lesson', status: 'locked', icon: 'branch' },
          { id: 'l15', title: 'Đặt mục tiêu rõ ràng', kind: 'lesson', status: 'locked', icon: 'target' },
          { id: 'l16', title: 'Đánh giá rủi ro', kind: 'lesson', status: 'locked', icon: 'alert' },
          { id: 'l17', title: 'Quyết định trong nhóm', kind: 'lesson', status: 'locked', icon: 'people' },
          { id: 'l18', title: 'Học từ quyết định sai', kind: 'lesson', status: 'locked', icon: 'eye' },
          { id: 'l19', title: 'Coaching 1-1: Ra quyết định', kind: 'meeting', status: 'locked', icon: 'people' },
          { id: 'l20', title: 'Kiểm tra cuối khoá', kind: 'test', status: 'locked', icon: 'clipboard' },
        ],
      },
    ],
  },
};

/** Lộ trình mẫu cho các khoá chưa có dữ liệu riêng (tạm). */
function samplePath(course: EnrolledCourse): CoursePath {
  const icons: IconName[] = ['bulb', 'layers', 'key', 'target', 'grid', 'branch', 'eye', 'zap'];
  let n = 0;
  const doneCount = course.lessonNo - 1;
  const chapters: PathChapter[] = [0, 1, 2].map((c) => {
    const lessons: PathLesson[] = Array.from({ length: c === 2 ? course.lessonTotal - 2 * Math.floor(course.lessonTotal / 3) : Math.floor(course.lessonTotal / 3) }, (_, i) => {
      n += 1;
      const isLast = i === Math.floor(course.lessonTotal / 3) - 1;
      const kind: LessonKind = isLast && c < 2 ? 'meeting' : 'lesson';
      return {
        id: `l${n}`,
        title: `Bài ${n}`,
        kind,
        status: n <= doneCount ? 'done' : n === doneCount + 1 ? 'next' : 'locked',
        icon: kind === 'meeting' ? 'people' : icons[n % icons.length],
        duration: n === doneCount + 1 ? '10 phút' : undefined,
      };
    });
    return { id: `c${c + 1}`, title: `Chương ${c + 1}`, color: ['sage', 'teal', 'steel'][c] as ChapterColor, lessons };
  });
  return { courseId: course.id, courseTitle: course.title, pathName: 'Mặc định', chapters };
}

// ---------------------------------------------------------------- API giả lập

export function getEnrolledCourses() {
  return enrolled;
}

export function getExploreCourses() {
  return explore;
}

export function getCoursePath(courseId: string): CoursePath | null {
  if (paths[courseId]) return paths[courseId];
  const course = enrolled.find((c) => c.id === courseId);
  return course ? samplePath(course) : null;
}

/** 1290000 → "1.290.000đ" (tự định dạng, không phụ thuộc Intl của máy). */
export const formatPrice = (vnd: number) => `${String(Math.round(vnd)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}đ`;