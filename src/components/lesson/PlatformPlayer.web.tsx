import { useEffect, useRef } from 'react';

import type { PlatformPlayerProps } from './PlatformPlayer.types';

/**
 * Web: thẻ <video> của trình duyệt. Safari phát HLS sẵn; Chrome / Firefox / Edge dùng hls.js (tải lười khi cần).
 */
export function PlatformPlayer({ url, seek, onTime, onError }: PlatformPlayerProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const cb = useRef({ onTime, onError });
  cb.current = { onTime, onError };

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    let hls: { destroy: () => void } | null = null;
    let cancelled = false;
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.play().catch(() => {});
    } else {
      import('hls.js').then(({ default: Hls }) => {
        if (cancelled) return;
        if (!Hls.isSupported()) return cb.current.onError();
        const h = new Hls();
        hls = h;
        h.on(Hls.Events.ERROR, (_e, d) => {
          if (d.fatal) cb.current.onError();
        });
        h.loadSource(url);
        h.attachMedia(video);
        h.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
      }, () => cb.current.onError());
    }
    // timeupdate của trình duyệt bắn ~4 lần / giây → gom lại mỗi giây cho giống native
    let last = -1;
    const onUpdate = () => {
      const s = Math.floor(video.currentTime);
      if (s !== last) {
        last = s;
        cb.current.onTime(video.currentTime, !video.paused);
      }
    };
    video.addEventListener('timeupdate', onUpdate);
    return () => {
      cancelled = true;
      video.removeEventListener('timeupdate', onUpdate);
      hls?.destroy();
    };
  }, [url]);

  useEffect(() => {
    const video = ref.current;
    if (!video || !seek) return;
    video.currentTime = seek.t;
    video.play().catch(() => {});
  }, [seek]);

  return (
    <video
      ref={ref}
      controls
      playsInline
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', backgroundColor: '#000', objectFit: 'contain' }}
    />
  );
}
