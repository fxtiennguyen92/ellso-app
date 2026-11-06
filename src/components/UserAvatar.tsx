import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { fonts } from '@/theme/typography';

/**
 * Ảnh đại diện tròn: ảnh thật (user.avatar từ /me) nếu có, không thì chữ viết tắt trên nền màu.
 * Màu nền / chữ / viền do nơi dùng truyền vào (hero xanh, thẻ trắng…).
 */
export function UserAvatar({
  uri,
  initials,
  size,
  bg,
  fg,
  borderColor,
  borderWidth = 0,
}: {
  uri?: string | null;
  initials: string;
  size: number;
  bg: string;
  fg: string;
  borderColor?: string;
  borderWidth?: number;
}) {
  return (
    <View
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg, borderColor: borderColor ?? 'transparent', borderWidth },
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} accessibilityIgnoresInvertColors />
      ) : (
        <Text style={[styles.text, { color: fg, fontSize: Math.round(size * 0.34), lineHeight: Math.round(size * 0.44) }]}>{initials}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  text: { fontFamily: fonts.display600 },
});
