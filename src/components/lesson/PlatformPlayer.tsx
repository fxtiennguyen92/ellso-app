import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';

import type { PlatformPlayerProps } from './PlatformPlayer.types';

/** iOS / Android: expo-video phát HLS, có điều khiển gốc (tua, toàn màn hình, PiP). */
export function PlatformPlayer({ url, seek, onTime, onError }: PlatformPlayerProps) {
  const player = useVideoPlayer({ uri: url }, (p) => {
    p.timeUpdateEventInterval = 1;
    p.play();
  });

  useEventListener(player, 'timeUpdate', ({ currentTime }) => onTime(currentTime, player.playing));
  useEventListener(player, 'statusChange', ({ status }) => {
    if (status === 'error') onError();
  });

  useEffect(() => {
    if (!seek) return;
    player.currentTime = seek.t;
    player.play();
  }, [seek, player]);

  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="contain" nativeControls allowsPictureInPicture />;
}
