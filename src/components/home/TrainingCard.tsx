import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { initialsOf } from '@/data/auth';
import { dayMonth, feeParts, formatSession, type HomeTraining } from '@/data/home';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/typography';

/**
 * Thẻ chương trình huấn luyện (Home), màu chính emerald. Chương trình thường 6–8 buổi nên không vẽ từng buổi:
 * ô "Ngày bắt đầu" (thứ, ngày, giờ, đếm ngày) cạnh ô "Số buổi" (n buổi, đến ngày nào); dưới cùng địa điểm (trái)
 * và học phí chữ to (phải). Góc trên: badge "Đã đăng ký" hoặc "Hết chỗ" (chỉ khi có). Bấm → bottom sheet chi tiết.
 */
export function TrainingCard({ training, onPress }: { training: HomeTraining; onPress: () => void }) {
  const { colors } = useTheme();
  const t = training;
  const first = t.schedule[0] ?? { start: t.next.start, end: t.next.end, state: 'upcoming' as const };
  const last = t.schedule[t.schedule.length - 1];
  const total = t.sessionsCount || t.schedule.length;
  const started = first.state !== 'upcoming';
  const f = formatSession(first);
  const fee = feeParts(t.isFree, t.price);
  const trainer = t.trainer ?? 'Ellso';
  const full = !t.registered && t.seatsLeft === 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t.title}. Huấn luyện viên ${trainer}. Bắt đầu ${f.weekday} ${dayMonth(first.start)}, ${f.startTime}. ${total} buổi${last ? `, đến ${dayMonth(last.start)}` : ''}. ${fee.main}${fee.sub ? ` ${fee.sub}` : ''}.${t.registered ? ' Đã đăng ký.' : full ? ' Hết chỗ.' : ''} Xem chi tiết`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.line, boxShadow: colors.shadowCard, transform: [{ scale: pressed ? 0.985 : 1 }] },
      ]}
    >
      <Text style={[type.cardTitle, styles.title, { color: colors.ink900 }]} numberOfLines={2}>
        {t.title}
      </Text>

      <View style={styles.person}>
        <View style={[styles.avatar, { backgroundColor: colors.mint50, borderColor: colors.mint100 }]}>
          <Text style={[styles.avatarText, { color: colors.emerald700 }]}>{initialsOf(trainer)}</Text>
        </View>
        <Text style={[type.caption, { color: colors.ink600 }]} numberOfLines={1}>
          HLV <Text style={{ fontFamily: fonts.sans600, color: colors.ink900 }}>{trainer}</Text>
        </Text>
      </View>

      <View style={[styles.panel, { backgroundColor: colors.mint50 }]}>
        <View style={styles.cell}>
          <Text style={[type.eyebrow, styles.eyebrow, { color: colors.emerald700 }]}>Ngày bắt đầu</Text>
          <Text style={[styles.big, { color: colors.ink900 }]}>
            {f.weekday}, {dayMonth(first.start)}
          </Text>
          <Text style={[type.caption, { color: colors.ink600 }]}>
            {f.startTime} – {f.endTime}
          </Text>
          <Text style={[type.captionStrong, { color: started ? colors.ink600 : colors.emerald700 }]}>{started ? 'Đã khai giảng' : f.countdown}</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.mint100 }]} />
        <View style={[styles.cell, styles.cellCount]}>
          <Text style={[type.eyebrow, styles.eyebrow, { color: colors.emerald700 }]}>Số buổi</Text>
          <Text style={[styles.big, { color: colors.ink900 }]}>{total} buổi</Text>
          {last && total > 1 && <Text style={[type.caption, { color: colors.ink600 }]}>đến {dayMonth(last.start)}</Text>}
        </View>
      </View>

      <View style={styles.bottom}>
        <View style={styles.place}>
          <Icon name="pin" size={15} color={colors.ink600} />
          <Text style={[type.caption, styles.grow, { color: colors.ink600 }]} numberOfLines={2}>
            {t.next.place ?? 'Địa điểm sẽ thông báo'}
          </Text>
        </View>
        <View style={styles.fee}>
          <Text style={[styles.feeMain, { color: colors.emerald700 }]}>{fee.main}</Text>
          {fee.sub && <Text style={[styles.feeSub, { color: colors.ink600 }]}>{fee.sub}</Text>}
        </View>
      </View>

      {/* Badge góc trên: chỉ hiện khi đã đăng ký hoặc hết chỗ */}
      {t.registered ? (
        <View style={[styles.badge, { backgroundColor: colors.emerald700, borderColor: colors.card }]}>
          <Icon name="check" size={12} strokeWidth={3} color={colors.onEmerald} />
          <Text style={[type.chip, { color: colors.onEmerald }]}>Đã đăng ký</Text>
        </View>
      ) : full ? (
        <View style={[styles.badge, { backgroundColor: colors.dangerTint, borderColor: colors.dangerLine }]}>
          <Text style={[type.chip, { color: colors.danger }]}>Hết chỗ</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, borderWidth: 1, padding: 16, gap: 12 },
  title: { paddingRight: 72 }, // chừa chỗ badge góc
  grow: { flex: 1 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: -4 },
  avatar: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.sans700, fontSize: 10 },
  panel: { flexDirection: 'row', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14 },
  cell: { flex: 1.4, gap: 2 },
  cellCount: { flex: 1, paddingLeft: 14 },
  divider: { width: 1.5, borderRadius: 1 },
  eyebrow: { fontSize: 11, letterSpacing: 0.7 },
  big: { fontFamily: fonts.display600, fontSize: 17, lineHeight: 24 },
  bottom: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  place: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 4, paddingBottom: 2 },
  fee: { alignItems: 'flex-end' },
  feeMain: { fontFamily: fonts.display700, fontSize: 20, lineHeight: 26 },
  feeSub: { fontFamily: fonts.sans500, fontSize: 12, lineHeight: 16 },
  badge: {
    position: 'absolute',
    top: -11,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1.5,
  },
});
