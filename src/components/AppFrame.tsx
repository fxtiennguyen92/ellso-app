import type { ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { WEB_MAX_WIDTH } from '@/theme/tokens';

/**
 * Trên web: khung app rộng tối đa 440px (cỡ iPhone Pro Max), căn giữa màn hình.
 * Trên iOS/Android: chiếm toàn màn hình.
 */
export function AppFrame({ children }: { children: ReactNode }) {
  const { colors } = useTheme();

  if (Platform.OS !== 'web') {
    return <View style={[styles.fill, { backgroundColor: colors.bg }]}>{children}</View>;
  }

  return (
    <View style={[styles.fill, styles.center, { backgroundColor: colors.webBackdrop }]}>
      <View
        style={[
          styles.frame,
          { backgroundColor: colors.bg, borderColor: colors.line },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { alignItems: 'center' },
  frame: {
    flex: 1,
    width: '100%',
    maxWidth: WEB_MAX_WIDTH,
    overflow: 'hidden',
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
});
