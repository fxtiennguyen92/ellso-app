import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import { Icon } from '@/components/Icon';
import { formatSession, type TutorSession } from '@/data/home';
import { useTheme } from '@/theme/ThemeProvider';
import type { ColorTokens } from '@/theme/tokens';
import { fonts, type } from '@/theme/typography';


/** Cách gọi "tutor" trên app — đổi một chỗ này nếu chốt từ khác. */
export const TUTOR_LABEL = 'gia sư';
/** Bề rộng cột ngày — dùng chung cho thẻ vé và các dòng bên dưới để thẳng hàng. */
const DATE_COL_WIDTH = 84;
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Thẻ lịch dùng chung (Home: Lịch huấn luyện, Lịch Workshop).
 * Màu nhấn theo loại lịch, để nhìn lướt là phân biệt: violet = huấn luyện · orange = workshop · emerald = lịch hẹn.
 */
export type SessionAccent = 'emerald' | 'violet' | 'orange';
const accentColors = (a: SessionAccent, c: ColorTokens) =>
  a === 'violet'
    ? { tint: c.violetTint, strong: c.violetText, deep: c.violetText }
    : a === 'orange'
      ? { tint: c.workshopTint, strong: c.workshopText, deep: c.workshopDeep }
      : { tint: c.mint50, strong: c.emerald700, deep: c.emerald800 };

/** Thông tin phụ của thẻ vé: chip trạng thái (Đã đăng ký, Miễn phí…), biểu tượng địa điểm, nhãn người hướng dẫn. */
type TicketExtra = {
  accent?: SessionAccent;
  placeIcon?: 'pin' | 'video';
  personLabel?: string;
  chips?: { label: string; tone?: 'accent' | 'neutral' }[];
  onPress?: () => void;
};

