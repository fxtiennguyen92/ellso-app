import { router } from 'expo-router';
import { Animated, type LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';

import { HeroBackground } from '@/components/HeroBackground';
import { Icon } from '@/components/Icon';
import { UserAvatar } from '@/components/UserAvatar';
import { useRevealStyle } from '@/components/splash/RevealContext';
import { DEFAULT_TAGLINE } from '@/data/home';
import { useLoop } from '@/hooks/useLoop';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/typography';

type Props = {
  student: { name: string; initials: string; avatar?: string | null; unreadNotifications: number };
  /** Câu chào cạnh ngày (CMS); null → DEFAULT_TAGLINE. */
  tagline?: string | null;
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

export function HomeHeader({ student, tagline, scrolled, topInset, onHeroHeight }: Props) {
  const { colors, toggle } = useTheme();
  const reveal = useRevealStyle(0, 12);

  return (
    // Lớp phủ trên cùng: hero + ô tìm kiếm; nội dung trang cuộn bên dưới (trượt vào dưới hero và ô tìm kiếm),
    // không còn dải nền / đường kẻ ngăn giữa ô tìm kiếm và nội dung. box-none: chỗ trống hai bên ô tìm kiếm vẫn chạm được nội dung.
    <Animated.View pointerEvents="box-none" style={[styles.header, reveal]}>
      <View
        style={[styles.hero, { paddingTop: topInset, backgroundColor: colors.heroMid }]}
        onLayout={(e: LayoutChangeEvent) => onHeroHeight?.(e.nativeEvent.layout.height)}
      >
        <HeroBackground id="home-hero" ringsY={topInset + 4} />

        <View style={styles.row}>
          <Pressable
            onLongPress={toggle}
            accessibilityRole="button"
            accessibilityLabel={`Ảnh đại diện ${student.name}. Nhấn giữ để đổi giao diện sáng / tối`}
          >
            <UserAvatar uri={student.avatar} initials={student.initials} size={48} bg={colors.heroGlass} fg={colors.heroOn} borderColor={colors.heroGlassLine} borderWidth={1.5} />
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
            {tagline || DEFAULT_TAGLINE}
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
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
