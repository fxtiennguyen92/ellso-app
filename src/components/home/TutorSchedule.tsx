import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import { Icon } from '@/components/Icon';
import { useRevealStyle } from '@/components/splash/RevealContext';
import { formatSession, type TutorSession } from '@/data/home';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/typography';

import { SectionTitle } from './SectionTitle';

/** Cách gọi "tutor" trên app — đổi một chỗ này nếu chốt từ khác. */
export const TUTOR_LABEL = 'gia sư';
/** Bề rộng cột ngày — dùng chung cho thẻ vé và các dòng bên dưới để thẳng hàng. */
const DATE_COL_WIDTH = 84;
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function TutorSchedule({ sessions }: { sessions: TutorSession[] }) {
  const reveal = useRevealStyle(3);
  const [next, ...later] = sessions;

  return (
    <Animated.View style={[styles.section, reveal]}>
      <SectionTitle title={`Lịch gặp ${TUTOR_LABEL}`} subtitle="Buổi gặp trực tiếp sắp tới" action={{ label: 'Xem lịch' }} />
      {next && <TicketCard session={next} />}
      {later.map((s) => (
        <SessionRow key={s.id} session={s} />
      ))}
    </Animated.View>
  );
}

/** Buổi gần nhất: thẻ dạng vé. */
function TicketCard({ session }: { session: TutorSession }) {
  const { colors } = useTheme();
  const f = formatSession(session);

  return (
    <View
      accessible
      accessibilityLabel={`${session.title}. ${f.weekday} ngày ${f.day} ${f.month}, ${f.startTime} đến ${f.endTime}. ${f.countdown}. ${capitalize(TUTOR_LABEL)} ${session.tutor.name}`}
      style={[styles.ticket, { backgroundColor: colors.card, borderColor: colors.line, boxShadow: colors.shadowCard }]}
    >
      <View style={[styles.dateCol, { backgroundColor: colors.mint50 }]}>
        <Text style={[type.eyebrow, { color: colors.emerald700 }]}>{f.weekday}</Text>
        <Text style={[styles.bigDay, { color: colors.emerald800 }]}>{f.day}</Text>
        <Text style={[type.caption, { color: colors.emerald800 }]}>{f.month}</Text>
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
          <Icon name="clock" size={16} color={colors.emerald700} />
          <Text style={[styles.time, { color: colors.ink900 }]}>
            {f.startTime} – {f.endTime}
          </Text>
        </View>

        <Text style={[styles.sessionTitle, { color: colors.ink900 }]}>{session.title}</Text>

        <View style={styles.place}>
          <Icon name="pin" size={15} color={colors.ink600} />
          <Text style={[type.caption, { color: colors.ink600, flexShrink: 1 }]} numberOfLines={1}>
            {session.location}
            {session.room ? ` · ${session.room}` : ''}
          </Text>
        </View>

        {/* Gia sư: canh phải — tên rồi đến avatar */}
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
    </View>
  );
}

/** Các buổi sau: dòng gọn. */
function SessionRow({ session }: { session: TutorSession }) {
  const { colors } = useTheme();
  const f = formatSession(session);
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${session.title}, ${f.weekday} ngày ${f.day}, ${f.startTime} đến ${f.endTime}, ${TUTOR_LABEL} ${session.tutor.name}`}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.card, borderColor: colors.line, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <View style={styles.rowDate}>
        <Text style={[type.chip, { color: colors.ink600 }]}>{f.weekdayShort}</Text>
        <Text style={[styles.rowDay, { color: colors.ink900 }]}>{f.day}</Text>
      </View>
      <View style={[styles.rowDivider, { backgroundColor: colors.line }]} />
      <View style={styles.rowText}>
        <Text style={[type.label, { color: colors.ink900 }]} numberOfLines={1}>
          {session.title}
        </Text>
        <Text style={[type.caption, { color: colors.ink600 }]} numberOfLines={1}>
          {f.startTime} – {f.endTime} · {capitalize(TUTOR_LABEL)} {session.tutor.name}
        </Text>
      </View>
      <View style={styles.rowChevron}>
        <Icon name="chevronRight" size={18} color={colors.ink400} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { paddingTop: 28, paddingHorizontal: 16, gap: 12 },
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
  rowDate: { width: DATE_COL_WIDTH, alignItems: 'center', paddingVertical: 12 },
  rowDay: { fontFamily: fonts.display600, fontSize: 18, lineHeight: 24 },
  rowDivider: { width: 1, alignSelf: 'stretch' },
  rowText: { flex: 1, minWidth: 0, paddingVertical: 12, paddingLeft: 16, paddingRight: 8 },
  rowChevron: { paddingRight: 14 },
});