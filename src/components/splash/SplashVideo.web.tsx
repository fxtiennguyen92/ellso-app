import { Asset } from 'expo-asset';
import { createElement, useEffect, useRef } from 'react';

import { SPLASH_VIDEO, type SplashVideoProps } from './SplashVideo.types';

/**
 * Web: dùng thẻ <video> thật thay vì expo-video, để tự xử lý chính sách tự phát của trình duyệt
 * điện thoại (Safari iOS, Chrome Android):
 * - phải có đủ `muted` + `playsinline` + `autoplay` NGAY TỪ ĐẦU (đặt cả thuộc tính lẫn property);
 * - `play()` trả về Promise — nếu bị chặn (chế độ tiết kiệm pin, cài đặt trình duyệt…) thì báo
 *   onFail để bỏ qua splash, thay vì để lỗi "Unhandled promise rejection" làm hỏng app;
 * - Safari cần máy chủ hỗ trợ tải từng đoạn (HTTP Range) mới phát mp4 — lỗi tải cũng báo onFail.
 */
export function SplashVideo({ onPlaying, onTime, onEnd, onFail, stopped }: SplashVideoProps) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const cb = useRef({ onPlaying, onTime, onEnd, onFail });
  cb.current = { onPlaying, onTime, onEnd, onFail };

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    let done = false;
    const fail = (reason: string) => {
      if (done) return;
      done = true;
      cb.current.onFail(reason);
    };

    // Ép tắt tiếng + phát tại chỗ trước khi phát (Safari kiểm tra lúc gọi play)
    v.muted = true;
    v.defaultMuted = true;
    v.setAttribute('muted', '');
    v.setAttribute('playsinline', '');
    v.setAttribute('webkit-playsinline', '');

    const onPlayingEv = () => cb.current.onPlaying();
    const onTimeEv = () => cb.current.onTime(v.currentTime);
    const onEndedEv = () => cb.current.onEnd();
    const onErrorEv = () => fail(`media error ${v.error?.code ?? ''}`);
    v.addEventListener('playing', onPlayingEv);
    v.addEventListener('timeupdate', onTimeEv);
    v.addEventListener('ended', onEndedEv);
    v.addEventListener('error', onErrorEv);

    const tryPlay = () => {
      const p = v.play();
      if (p && typeof p.catch === 'function')
        p.catch((e: Error) => {
          // AbortError: play bị ngắt do pause/gỡ thẻ — không phải lỗi
          if (e?.name !== 'AbortError') fail(e?.name ?? 'play rejected');
        });
    };
    if (v.readyState >= 2) tryPlay();
    else v.addEventListener('canplay', tryPlay, { once: true });

    return () => {
      v.removeEventListener('playing', onPlayingEv);
      v.removeEventListener('timeupdate', onTimeEv);
      v.removeEventListener('ended', onEndedEv);
      v.removeEventListener('error', onErrorEv);
      v.removeEventListener('canplay', tryPlay);
      v.pause();
    };
  }, []);

  useEffect(() => {
    if (stopped) ref.current?.pause();
  }, [stopped]);

  return createElement('video', {
    ref,
    src: Asset.fromModule(SPLASH_VIDEO).uri,
    muted: true,
    autoPlay: true,
    playsInline: true,
    preload: 'auto',
    disablePictureInPicture: true,
    disableRemotePlayback: true,
    controls: false,
    'aria-label': 'Ellso',
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      pointerEvents: 'none',
      backgroundColor: '#ffffff',
    },
  });
}