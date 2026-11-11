/** Trình phát video bài học (HLS). Native: expo-video. Web: <video> + hls.js (Safari phát HLS sẵn). */
export type PlatformPlayerProps = {
  url: string;
  /** Tua tới giây `t` (đổi `n` để tua lại cùng mốc). */
  seek: { t: number; n: number } | null;
  /** Mỗi ~1 giây khi đang chạy: vị trí hiện tại + có đang phát không. */
  onTime: (currentTime: number, playing: boolean) => void;
  onError: () => void;
};
