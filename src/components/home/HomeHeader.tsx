import { router } from 'expo-router';
import { useState } from 'react';
import { Animated, type LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';

import { Icon } from '@/components/Icon';
import { useRevealStyle } from '@/components/splash/RevealContext';
import { useLoop } from '@/hooks/useLoop';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/typography';

type Props = {
  student: { name: string; initials: string; unreadNotifications: number };
  /** Đã cuộn nội dung → ô tìm kiếm đổ bóng đậm hơn (nội dung trượt bên dưới). */
  scrolled: boolean;
  topInset: number;
  /** Chiều cao hero (để màn Home đặt khoảng đầu nội dung + vị trí chỉ báo làm mới). */
  onHeroHeight?: (h: number) => void;
};

const WEEKDAYS = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
const todayLabel = (d = new Date()) => `${WEEKDAYS[d.getDay()]}, ${d.getDate()} tháng ${d.getMonth() + 1}`;

/**
 * Header Home (cố định, không cuộn): hero emerald nhiều sắc độ + ô tìm kiếm nổi đè lên mép dưới hero.
 * - Nền hero vẽ bằng SVG: gradient chéo heroFrom → heroMid → heroTo, quầng sáng heroGlow (thở chậm),
 *   các vòng tròn đồng tâm + lưới chấm mảnh để có chiều sâu; bo 32 ở 2 góc dưới.
 * - Chữ trắng, avatar + chuông dạng kính mờ (heroGlass). Nhấn giữ avatar để đổi sáng / tối.
 * - Lớp phủ: nội dung trang cuộn bên dưới, trượt vào dưới hero / ô tìm kiếm (kéo xuống để làm mới).
 */
export const SEARCH_HEIGHT = 54;

export function HomeHeader({ student, scrolled, topInset, onHeroHeight }: Props) {
  const { colors, toggle, scheme } = useTheme();
  const reveal = useRevealStyle(0, 12);
  const glow = useLoop(7000);
  const [hero, setHero] = useState({ w: 0, h: 0 });
  const gid = `hero-${scheme}`; // id gradient riêng theo theme (web: tránh dùng lại def cũ khi đổi theme)

  return (
    // Lớp phủ trên cùng: hero + ô tìm kiếm; nội dung trang cuộn bên dưới (trượt vào dưới hero và ô tìm kiếm),
    // không còn dải nền / đường kẻ ngăn giữa ô tìm kiếm và nội dung. box-none: chỗ trống hai bên ô tìm kiếm vẫn chạm được nội dung.
    <Animated.View pointerEvents="box-none" style={[styles.header, reveal]}>
      <View
        style={[styles.hero, { paddingTop: topInset, backgroundColor: colors.heroMid }]}
        onLayout={(e: LayoutChangeEvent) => {
          setHero({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });
          onHeroHeight?.(e.nativeEvent.layout.height);
        }}
      >
        {hero.w > 0 && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Svg width={hero.w} height={hero.h}>
              <Defs>
                <LinearGradient id={`${gid}-bg`} x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor={colors.heroFrom} />
                  <Stop offset="0.55" stopColor={colors.heroMid} />
                  <Stop offset="1" stopColor={colors.heroTo} />
                </LinearGradient>
                <RadialGradient id={`${gid}-glow`} cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor={colors.heroGlow} stopOpacity={0.55} />
                  <Stop offset="1" stopColor={colors.heroGlow} stopOpacity={0} />
                </RadialGradient>
                <Pattern id={`${gid}-dots`} width={18} height={18} patternUnits="userSpaceOnUse">
                  <Circle cx={2} cy={2} r={1} fill={colors.heroLine} />
                </Pattern>
              </Defs>
              <Rect width={hero.w} height={hero.h} fill={`url(#${gid}-bg)`} />
              <Rect width={hero.w} height={hero.h} fill={`url(#${gid}-dots)`} />
              {/* Vòng tròn đồng tâm góc phải */}
              {[60, 110, 160, 210].map((r) => (
                <Circle key={r} cx={hero.w - 24} cy={topInset + 4} r={r} stroke={colors.heroLine} strokeWidth={1.2} fill="none" />
              ))}
            </Svg>
            {/* Quầng sáng thở chậm (đứng yên khi giảm chuyển động) */}
            <Animated.View
              style={[
                styles.glow,
                {
                  opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] }),
                  transform: [
                    { translateX: glow.interpolate({ inputRange: [0, 1], outputRange: [0, -18] }) },
                    { scale: glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) },
                  ],
                },
              ]}
            >
              <Svg width={280} height={280}>
                <Rect width={280} height={280} fill={`url(#${gid}-glow)`} />
              </Svg>
            </Animated.View>
          </View>
        )}

        <View style={styles.row}>
          <Pressable
            onLongPress={toggle}
            accessibilityRole="button"
            accessibilityLabel={`Ảnh đại diện ${student.name}. Nhấn giữ để đổi giao diện sáng / tối`}
            style={[styles.avatar, { backgroundColor: colors.heroGlass, borderColor: colors.heroGlassLine }]}
          >
            <Text style={[styles.avatarText, { color: colors.heroOn }]}>{student.initials}</Text>
          </Pressable>

          <View style={styles.greeting}>
            <Text style={[type.caption, { color: colors.heroOnMuted }]}>Xin chào,</Text>
            <Text style={[type.greetingName, { color: colors.heroOn }]} numberOfLines={1}>
              {student.name}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={student.unreadNotifications > 0 ? `Thông báo, có ${student.unreadNotifications} thông báo mới` : 'Thông báo'}
            style={({ pressed }) => [styles.bell, { backgroundColor: colors.heroGlass, borderColor: colors.heroGlassLine, opacity: pressed ? 0.75 : 1 }]}
          >
            <Icon name="bell" color={colors.heroOn} />
            {student.unreadNotifications > 0 && <NotificationDot ring={colors.heroMid} />}
          </Pressable>
        </View>

        <View style={styles.tagline}>
          <View style={[styles.todayPill, { backgroundColor: colors.heroGlass, borderColor: colors.heroGlassLine }]}>
            <Icon name="clock" size={13} color={colors.heroOnMuted} />
            <Text style={[styles.todayText, { color: colors.heroOn }]}>{todayLabel()}</Text>
          </View>
          <Text style={[styles.slogan, { color: colors.heroOnMuted }]} numberOfLines={1}>
            Hôm nay học gì cùng Ellso?
          </Text>
        </View>
      </View>

      {/* Ô tìm kiếm nổi đè mép dưới hero. Chỉ là ô giả: bấm vào mở trang tìm kiếm riêng (/search) */}
      <Pressable
        accessibilityRole="search"
        accessibilityLabel="Tìm khoá học, bài học, tài liệu"
        accessibilityHint="Mở trang tìm kiếm"
        onPress={() => router.push('/search')}
        style={({ pressed, hovered }) => [
          styles.search,
          {
            backgroundColor: colors.card,
            borderColor: pressed || hovered ? colors.emerald500 : colors.line,
            boxShadow: scrolled ? colors.navShadow : colors.shadowCard,
            transform: [{ scale: pressed ? 0.99 : 1 }],
          },
        ]}
      >
        <Icon name="search" size={20} color={colors.emerald700} />
        <Text style={[type.input, styles.placeholder, { color: colors.ink600 }]} numberOfLines={1}>
          Tìm khoá học, bài học, tài liệu…
        </Text>
        <View style={[styles.filter, { backgroundColor: colors.emerald700 }]}>
          <Icon name="filter" size={18} color={colors.onEmerald} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

