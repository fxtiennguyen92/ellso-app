import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { initialsOf } from '@/data/auth';
import { dayMonth, feeLabel, formatSession, type HomeTraining, type TrainingSlot } from '@/data/home';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/typography';

/** Từ bao nhiêu buổi trở lên thì dải buổi cuộn ngang (mỗi buổi rộng cố định). */
const STRIP_SCROLL_FROM = 7;
const SLOT_W = 48;

/**
 * Dải buổi học: mỗi buổi một chấm đánh số + ngày, nối bằng đường kẻ.
 * Đã qua = chấm đặc có dấu tích · buổi sắp tới gần nhất = vòng to, nổi bật · còn lại = vòng viền.
 */
export function SessionStrip({ slots, nextNumber }: { slots: TrainingSlot[]; nextNumber: number }) {
  const { colors } = useTheme();
  const scroll = slots.length >= STRIP_SCROLL_FROM;

  const items = slots.map((s) => {
    const done = s.state === 'past';
    const next = s.number === nextNumber;
    return (
      <View key={s.number} style={[styles.slot, scroll ? { width: SLOT_W } : styles.slotFlex]}>
        <View
          style={[
            styles.dot,
            next && styles.dotNext,
            done
              ? { backgroundColor: colors.violetSolid, borderColor: colors.violetSolid }
              : next
                ? { backgroundColor: colors.violetSolid, borderColor: colors.violetTrack, boxShadow: `0px 0px 0px 4px ${colors.violetTint}` }
                : { backgroundColor: colors.card, borderColor: colors.violetTrack },
          ]}
        >
          {done ? (
            <Icon name="check" size={12} strokeWidth={3} color={colors.violetOn} />
          ) : (
            <Text style={[styles.dotNum, { color: next ? colors.violetOn : colors.violetText }]}>{s.number}</Text>
          )}
        </View>
        <Text style={[styles.slotDate, { color: next ? colors.violetText : colors.ink600 }, next && styles.slotDateNext]}>{dayMonth(s.start)}</Text>
      </View>
    );
  });

  const line = (
    <View
      pointerEvents="none"
      style={[
        styles.line,
        { backgroundColor: colors.violetTrack },
        scroll ? { left: SLOT_W / 2, width: SLOT_W * (slots.length - 1) } : { left: `${50 / slots.length}%`, right: `${50 / slots.length}%` },
      ]}
    />
  );

  return scroll ? (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.strip}>
        {line}
        {items}
      </View>
    </ScrollView>
  ) : (
    <View style={styles.strip}>
      {line}
      {items}
    </View>
  );
}

/**
 * Thẻ chương trình huấn luyện (Home). Nổi bật số buổi + dải ngày từng buổi để người dùng thấy ngay độ dài khoá;
 * dưới cùng là buổi kế tiếp (giờ, địa điểm) và phí / chỗ. Bấm → bottom sheet chi tiết.
 */
