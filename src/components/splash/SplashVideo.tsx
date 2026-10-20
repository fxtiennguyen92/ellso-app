import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';

import { SPLASH_VIDEO, type SplashVideoProps } from './SplashVideo.types';

/** iOS / Android: phát video splash bằng expo-video. */
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
    <VideoView
      player={player}
      style={StyleSheet.absoluteFill}
      contentFit="cover"
      nativeControls={false}
      accessible
      accessibilityLabel="Ellso"
    />
  );
}