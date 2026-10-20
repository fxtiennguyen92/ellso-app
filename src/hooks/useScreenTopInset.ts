import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Khoảng trống phía trên header của các màn chính (giống Home).
 * Native: dưới status bar thật `extra` px · Web (không có status bar): `web` px.
 */
export function useScreenTopInset(extra = 28, web = 44) {
  const insets = useSafeAreaInsets();
  return Platform.OS === 'web' ? web : insets.top + extra;
}