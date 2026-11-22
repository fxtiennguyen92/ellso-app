import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { Mascot, type MascotName } from '@/components/mascots/Mascot';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/typography';

/**
 * Ảnh đại diện tròn: mascot (user.avatarMascot — vẽ tại chỗ, chớp mắt / thỉnh thoảng cử động) > ảnh thật (user.avatar)
 * > chữ viết tắt trên nền màu. Mascot luôn trên nền mint nhạt (Thỏ màu trắng cần nền để nổi).
 * Màu nền / chữ / viền do nơi dùng truyền vào (hero xanh, thẻ trắng…).
 */
export function UserAvatar({
  uri,
  mascot,
  initials,
  size,
  bg,
  fg,
  borderColor,
  borderWidth = 0,
}: {
  uri?: string | null;
  mascot?: MascotName | null;
  initials: string;
  size: number;
  bg: string;
  fg: string;
  borderColor?: string;
  borderWidth?: number;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: mascot ? colors.mint50 : bg, borderColor: borderColor ?? 'transparent', borderWidth },
      ]}
    >
      {mascot ? (
        <Mascot name={mascot} size={size - borderWidth * 2} crop="face" motion="subtle" />
      ) : uri ? (
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
