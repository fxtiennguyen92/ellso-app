import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import type { VideoChapter } from '@/data/lesson';
import { useTheme } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';

import { PlatformPlayer } from './PlatformPlayer';

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export type VideoBlockData = { duration_seconds: number | null; caption?: string; chapters: VideoChapter[] };

/**
 * Video (bài học / tài liệu video): ảnh chờ + nút phát → `load()` xin link HLS có hạn (POST …/play) → phát. Mục lục bấm để tua.
 * `autoStart`: tải và phát ngay khi mở (trình xem tài liệu). `onWatch(giây)` báo số giây thực sự xem (không tính tua).
 */
export function VideoBlock({
  data,
  load,
  onWatch,
  autoStart = false,
}: {
  data: VideoBlockData;
  load: () => Promise<string>;
  onWatch?: (seconds: number) => void;
  autoStart?: boolean;
}) {
  const { colors } = useTheme();
  const [url, setUrl] = useState<string | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [seek, setSeek] = useState<{ t: number; n: number } | null>(null);
  const [now, setNow] = useState(0);
  const lastT = useRef<number | null>(null);

  const start = async (at?: number) => {
    if (url) {
      if (at !== undefined) setSeek((s) => ({ t: at, n: (s?.n ?? 0) + 1 }));
      return;
    }
    setState('loading');
    try {
      setUrl(await load());
      setState('idle');
      if (at) setSeek({ t: at, n: 1 });
    } catch {
      setState('error');
    }
  };

  const onTime = (t: number, playing: boolean) => {
    setNow(t);
    const prev = lastT.current;
    lastT.current = t;
    // Chỉ cộng khi đang phát và tiến đều (bỏ qua tua tới / lui)
    if (playing && prev !== null && t > prev && t - prev <= 2.5) onWatch?.(t - prev);
  };

  useEffect(() => {
    if (autoStart) start();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- chỉ một lần khi mở

  const chapters = data.chapters ?? [];
  const activeIdx = chapters.reduce((acc, c, i) => (now >= c.start ? i : acc), -1);

  return (
    <View style={styles.wrap}>
      <View style={styles.frame}>
        {url ? (
          <PlatformPlayer
            url={url}
            seek={seek}
            onTime={onTime}
            onError={() => {
              setUrl(null);
              setState('error');
            }}
          />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Phát video${data.duration_seconds ? `, dài ${mmss(data.duration_seconds)}` : ''}`}
            onPress={() => start()}
            style={styles.poster}
          >
            {state === 'loading' ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <View style={[styles.play, { backgroundColor: colors.emerald700, boxShadow: `0px 4px 0px ${colors.emeraldEdge}` }]}>
                <Icon name="play" size={26} color="#ffffff" fill="#ffffff" fillOpacity={1} />
              </View>
            )}
            {state === 'error' ? (
              <Text style={[type.caption, styles.posterText]}>Không phát được video. Bấm để thử lại.</Text>
            ) : data.duration_seconds ? (
              <View style={styles.duration}>
                <Text style={[type.chip, { color: '#ffffff' }]}>{mmss(data.duration_seconds)}</Text>
              </View>
            ) : null}
          </Pressable>
        )}
      </View>

      {data.caption?.trim() ? <Text style={[type.caption, styles.center, { color: colors.ink600 }]}>{data.caption}</Text> : null}

      {chapters.length > 0 && (
        <View style={[styles.chapters, { borderColor: colors.line }]}>
          {chapters.map((c, i) => {
            const active = url !== null && i === activeIdx;
            return (
              <Pressable
                key={i}
                accessibilityRole="button"
                accessibilityLabel={`Tua tới ${c.time}: ${c.title}`}
                onPress={() => start(c.start)}
                style={({ pressed }) => [
                  styles.chapter,
                  i > 0 && { borderTopWidth: 1, borderTopColor: colors.line },
                  (pressed || active) && { backgroundColor: colors.mint50 },
                ]}
              >
                <Text style={[type.captionStrong, styles.time, { color: colors.emerald700 }]}>{c.time}</Text>
                <Text style={[type.input, styles.grow, { color: colors.ink900 }]} numberOfLines={2}>
                  {c.title}
                </Text>
                <Icon name={active ? 'video' : 'playCircle'} size={18} color={active ? colors.emerald700 : colors.ink400} />
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  frame: { width: '100%', aspectRatio: 16 / 9, borderRadius: 18, overflow: 'hidden', backgroundColor: '#0d1714' },
  poster: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  play: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', paddingLeft: 4 },
  posterText: { color: '#e5efe9', textAlign: 'center', paddingHorizontal: 24 },
  duration: { position: 'absolute', right: 12, bottom: 12, paddingHorizontal: 8, height: 22, borderRadius: 6, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  center: { textAlign: 'center' },
  chapters: { borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  chapter: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 11 },
  time: { width: 44 },
  grow: { flex: 1, minWidth: 0 },
});