function NotificationDot({ ring }: { ring: string }) {
  const { colors } = useTheme();
  const ping = useLoop(1800, { kind: 'forward' });
  return (
    <View pointerEvents="none" style={styles.dotWrap}>
      <Animated.View
        style={[
          styles.dotFill,
          {
            backgroundColor: colors.spark500,
            opacity: ping.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
            transform: [{ scale: ping.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] }) }],
          },
        ]}
      />
      <View style={[styles.dotFill, { backgroundColor: colors.spark500, borderWidth: 2, borderColor: ring }]} />
    </View>
  );
}

const SEARCH_H = SEARCH_HEIGHT;

const styles = StyleSheet.create({
  header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  hero: {
    paddingHorizontal: 16,
    paddingBottom: SEARCH_H / 2 + 22,
    gap: 18,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  glow: { position: 'absolute', top: -120, right: -90 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 9999, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.display600, fontSize: 16, lineHeight: 22 },
  greeting: { flex: 1, minWidth: 0 },
  bell: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dotWrap: { position: 'absolute', top: 9, right: 10, width: 9, height: 9 },
  dotFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 9999 },
  tagline: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  todayPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9999, borderWidth: 1 },
  todayText: { fontFamily: fonts.sans600, fontSize: 12, lineHeight: 16 },
  slogan: { flex: 1, fontFamily: fonts.sans500, fontSize: 13, lineHeight: 18 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: SEARCH_H,
    marginTop: -SEARCH_H / 2,
    marginHorizontal: 16,
    paddingLeft: 16,
    paddingRight: 8,
    borderRadius: 18,
    borderWidth: 1,
  },
  placeholder: { flex: 1, minWidth: 0 },
  filter: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
