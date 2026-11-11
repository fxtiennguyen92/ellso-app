import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

import { useTheme } from '@/theme/ThemeProvider';

import type { ReaderMessage } from './readerTypes';

/** Trình đọc (iOS / Android): trang /v1/reader của server trong WebView; tin nhắn ready / progress / end / error. */
export function BookReader({ url, onMessage }: { url: string; onMessage: (m: ReaderMessage) => void }) {
  const { colors, scheme } = useTheme();
  return (
    <WebView
      source={{ uri: `${url}&theme=${scheme}` }}
      style={[styles.web, { backgroundColor: colors.bg }]}
      originWhitelist={['*']}
      onMessage={(e) => {
        try {
          onMessage(JSON.parse(e.nativeEvent.data) as ReaderMessage);
        } catch {}
      }}
      onError={() => onMessage({ type: 'error', message: 'Không mở được sách. Thử lại sau.' })}
      allowsBackForwardNavigationGestures={false}
      setSupportMultipleWindows={false}
    />
  );
}

const styles = StyleSheet.create({ web: { flex: 1 } });
