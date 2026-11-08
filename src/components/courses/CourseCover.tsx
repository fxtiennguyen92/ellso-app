import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Icon } from '@/components/Icon';
import { CHAPTER_COLOR_ORDER, chapterPalette } from '@/theme/tokens';

/** Màu nền (khi khoá chưa có ảnh bìa) — cố định theo id khoá để mỗi khoá một màu, lần nào mở cũng vậy. */
export const coursePalette = (id: number) => chapterPalette[CHAPTER_COLOR_ORDER[Math.abs(id) % CHAPTER_COLOR_ORDER.length]];

/**
 * Ảnh bìa khoá học (thẻ Khám phá, giỏ hàng…): ảnh từ CMS; chưa có ảnh → nền chuyển màu theo bảng màu chương
 * + vòng tròn, chấm và icon khoá học mờ (cùng ngôn ngữ với hero trang sách). Chiều cao do khung cha quyết định.
 */
export function CourseCover({ id, coverUrl, iconSize = 64 }: { id: number; coverUrl: string | null; iconSize?: number }) {
  const pal = coursePalette(id);
  const gid = `courseCover-${id}`;
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: pal.base }]}>
      {coverUrl ? (
        <Image source={{ uri: coverUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} accessibilityIgnoresInvertColors />
      ) : (
        <>
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} preserveAspectRatio="xMidYMid slice" viewBox="0 0 320 180">
            <Defs>
              <LinearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={pal.base} />
                <Stop offset="1" stopColor={pal.edge} />
              </LinearGradient>
            </Defs>
            <Rect width="320" height="180" fill={`url(#${gid})`} />
            {[46, 78, 112].map((r) => (
              <Circle key={r} cx={262} cy={40} r={r} stroke="#ffffff" strokeOpacity={0.12} strokeWidth={1.4} fill="none" />
            ))}
            {Array.from({ length: 24 }, (_, i) => (
              <Circle key={i} cx={22 + (i % 6) * 14} cy={118 + Math.floor(i / 6) * 14} r={1.6} fill="#ffffff" fillOpacity={0.22} />
            ))}
          </Svg>
          <View style={styles.icon} pointerEvents="none">
            <Icon name="courses" size={iconSize} strokeWidth={1.4} color="#ffffff" opacity={0.85} duotone />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  icon: { position: 'absolute', right: '14%', bottom: '18%', transform: [{ rotate: '-8deg' }] },
});
