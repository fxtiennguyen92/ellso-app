import { StyleSheet, Text, View } from 'react-native';

import { UserAvatar } from '@/components/UserAvatar';
import { initialsOf } from '@/data/auth';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/typography';

/**
 * Người hướng dẫn (giáo viên / huấn luyện viên) ở mọi nơi: avatar + 2 dòng bên cạnh —
 * dòng trên "Người hướng dẫn", dòng dưới tên. KHÔNG ghi "HLV" / "Huấn luyện viên" trước tên.
 * `tone`: màu nền avatar chữ viết tắt (emerald cho chương trình huấn luyện, workshop cho workshop).
 */
export function InstructorTag({
  name,
  avatar,
  size = 34,
  tone = 'emerald',
  label = 'Người hướng dẫn',
}: {
  name: string;
  avatar?: string | null;
  size?: number;
  tone?: 'emerald' | 'workshop';
  label?: string;
}) {
  const { colors } = useTheme();
  const bg = tone === 'workshop' ? colors.workshopTint : colors.mint50;
  const fg = tone === 'workshop' ? colors.workshopText : colors.emerald700;
  const line = tone === 'workshop' ? colors.workshopLine : colors.mint100;
  return (
    <View style={styles.row} accessible accessibilityLabel={`${label}: ${name}`}>
      <UserAvatar uri={avatar} initials={initialsOf(name)} size={size} bg={bg} fg={fg} borderColor={line} borderWidth={1} />
      <View style={styles.text}>
        <Text style={[styles.label, { color: colors.ink600 }]} numberOfLines={1}>
          {label}
        </Text>
        <Text style={[styles.name, { color: colors.ink900 }]} numberOfLines={1}>
          {name}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  text: { flexShrink: 1, minWidth: 0 },
  label: { fontFamily: fonts.sans500, fontSize: 12, lineHeight: 16 },
  name: { fontFamily: fonts.sans600, fontSize: 14, lineHeight: 20 },
});
