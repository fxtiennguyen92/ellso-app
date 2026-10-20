import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

import { NATIVE_DRIVER } from '@/hooks/useLoop';

import { SplashVideo } from './SplashVideo';

/**
 * Logo trong video ghép xong ở giây 6,0 (xem claude/splash-animation-spec.md).
 * Splash không đóng trước mốc này (tính theo thời gian của video, nên máy chậm vẫn thấy đủ logo);
 * sau mốc này, app sẵn sàng lúc nào thì chuyển cảnh lúc đó.
 * Nếu app chưa xong, video chạy tiếp rồi đứng ở frame cuối (logo) cho đến khi xong.
 */
const LOGO_READY_AT = 6.2; // giây trong video
/** Dự phòng: video đã chạy nhưng bị khựng (mạng chậm…) thì tối đa chờ chừng này. */
const MAX_WAIT_MS = 10_500;
/** Sau chừng này mà video vẫn chưa chạy (chặn tự phát, tải chậm, lỗi) → bỏ qua video. */
const START_TIMEOUT_MS = 2500;

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
  const [exiting, setExiting] = useState(false);
  const started = useRef(false);
  const progress = useRef(new Animated.Value(0)).current;

  /** Video thật sự chạy → ẩn splash gốc (nền trắng, cùng màu frame đầu nên không nháy) và bắt đầu đếm. */
  const handlePlaying = useCallback(() => {
    if (started.current) return;
    started.current = true;
    SplashScreen.hide();
    setTimeout(() => setMinDone(true), MAX_WAIT_MS);
  }, []);

  /** Không phát được video → bỏ qua phần chờ, vào app ngay khi sẵn sàng. */
  const handleFail = useCallback((reason: string) => {
    if (__DEV__) console.log('[splash] bỏ qua video:', reason);
    started.current = true;
    SplashScreen.hide();
    setMinDone(true);
  }, []);

  const handleTime = useCallback((t: number) => {
    if (t >= LOGO_READY_AT) setMinDone(true);
  }, []);
  const handleEnd = useCallback(() => setMinDone(true), []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!started.current) handleFail('timeout');
    }, START_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [handleFail]);

  useEffect(() => {
    if (!ready || !minDone || exiting) return;
    setExiting(true);
    onExitStart();
    Animated.timing(progress, {
      toValue: 1,
      duration: 650,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: NATIVE_DRIVER,
    }).start(() => onFinish());
  }, [ready, minDone, exiting, onExitStart, onFinish, progress]);

  return (
    <Animated.View
      pointerEvents={exiting ? 'none' : 'auto'}
      style={[
        StyleSheet.absoluteFill,
        styles.container,
        {
          opacity: progress.interpolate({ inputRange: [0, 0.2, 1], outputRange: [1, 1, 0] }),
          transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }],
        },
      ]}
    >
      <SplashVideo onPlaying={handlePlaying} onTime={handleTime} onEnd={handleEnd} onFail={handleFail} stopped={exiting} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Trắng như frame đầu/cuối của video và splash gốc
  container: { backgroundColor: '#FFFFFF', zIndex: 100, overflow: 'hidden' },
});