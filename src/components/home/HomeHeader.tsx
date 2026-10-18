import { router } from 'expo-router';
import { Animated, type LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { useRevealStyle } from '@/components/splash/RevealContext';
import type { HomeData } from '@/data/home';
import { useLoop } from '@/hooks/useLoop';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/typography';

type Props = {
  student: HomeData['student'];
  /** Đã cuộn nội dung → hiện đường kẻ dưới. */
  scrolled: boolean;
  topInset: number;
  onLayout?: (e: LayoutChangeEvent) => void;
};

/** Header cố định: lời chào + chuông + thanh tìm kiếm. Nền = --bg, không nền màu. */
export function HomeHeader({ student, scrolled, topInset, onLayout }: Props) {
  const { colors, toggle } = useTheme();
  const reveal = useRevealStyle(0, 12);

  return (
    <Animated.View
      onLayout={onLayout}
      style={[
        styles.header,
        { paddingTop: topInset, backgroundColor: colors.bg, borderBottomColor: scrolled ? colors.line : 'transparent' },
        reveal,
      ]}
    >
      <View style={styles.row}>
        <Pressable
          onLongPress={toggle}
          accessibilityRole="button"
          accessibilityLabel={`Ảnh đại diện ${student.name}. Nhấn giữ để đổi giao diện sáng / tối`}
          style={[styles.avatar, { backgroundColor: colors.mint100 }]}
        >
          <Text style={[styles.avatarText, { color: colors.emerald800 }]}>{student.initials}</Text>
        </Pressable>

        <View style={styles.greeting}>
          <Text style={[type.caption, { color: colors.ink600 }]}>Xin chào,</Text>
          <Text style={[type.greetingName, { color: colors.ink900 }]} numberOfLines={1}>
            {student.name}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            student.unreadNotifications > 0 ? `Thông báo, có ${student.unreadNotifications} thông báo mới` : 'Thông báo'
          }
          style={({ pressed }) => [
            styles.bell,
            { backgroundColor: colors.card, borderColor: colors.line, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Icon name="bell" color={colors.ink900} />
          {student.unreadNotifications > 0 && <NotificationDot />}
        </Pressable>
      </View>

      {/* Chỉ là ô giả: bấm vào mở trang tìm kiếm riêng (/search) */}
      <Pressable
        accessibilityRole="search"
        accessibilityLabel="Tìm khoá học, bài học, tài liệu"
        accessibilityHint="Mở trang tìm kiếm"
        onPress={() => router.push('/search')}
        style={({ pressed, hovered }) => [
          styles.search,
          {
            backgroundColor: colors.card,
            borderColor: pressed || hovered ? colors.emerald700 : colors.line,
            boxShadow: colors.shadowCard,
            transform: [{ scale: pressed ? 0.99 : 1 }],
          },
        ]}
      >
        <Icon name="search" size={20} color={colors.ink600} />
        <Text style={[type.input, styles.placeholder, { color: colors.ink600 }]} numberOfLines={1}>
          Tìm khoá học, bài học, tài liệu…
        </Text>
        <View style={[styles.filter, { backgroundColor: colors.mint50 }]}>
          <Icon name="filter" size={18} color={colors.emerald700} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

function NotificationDot() {
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
      <View style={[styles.dotFill, { backgroundColor: colors.spark500, borderWidth: 2, borderColor: colors.card }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 24,
    borderBottomWidth: 1,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 9999, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.display600, fontSize: 16, lineHeight: 22 },
  greeting: { flex: 1, minWidth: 0 },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotWrap: { position: 'absolute', top: 9, right: 10, width: 9, height: 9 },
  dotFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 9999 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    paddingLeft: 16,
    paddingRight: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  placeholder: { flex: 1, minWidth: 0 },
  filter: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});