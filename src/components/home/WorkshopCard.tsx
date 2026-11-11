import { Pressable, StyleSheet, Text, View } from 'react-native';

import { InstructorTag } from '@/components/InstructorTag';
import { Icon } from '@/components/Icon';
import { feeLabel, formatSession, type HomeWorkshop } from '@/data/home';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type } from '@/theme/typography';

/** Số ngày hiện trên thẻ (yêu cầu: ít nhất 3 để người dùng thấy còn lần sau). */
const TILES = 3;

/**
 * Thẻ workshop (Home): ONLINE + phí, tên, người dẫn, rồi 3 ô ngày sắp diễn ra (ô đầu = gần nhất, nổi bật);
 * còn nhiều hơn thì ghi "+N buổi khác". Buổi đã đăng ký có dấu tích.
 */
export function WorkshopCard({ workshop, onPress }: { workshop: HomeWorkshop; onPress?: () => void }) {
  const { colors } = useTheme();
  const w = workshop;
  const host = w.trainer ?? 'Ellso';
  const shown = w.upcoming.slice(0, TILES);
  const more = Math.max(0, w.upcomingCount - shown.length);
  const nf = formatSession(w.next);

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      accessibilityLabel={`Workshop online ${w.title}. Người hướng dẫn ${host}. ${feeLabel(w.isFree, w.price)}. Các buổi sắp tới: ${shown
        .map((s) => {
          const f = formatSession(s);
          return `${f.weekday} ${f.day} ${f.month} lúc ${f.startTime}${s.registered ? ', đã đăng ký' : ''}`;
        })
        .join('; ')}${more ? `; và ${more} buổi khác` : ''}`}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.line, boxShadow: colors.shadowCard, transform: [{ scale: pressed && onPress ? 0.985 : 1 }] },
      ]}
    >
      <View style={styles.topRow}>
        <View style={[styles.badge, { backgroundColor: colors.workshopText }]}>
          <Icon name="video" size={14} strokeWidth={2.2} color={colors.card} />
          <Text style={[styles.badgeText, { color: colors.card }]}>ONLINE</Text>
        </View>
        <View style={[styles.fee, { backgroundColor: colors.workshopTint }]}>
          <Text style={[type.chip, { color: colors.workshopText }]}>{feeLabel(w.isFree, w.price)}</Text>
        </View>
      </View>

      <Text style={[type.cardTitle, { color: colors.ink900 }]} numberOfLines={2}>
        {w.title}
      </Text>

      <View style={styles.person}>
        <InstructorTag name={host} avatar={w.trainerAvatar} tone="workshop" />
      </View>

      <View style={styles.tiles}>
        {shown.map((s, i) => {
          const f = formatSession(s);
          const first = i === 0;
          return (
            <View
              key={s.id}
              style={[
                styles.tile,
                first
                  ? { backgroundColor: colors.workshopTint, borderColor: colors.workshopLine }
                  : { backgroundColor: colors.surfaceAlt, borderColor: 'transparent' },
              ]}
            >
              <Text style={[type.captionStrong, styles.tileWeek, { color: first ? colors.workshopText : colors.ink600 }]}>{f.weekday}</Text>
              <Text style={[styles.tileDay, { color: first ? colors.workshopDeep : colors.ink900 }]}>{f.day}</Text>
              <Text style={[type.caption, styles.tileSmall, { color: first ? colors.workshopDeep : colors.ink600 }]}>Tháng {new Date(s.start).getMonth() + 1}</Text>
              <View style={[styles.timePill, { backgroundColor: first ? colors.workshopText : colors.card }]}>
                <Text style={[styles.timeText, { color: first ? colors.card : colors.ink900 }]}>{f.startTime}</Text>
              </View>
              {s.registered && (
                <View style={[styles.check, { backgroundColor: colors.emerald700, borderColor: colors.card }]}>
                  <Icon name="check" size={10} strokeWidth={3.2} color={colors.card} />
                </View>
              )}
            </View>
          );
        })}
        {/* Ít hơn 3 buổi: giữ ô trống để các ô không bị kéo giãn */}
        {Array.from({ length: Math.max(0, TILES - shown.length) }).map((_, i) => (
          <View key={`empty-${i}`} style={[styles.tile, styles.tileEmpty, { borderColor: colors.line }]}>
            <Text style={[type.caption, styles.emptyText, { color: colors.ink400 }]}>Sắp có lịch mới</Text>
          </View>
        ))}
      </View>

      <Text style={[type.caption, { color: colors.ink600 }]}>
        {nf.countdown === 'Hôm nay' ? 'Buổi gần nhất: hôm nay' : `Buổi gần nhất: ${nf.countdown.toLowerCase()}`}
        {` · ${nf.startTime} – ${nf.endTime}`}
        {more > 0 ? ` · +${more} buổi khác` : ''}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, borderWidth: 1, padding: 16, gap: 12 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9999 },
  badgeText: { fontFamily: fonts.sans700, fontSize: 11, letterSpacing: 0.8 },
  fee: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9999 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tiles: { flexDirection: 'row', gap: 8 },
  tile: { flex: 1, alignItems: 'center', paddingTop: 10, paddingBottom: 10, borderRadius: 16, borderWidth: 1.5 },
  tileWeek: { fontSize: 12, lineHeight: 16 },
  tileDay: { fontFamily: fonts.display700, fontSize: 24, lineHeight: 30 },
  tileSmall: { fontSize: 12, lineHeight: 16 },
  timePill: { marginTop: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9999 },
  timeText: { fontFamily: fonts.sans700, fontSize: 12, lineHeight: 16 },
  check: { position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  tileEmpty: { borderStyle: 'dashed', justifyContent: 'center', paddingHorizontal: 6 },
  emptyText: { textAlign: 'center', fontSize: 11, lineHeight: 15 },
});
