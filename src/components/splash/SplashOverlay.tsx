import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { NATIVE_DRIVER, useLoop } from '@/hooks/useLoop';

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
/** Video xong mà app chưa sẵn sàng sau chừng này → hiện 3 chấm chờ (tránh chớp lên rồi tắt ngay). */
const LOADER_DELAY_MS = 250;
/** Màu chấm chờ: emerald-500 trên nền trắng của splash (giữ nguyên ở cả hai chế độ, như video). */
const LOADER_COLOR = '#10b981';

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

  // Chấm chờ: chỉ hiện khi video đã xong (minDone) mà app chưa sẵn sàng
  const loaderOpacity = useRef(new Animated.Value(0)).current;
  const loaderShown = useRef(false);
  const [showLoader, setShowLoader] = useState(false);

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
    if (!minDone || ready) return;
    const t = setTimeout(() => {
      loaderShown.current = true;
      setShowLoader(true);
      Animated.timing(loaderOpacity, { toValue: 1, duration: 220, useNativeDriver: NATIVE_DRIVER }).start();
    }, LOADER_DELAY_MS);
    return () => clearTimeout(t);
  }, [minDone, ready, loaderOpacity]);

  useEffect(() => {
    if (!ready || !minDone || exiting) return;
    setExiting(true);

    const exit = () => {
      setShowLoader(false);
      onExitStart();
      Animated.timing(progress, {
        toValue: 1,
        duration: 650,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: NATIVE_DRIVER,
      }).start(() => onFinish());
    };

    // Chấm chờ đang hiện → tắt hẳn trước, rồi mới chạy hiệu ứng tắt video
    if (loaderShown.current) {
      loaderOpacity.stopAnimation();
      Animated.timing(loaderOpacity, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: NATIVE_DRIVER,
      }).start(() => setTimeout(exit, 80));
    } else {
      exit();
    }
  }, [ready, minDone, exiting, onExitStart, onFinish, progress, loaderOpacity]);

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

      {showLoader && (
        <Animated.View
          pointerEvents="none"
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel="Đang tải"
          style={[styles.loader, { opacity: loaderOpacity }]}
        >
          <LoadingDots />
        </Animated.View>
      )}
    </Animated.View>
  );
}

function Dot({ delay }: { delay: number }) {
  const v = useLoop(900, { delay });
  return (
    <Animated.View
      style={[
        styles.dot,
        {
          opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
          transform: [
            { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -7] }) },
            { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.1] }) },
          ],
        },
      ]}
    />
  );
}

/** 3 chấm nhún lần lượt. */
function LoadingDots() {
  return (
    <View style={styles.dots}>
      <Dot delay={0} />
      <Dot delay={150} />
      <Dot delay={300} />
    </View>
  );
}

const styles = StyleSheet.create({
  // Trắng như frame đầu/cuối của video và splash gốc
  container: { backgroundColor: '#FFFFFF', zIndex: 100, overflow: 'hidden' },
  // Dưới logo: khoảng 72% chiều cao màn hình
  loader: { position: 'absolute', left: 0, right: 0, top: '72%', alignItems: 'center' },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 24 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: LOADER_COLOR },
});