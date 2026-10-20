/** Giao diện chung cho video splash (bản native: SplashVideo.tsx · bản web: SplashVideo.web.tsx). */
export type SplashVideoProps = {
  /** Video thật sự bắt đầu chạy (khung hình đang chuyển động). */
  onPlaying: () => void;
  /** Thời điểm hiện tại của video (giây), gọi định kỳ khi đang chạy. */
  onTime: (seconds: number) => void;
  /** Video chạy hết. */
  onEnd: () => void;
  /** Không phát được: lỗi tải, trình duyệt chặn tự phát, chế độ tiết kiệm pin… */
  onFail: (reason: string) => void;
  /** Đang chuyển cảnh ra → dừng video. */
  stopped: boolean;
};

export const SPLASH_VIDEO = require('../../../assets/video/ellso-splash.mp4');