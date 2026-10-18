import { useEventListener } from 'expo';
import * as SplashScreen from 'expo-splash-screen';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

import { NATIVE_DRIVER } from '@/hooks/useLoop';

const SPLASH_VIDEO = require('../../../assets/video/ellso-splash.mp4');

/**
 * Logo trong video ghép xong ở giây 6,0 (xem claude/splash-animation-spec.md).
 * Splash không đóng trước mốc này (tính theo thời gian của video, nên máy chậm vẫn thấy đủ logo);
 * sau mốc này, app sẵn sàng lúc nào thì chuyển cảnh lúc đó.
 * Nếu app chưa xong, video chạy tiếp rồi đứng ở frame cuối (logo) cho đến khi xong.
 */
const LOGO_READY_AT = 6.2; // giây trong video
/** Dự phòng theo đồng hồ thật, phòng khi sự kiện timeUpdate không tới. */
const MAX_WAIT_MS = 10_500;
/** Video lỗi / trình duyệt chặn autoplay → không để người dùng chờ quá lâu. */
const FALLBACK_MS = 2500;

type Props = {
  /** Font + dữ liệu đã sẵn sàng. */
  ready: boolean;
  /** Bắt đầu chuyển cảnh → Home bắt đầu hiện các khối. */
  onExitStart: () => void;
  /** Splash đã mờ hẳn → gỡ khỏi cây component. */
  onFinish: () => void;
};

export function SplashOverlay({ ready, onExitStart, onFinish }: Props) {
  const [minDone, setMinDone] = useState(false);
  const started = useRef(false);
  const exiting = useRef(false);
  const progress = useRef(new Animated.Value(0)).current;

  const player = useVideoPlayer(SPLASH_VIDEO, (p) => {
    p.muted = true; // bắt buộc để trình duyệt cho tự phát
    p.loop = false;
    p.timeUpdateEventInterval = 0.25;
    p.play();
  });

  /** Khung hình đầu đã lên → mới ẩn splash gốc (nền trắng) để không bị nháy. */
  const startClock = useCallback(() => {
    if (started.current) return;
    started.current = true;
    SplashScreen.hide();
    setTimeout(() => setMinDone(true), MAX_WAIT_MS);
  }, []);

  useEventListener(player, 'statusChange', ({ status }) => {
    // Web: play() trong setup có thể chạy trước khi thẻ <video> gắn vào → gọi lại khi sẵn sàng
    if (status === 'readyToPlay' && !player.playing && !exiting.current) player.play();
    if (status === 'error') {
      SplashScreen.hide();
      setMinDone(true);
    }
  });
  useEventListener(player, 'playingChange', ({ isPlaying }) => {
    if (isPlaying) startClock();
  });
  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    if (currentTime >= LOGO_READY_AT) setMinDone(true);
  });
  useEventListener(player, 'playToEnd', () => setMinDone(true));

  useEffect(() => {
    const t = setTimeout(() => {
      if (!started.current) {
        // Video không chạy được (autoplay bị chặn…) → bỏ qua phần chờ tối thiểu
        SplashScreen.hide();
        started.current = true;
        setMinDone(true);
      }
    }, FALLBACK_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!ready || !minDone || exiting.current) return;
    exiting.current = true;
    onExitStart();
    Animated.timing(progress, {
      toValue: 1,
      duration: 650,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: NATIVE_DRIVER,
    }).start(() => {
      player.pause();
      onFinish();
    });
  }, [ready, minDone, onExitStart, onFinish, player, progress]);

  return (
    <Animated.View
      pointerEvents={exiting.current ? 'none' : 'auto'}
      style={[
        StyleSheet.absoluteFill,
        styles.container,
        {
          opacity: progress.interpolate({ inputRange: [0, 0.2, 1], outputRange: [1, 1, 0] }),
          transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }],
        },
      ]}
    >
      <VideoView
        player={player}
        // width/height 100% (không dùng absoluteFill): thẻ <video> trên web không tự giãn theo left/right
        style={styles.video}
        contentFit="cover"
        nativeControls={false}
        playsInline
        onFirstFrameRender={startClock}
        accessible
        accessibilityLabel="Ellso"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Trắng như frame đầu/cuối của video và splash gốc
  container: { backgroundColor: '#FFFFFF', zIndex: 100 },
  video: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
});
