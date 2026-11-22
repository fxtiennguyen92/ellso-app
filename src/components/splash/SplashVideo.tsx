import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { SPLASH_ASPECT, SPLASH_VIDEO, type SplashVideoProps } from './SplashVideo.types';

/**
 * iOS / Android: phát video splash bằng expo-video.
 * Video luôn rộng đúng 100% màn hình, cao theo tỉ lệ 9:16 của video (không méo, không cắt hai bên),
 * căn giữa theo chiều dọc. Màn hình cao hơn → dư nền trắng trên/dưới; thấp hơn → hụt trên/dưới.
 */
export function SplashVideo({ onPlaying, onTime, onEnd, onFail, stopped }: SplashVideoProps) {
  const player = useVideoPlayer(SPLASH_VIDEO, (p) => {
    p.muted = true;
    p.loop = false;
    p.timeUpdateEventInterval = 0.25;
    p.play();
  });

  useEventListener(player, 'playingChange', ({ isPlaying }) => {
    if (isPlaying) onPlaying();
  });
  useEventListener(player, 'statusChange', ({ status, error }) => {
    if (status === 'error') onFail(error?.message ?? 'error');
  });
  useEventListener(player, 'timeUpdate', ({ currentTime }) => onTime(currentTime));
  useEventListener(player, 'playToEnd', onEnd);

  useEffect(() => {
    if (stopped) player.pause();
  }, [stopped, player]);

  return (
    <View style={styles.frame} pointerEvents="none">
      <VideoView
        player={player}
        style={styles.video}
        contentFit="contain"
        nativeControls={false}
        accessible
        accessibilityLabel="Ellso"
      />
    </View>
  );
}
const styles = StyleSheet.create({
  frame: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, justifyContent: 'center', backgroundColor: '#FFFFFF' },
  video: { width: '100%', aspectRatio: SPLASH_ASPECT, backgroundColor: '#FFFFFF' },
});
