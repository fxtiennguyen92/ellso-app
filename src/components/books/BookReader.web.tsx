import { useEffect } from 'react';
import { View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

import type { ReaderMessage } from './readerTypes';

/** Trình đọc (web): trang /v1/reader của server trong iframe; nghe postMessage {ellsoReader: …}. */
export function BookReader({ url, onMessage }: { url: string; onMessage: (m: ReaderMessage) => void }) {
  const { colors, scheme } = useTheme();
  useEffect(() => {
    const on = (e: MessageEvent) => {
      const m = (e.data as { ellsoReader?: ReaderMessage } | null)?.ellsoReader;
      if (m) onMessage(m);
    };
    window.addEventListener('message', on);
    return () => window.removeEventListener('message', on);
  }, [onMessage]);
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <iframe title="Trình đọc sách" src={`${url}&theme=${scheme}`} style={{ flex: 1, width: '100%', height: '100%', border: 0, background: colors.bg }} />
    </View>
  );
}
