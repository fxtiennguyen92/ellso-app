import { useCallback, useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';

import { apiStartSession, apiUpdateSession, type SessionStats } from '@/data/lesson';

/** Không tương tác quá lâu (không cuộn / bấm, không xem video) → không tính là đang học. */
const IDLE_AFTER_MS = 60_000;
const FLUSH_EVERY_MS = 15_000;

/**
 * Theo dõi trải nghiệm học một bài (để CMS đánh giá bài: xem trang Thống kê học):
 * - thời gian học thực: chỉ đếm khi app đang mở và học viên có tương tác trong 60 giây gần nhất (hoặc đang xem video)
 * - độ sâu cuộn lớn nhất (%), đã cuộn tới cuối bài chưa, số giây xem video
 * Gửi mỗi 15 giây khi có thay đổi, khi app vào nền và khi rời bài. Lỗi mạng bỏ qua — không ảnh hưởng việc học.
 */
export function useLessonTracking(token: string | null, lessonId: number | null) {
  const session = useRef<number | null>(null);
  const stats = useRef<SessionStats>({ active_seconds: 0, max_scroll_percent: 0, reached_end: false, video_seconds: 0 });
  const sent = useRef('');
  const lastActivity = useRef(Date.now());
  const videoUntil = useRef(0);
  const foreground = useRef(true);

  const flush = useCallback(() => {
    const id = session.current;
    if (!token || !id) return;
    const body = { ...stats.current, video_seconds: Math.round(stats.current.video_seconds) };
    const key = JSON.stringify(body);
    if (key === sent.current) return;
    sent.current = key;
    apiUpdateSession(token, id, body).catch(() => {
      sent.current = ''; // gửi lại lần sau
    });
  }, [token]);

  // Mở phiên khi vào bài
  useEffect(() => {
    if (!token || !lessonId) return;
    let alive = true;
    apiStartSession(token, lessonId)
      .then((id) => {
        if (alive) session.current = id;
      })
      .catch(() => {});
    return () => {
      alive = false;
      flush();
      session.current = null;
    };
  }, [token, lessonId, flush]);

  // Đồng hồ học thực + gửi định kỳ
  useEffect(() => {
    if (!lessonId) return;
    let ticks = 0;
    const timer = setInterval(() => {
      const now = Date.now();
      const visible = Platform.OS !== 'web' || typeof document === 'undefined' || document.visibilityState === 'visible';
      if (foreground.current && visible && (now - lastActivity.current < IDLE_AFTER_MS || now < videoUntil.current)) {
        stats.current.active_seconds += 1;
      }
      if (++ticks % (FLUSH_EVERY_MS / 1000) === 0) flush();
    }, 1000);

    const sub = AppState.addEventListener('change', (s) => {
      foreground.current = s === 'active';
      if (s !== 'active') flush();
      else lastActivity.current = Date.now();
    });
    const onHide = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') flush();
    };
    if (Platform.OS === 'web' && typeof document !== 'undefined') document.addEventListener('visibilitychange', onHide);
    return () => {
      clearInterval(timer);
      sub.remove();
      if (Platform.OS === 'web' && typeof document !== 'undefined') document.removeEventListener('visibilitychange', onHide);
    };
  }, [lessonId, flush]);

  /** Gọi trong onScroll của bài. */
  const onScroll = useCallback((y: number, viewport: number, content: number) => {
    lastActivity.current = Date.now();
    if (content <= 0) return;
    const pct = Math.min(100, Math.round(((y + viewport) / content) * 100));
    if (pct > stats.current.max_scroll_percent) stats.current.max_scroll_percent = pct;
  }, []);

  const touch = useCallback(() => {
    lastActivity.current = Date.now();
  }, []);

  const reachedEnd = useCallback(() => {
    stats.current.reached_end = true;
    stats.current.max_scroll_percent = 100;
  }, []);

  /** Video đang phát thêm `seconds` giây (tính là đang học kể cả khi không chạm màn hình). */
  const addVideo = useCallback((seconds: number) => {
    stats.current.video_seconds += seconds;
    videoUntil.current = Date.now() + 3000;
  }, []);

  return { onScroll, touch, reachedEnd, addVideo, flush };
}