export function TrainingCard({ training, onPress }: { training: HomeTraining; onPress: () => void }) {
  const { colors } = useTheme();
  const t = training;
  const f = formatSession(t.next);
  const total = t.sessionsCount || t.schedule.length;
  const first = t.schedule[0];
  const last = t.schedule[t.schedule.length - 1];
  const trainer = t.trainer ?? 'Ellso';

  const chips = [
    ...(t.registered ? [{ label: 'Đã đăng ký', accent: true }] : []),
    { label: feeLabel(t.isFree, t.price), accent: false },
    ...(!t.registered && t.seatsLeft !== null ? [{ label: t.seatsLeft > 0 ? `Còn ${t.seatsLeft} chỗ` : 'Hết chỗ', accent: false }] : []),
  ];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t.title}. Chương trình ${total} buổi${first && last ? `, từ ${dayMonth(first.start)} đến ${dayMonth(last.start)}` : ''}. Buổi ${t.next.number} tiếp theo: ${f.weekday} ${f.day} ${f.month}, ${f.startTime} đến ${f.endTime}. ${chips.map((c) => c.label).join('. ')}. Xem chi tiết`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.line, boxShadow: colors.shadowCard, transform: [{ scale: pressed ? 0.985 : 1 }] },
      ]}
    >
      {/* Số buổi + khoảng ngày */}
      <View style={styles.topRow}>
        <View style={[styles.countBadge, { backgroundColor: colors.violetSolid }]}>
          <Icon name="layers" size={14} strokeWidth={2.2} color={colors.violetOn} />
          <Text style={[styles.countText, { color: colors.violetOn }]}>{total} buổi</Text>
        </View>
        {first && last && total > 1 && (
          <Text style={[type.captionStrong, { color: colors.ink600 }]}>
            {dayMonth(first.start)} → {dayMonth(last.start)}
          </Text>
        )}
        <View style={styles.grow} />
        <View style={[styles.countdown, { backgroundColor: colors.amberChip, borderColor: colors.amberChipLine }]}>
          <Text style={[type.chip, { color: colors.amberChipText }]}>{f.countdown}</Text>
        </View>
      </View>

      <View style={styles.titleRow}>
        <Text style={[type.cardTitle, styles.grow, { color: colors.ink900 }]} numberOfLines={2}>
          {t.title}
        </Text>
        <Icon name="chevronRight" size={20} color={colors.ink400} />
      </View>

      <View style={styles.person}>
        <View style={[styles.avatar, { backgroundColor: colors.violetTint, borderColor: colors.violetLine }]}>
          <Text style={[styles.avatarText, { color: colors.violetText }]}>{initialsOf(trainer)}</Text>
        </View>
        <Text style={[type.caption, { color: colors.ink600 }]} numberOfLines={1}>
          HLV <Text style={{ fontFamily: fonts.sans600, color: colors.ink900 }}>{trainer}</Text>
        </Text>
      </View>

      {t.schedule.length > 1 && <SessionStrip slots={t.schedule} nextNumber={t.next.number} />}

      {/* Buổi kế tiếp */}
      <View style={[styles.nextBox, { backgroundColor: colors.violetTint }]}>
        <Text style={[type.eyebrow, { color: colors.violetText }]}>Buổi {t.next.number} · tiếp theo</Text>
        <View style={styles.nextRow}>
          <Icon name="clock" size={15} color={colors.violetText} />
          <Text style={[type.label, { color: colors.ink900 }]}>
            {f.weekday}, {dayMonth(t.next.start)} · {f.startTime} – {f.endTime}
          </Text>
        </View>
        <View style={styles.nextRow}>
          <Icon name="pin" size={15} color={colors.ink600} />
          <Text style={[type.caption, styles.grow, { color: colors.ink600 }]} numberOfLines={1}>
            {t.next.place ?? 'Địa điểm sẽ thông báo'}
          </Text>
        </View>
      </View>

      <View style={styles.chips}>
        {chips.map((c) => (
          <View key={c.label} style={[styles.chip, { backgroundColor: c.accent ? colors.violetTint : colors.chipNeutral }]}>
            {c.accent && <Icon name="check" size={12} strokeWidth={3} color={colors.violetText} />}
            <Text style={[type.chip, { color: c.accent ? colors.violetText : colors.ink600 }]}>{c.label}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, borderWidth: 1, padding: 16, gap: 12 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  grow: { flex: 1 },
  countBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9999 },
  countText: { fontFamily: fonts.display600, fontSize: 13, lineHeight: 16 },
  countdown: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999, borderWidth: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.sans700, fontSize: 10 },
  strip: { flexDirection: 'row', paddingVertical: 4 },
  slot: { alignItems: 'center', gap: 6 },
  slotFlex: { flex: 1 },
  line: { position: 'absolute', top: 4 + 11, height: 2, borderRadius: 1 },
  dot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  dotNext: { width: 26, height: 26, borderRadius: 13, marginTop: -2, marginBottom: -2 },
  dotNum: { fontFamily: fonts.sans700, fontSize: 11 },
  slotDate: { fontFamily: fonts.sans500, fontSize: 11, lineHeight: 14 },
  slotDateNext: { fontFamily: fonts.sans700 },
  nextBox: { borderRadius: 16, padding: 12, gap: 4 },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9999 },
});
