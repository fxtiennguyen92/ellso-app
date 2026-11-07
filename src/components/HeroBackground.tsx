import { useState } from 'react';
import { Animated, type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useLoop } from '@/hooks/useLoop';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Nền hero emerald dùng chung (Home, Hồ sơ…): gradient chéo heroFrom → heroMid → heroTo, lưới chấm mảnh,
 * vòng tròn đồng tâm ở góc phải trên, quầng sáng heroGlow "thở" chậm (đứng yên khi giảm chuyển động).
 * Đặt làm lớp absoluteFill bên trong khối có nền heroMid (để có màu ngay cả trước khi đo xong kích thước).
 */
export function HeroBackground({ id, ringsY = 40, glow = true }: { id: string; ringsY?: number; glow?: boolean }) {
  const { colors, scheme } = useTheme();
  const breathe = useLoop(7000);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const gid = `${id}-${scheme}`; // id gradient riêng theo theme (web: tránh dùng lại def cũ khi đổi theme)

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      onLayout={(e: LayoutChangeEvent) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {size.w > 0 && (
        <>
          {/* 100%: luôn phủ kín khối cha kể cả khi khối cao thêm sau lần đo đầu (vd hero thêm dòng gói) */}
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id={`${gid}-bg`} x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={colors.heroFrom} />
                <Stop offset="0.55" stopColor={colors.heroMid} />
                <Stop offset="1" stopColor={colors.heroTo} />
              </LinearGradient>
              <Pattern id={`${gid}-dots`} width={18} height={18} patternUnits="userSpaceOnUse">
                <Circle cx={2} cy={2} r={1} fill={colors.heroLine} />
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill={`url(#${gid}-bg)`} />
            <Rect width="100%" height="100%" fill={`url(#${gid}-dots)`} />
            {[60, 110, 160, 210].map((r) => (
              <Circle key={r} cx={size.w - 24} cy={ringsY} r={r} stroke={colors.heroLine} strokeWidth={1.2} fill="none" />
            ))}
          </Svg>
          {glow && (
            <Animated.View
              style={[
                styles.glow,
                {
                  opacity: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] }),
                  transform: [
                    { translateX: breathe.interpolate({ inputRange: [0, 1], outputRange: [0, -18] }) },
                    { scale: breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) },
                  ],
                },
              ]}
            >
              <Svg width={280} height={280}>
                <Defs>
                  <RadialGradient id={`${gid}-glow`} cx="50%" cy="50%" r="50%">
                    <Stop offset="0" stopColor={colors.heroGlow} stopOpacity={0.55} />
                    <Stop offset="1" stopColor={colors.heroGlow} stopOpacity={0} />
                  </RadialGradient>
                </Defs>
                <Rect width={280} height={280} fill={`url(#${gid}-glow)`} />
              </Svg>
            </Animated.View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  glow: { position: 'absolute', top: -120, right: -90 },
});