/** Thẻ dạng vé cho buổi gần nhất (Lịch hẹn · Lịch huấn luyện). */
export function TicketCard({
  session,
  accent = 'emerald',
  placeIcon = 'pin',
  personLabel = capitalize(TUTOR_LABEL),
  chips = [],
  onPress,
}: { session: TutorSession } & TicketExtra) {
  const { colors } = useTheme();
  const f = formatSession(session);
  const a = accentColors(accent, colors);

  return (
    <Pressable
      accessibilityRole={onPress ? 'link' : undefined}
      onPress={onPress}
      accessibilityLabel={`${session.title}. ${f.weekday} ngày ${f.day} ${f.month}, ${f.startTime} đến ${f.endTime}. ${f.countdown}. ${session.location}. ${personLabel} ${session.tutor.name}. ${chips.map((c) => c.label).join('. ')}`}
      style={({ pressed }) => [
        styles.ticket,
        { backgroundColor: colors.card, borderColor: colors.line, boxShadow: colors.shadowCard, opacity: pressed && onPress ? 0.85 : 1 },
      ]}
    >
      <View style={[styles.dateCol, { backgroundColor: a.tint }]}>
        <Text style={[type.eyebrow, { color: a.strong }]}>{f.weekday}</Text>
        <Text style={[styles.bigDay, { color: a.deep }]}>{f.day}</Text>
        <Text style={[type.caption, { color: a.deep }]}>{f.month}</Text>
      </View>

      {/* Đường xé vé: nét đứt + 2 khía bán nguyệt */}
      <View style={styles.perforation}>
        <Svg width={2} height="100%" style={StyleSheet.absoluteFill}>
          <Line x1="1" y1="0" x2="1" y2="100%" stroke={colors.line} strokeWidth={1.5} strokeDasharray="4 4" />
        </Svg>
        <View style={[styles.notchClip, { top: -1 }]}>
          <View style={[styles.notch, { top: -8, backgroundColor: colors.bg, borderColor: colors.line }]} />
        </View>
        <View style={[styles.notchClip, { bottom: -1 }]}>
          <View style={[styles.notch, { top: 0, backgroundColor: colors.bg, borderColor: colors.line }]} />
        </View>
      </View>

      <View style={styles.ticketBody}>
        <View style={styles.timeRow}>
          <Icon name="clock" size={16} color={a.strong} />
          <Text style={[styles.time, { color: colors.ink900 }]}>
            {f.startTime} – {f.endTime}
          </Text>
        </View>

        <Text style={[styles.sessionTitle, { color: colors.ink900 }]}>{session.title}</Text>

        <View style={styles.place}>
          <Icon name={placeIcon} size={15} color={colors.ink600} />
          <Text style={[type.caption, { color: colors.ink600, flexShrink: 1 }]} numberOfLines={1}>
            {session.location}
            {session.room ? ` · ${session.room}` : ''}
          </Text>
        </View>

        {chips.length > 0 && (
          <View style={styles.chips}>
            {chips.map((c) => (
              <View key={c.label} style={[styles.chip, { backgroundColor: c.tone === 'accent' ? a.tint : colors.chipNeutral }]}>
                <Text style={[styles.chipText, { color: c.tone === 'accent' ? a.strong : colors.ink600 }]} numberOfLines={1}>
                  {c.label}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Người hướng dẫn: canh phải — tên rồi đến avatar */}
        <View style={styles.tutor}>
          <Text style={[styles.tutorName, { color: colors.ink900 }]} numberOfLines={1}>
            {session.tutor.name}
          </Text>
          <View style={[styles.tutorAvatar, { backgroundColor: colors.violetTint, borderColor: colors.violetLine }]}>
            <Text style={[styles.tutorInitials, { color: colors.violetText }]}>{session.tutor.initials}</Text>
          </View>
        </View>
      </View>

      {/* Badge đếm ngày: đè lên mép trên, góc phải */}
      <View style={[styles.countdown, { backgroundColor: colors.amberChip, borderColor: colors.amberChipLine }]}>
        <Text style={[styles.countdownText, { color: colors.amberChipText }]}>{f.countdown}</Text>
      </View>
    </Pressable>
  );
}

/** Các buổi sau: dòng gọn (cột ngày cùng bề rộng và màu nhấn với thẻ vé). */
export function SessionRow({
  session,
  accent = 'emerald',
  personLabel = capitalize(TUTOR_LABEL),
  onPress,
}: {
  session: TutorSession;
  accent?: SessionAccent;
  personLabel?: string;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const f = formatSession(session);
  const a = accentColors(accent, colors);
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${session.title}, ${f.weekday} ngày ${f.day}, ${f.startTime} đến ${f.endTime}, ${personLabel} ${session.tutor.name}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { backgroundColor: colors.card, borderColor: colors.line, opacity: pressed ? 0.8 : 1 }]}
    >
      <View style={[styles.rowDate, { backgroundColor: a.tint }]}>
        <Text style={[type.chip, { color: a.strong }]}>{f.weekdayShort}</Text>
        <Text style={[styles.rowDay, { color: a.deep }]}>{f.day}</Text>
      </View>
      <View style={styles.rowText}>
        <Text style={[type.label, { color: colors.ink900 }]} numberOfLines={1}>
          {session.title}
        </Text>
        <Text style={[type.caption, { color: colors.ink600 }]} numberOfLines={1}>
          {f.startTime} – {f.endTime}
          {session.room ? ` · ${session.room}` : ''} · {session.tutor.name}
        </Text>
      </View>
      <View style={styles.rowChevron}>
        <Icon name="chevronRight" size={18} color={colors.ink400} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ticket: { flexDirection: 'row', borderRadius: 22, borderWidth: 1, marginTop: 4 },
  dateCol: {
    width: DATE_COL_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderTopLeftRadius: 21,
    borderBottomLeftRadius: 21,
  },
  bigDay: { fontFamily: fonts.display600, fontSize: 34, lineHeight: 42 },
  perforation: { width: 2, marginLeft: -1, alignSelf: 'stretch', overflow: 'visible' },
  notchClip: { position: 'absolute', left: -7, width: 16, height: 9, overflow: 'hidden' },
  notch: { position: 'absolute', left: 0, width: 16, height: 16, borderRadius: 9999, borderWidth: 1 },
  ticketBody: { flex: 1, minWidth: 0, padding: 16, gap: 8 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  time: { fontFamily: fonts.display600, fontSize: 15, lineHeight: 22 },
  countdown: {
    position: 'absolute',
    top: -11,
    right: 14,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 9999,
    borderWidth: 1,
  },
  countdownText: { fontFamily: fonts.sans400, fontSize: 12, lineHeight: 16 },
  sessionTitle: { fontFamily: fonts.display600, fontSize: 16, lineHeight: 22 },
  place: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 9999 },
  chipText: { fontFamily: fonts.sans600, fontSize: 11, lineHeight: 16 },
  tutor: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 2 },
  tutorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 9999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tutorInitials: { fontFamily: fonts.display600, fontSize: 11, lineHeight: 14 },
  tutorName: { fontFamily: fonts.sans600, fontSize: 13, lineHeight: 18, flexShrink: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
  },
  rowDate: {
    width: DATE_COL_WIDTH,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopLeftRadius: 17,
    borderBottomLeftRadius: 17,
  },
  rowDay: { fontFamily: fonts.display600, fontSize: 18, lineHeight: 24 },
  rowText: { flex: 1, minWidth: 0, paddingVertical: 12, paddingLeft: 16, paddingRight: 8 },
  rowChevron: { paddingRight: 14 },
});