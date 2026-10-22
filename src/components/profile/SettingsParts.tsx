import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { NATIVE_DRIVER } from '@/hooks/useLoop';
import { useTheme, type ThemeMode } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/typography';

/** Nhóm cài đặt: tiêu đề nhỏ viết hoa + khung thẻ chứa các dòng. */
export function SettingsGroup({ title, children }: { title: string; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.group}>
      <Text accessibilityRole="header" style={[styles.groupTitle, { color: colors.ink600 }]}>
        {title}
      </Text>
      <View style={[styles.box, { backgroundColor: colors.card, borderColor: colors.line }]}>{children}</View>
    </View>
  );
}

/** Ô icon vuông bo góc đầu mỗi dòng. */
export function RowIcon({ name, bg, fg }: { name: IconName; bg: string; fg: string }) {
  return (
    <View style={[styles.rowIcon, { backgroundColor: bg }]}>
      <Icon name={name} size={18} strokeWidth={1.9} color={fg} />
    </View>
  );
}

/** Dòng bấm được (mở trang con). */
export function SettingsRow({
  icon,
  label,
  value,
  first,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  value?: string;
  first?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      onPress={onPress}
      style={({ pressed, hovered }) => [
        styles.row,
        !first && { borderTopWidth: 1, borderTopColor: colors.line },
        (pressed || hovered) && { backgroundColor: colors.surfaceAlt },
      ]}
    >
      {icon}
      <Text style={[styles.label, { color: colors.ink900 }]} numberOfLines={1}>
        {label}
      </Text>
      {value ? <Text style={[styles.value, { color: colors.ink600 }]}>{value}</Text> : null}
      <Icon name="chevronRight" size={18} color={colors.ink400} />
    </Pressable>
  );
}

/** Công tắc bật/tắt (vẽ tay để giống thiết kế trên cả iOS, Android, web). */
export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  const { colors } = useTheme();
  const v = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: value ? 1 : 0, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE_DRIVER }).start();
  }, [value, v]);
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      hitSlop={6}
      style={[styles.track, { backgroundColor: value ? colors.emerald500 : colors.trackOff }]}
    >
      <Animated.View
        style={[styles.thumb, { transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }) }] }]}
      />
    </Pressable>
  );
}

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: IconName }[] = [
  { mode: 'light', label: 'Sáng', icon: 'sun' },
  { mode: 'dark', label: 'Tối', icon: 'moon' },
  { mode: 'system', label: 'Hệ thống', icon: 'phone' },
];

/** Chọn giao diện Sáng / Tối / Hệ thống — nối thẳng vào ThemeProvider. */
export function ThemeSegment() {
  const { colors, mode, setMode } = useTheme();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Giao diện" style={[styles.segment, { backgroundColor: colors.surfaceAlt }]}>
      {THEME_OPTIONS.map((o) => {
        const on = mode === o.mode;
        return (
          <Pressable
            key={o.mode}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            accessibilityLabel={o.label}
            onPress={() => setMode(o.mode)}
            style={[
              styles.segBtn,
              on && { backgroundColor: colors.card, boxShadow: '0px 1px 3px rgba(15,23,42,0.12)' },
            ]}
          >
            <Icon name={o.icon} size={16} color={on ? colors.ink900 : colors.ink600} />
            <Text style={[styles.segText, { color: on ? colors.ink900 : colors.ink600 }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export const settingsStyles = StyleSheet.create({
  rowStatic: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingVertical: 8, paddingHorizontal: 14 },
});

const styles = StyleSheet.create({
  group: { paddingTop: 24, paddingHorizontal: 16, gap: 10 },
  groupTitle: { paddingLeft: 4, fontFamily: fonts.sans600, fontSize: 13, lineHeight: 20, letterSpacing: 0.78, textTransform: 'uppercase' },
  box: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  rowIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingVertical: 8, paddingLeft: 14, paddingRight: 12 },
  label: { flex: 1, minWidth: 0, fontFamily: fonts.sans500, fontSize: 15, lineHeight: 22 },
  value: { fontFamily: fonts.sans400, fontSize: 13, lineHeight: 20 },
  track: { width: 52, height: 32, borderRadius: 16, padding: 3 },
  thumb: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#ffffff', boxShadow: '0px 1px 3px rgba(15,23,42,0.25)' },
  segment: { flexDirection: 'row', padding: 4, borderRadius: 14, gap: 4 },
  segBtn: { flex: 1, height: 44, borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  segText: { fontFamily: fonts.sans600, fontSize: 13, lineHeight: 20 },
});