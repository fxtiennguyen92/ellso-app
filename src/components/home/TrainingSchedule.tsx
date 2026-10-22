import { Animated, StyleSheet, View } from 'react-native';

import { useRevealStyle } from '@/components/splash/RevealContext';
import type { TutorSession } from '@/data/home';

import { SectionTitle } from './SectionTitle';
import { TicketCard } from './TutorSchedule';

/** Lịch huấn luyện: 3 buổi gần nhất, mỗi buổi một thẻ vé giống Lịch hẹn. */
export function TrainingSchedule({ sessions }: { sessions: TutorSession[] }) {
  const reveal = useRevealStyle(2);
  const list = [...sessions].sort((a, b) => a.start.localeCompare(b.start)).slice(0, 3);
  if (list.length === 0) return null;

  return (
    <Animated.View style={[styles.section, reveal]}>
      <SectionTitle title="Lịch huấn luyện" subtitle={`${list.length} buổi huấn luyện sắp tới`} action={{ label: 'Xem lịch' }} />
      {/* gap đủ lớn để badge đếm ngày (đè mép trên thẻ) không chạm thẻ trước */}
      <View style={styles.list}>
        {list.map((s) => (
          <TicketCard key={s.id} session={s} />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  section: { paddingTop: 28, paddingHorizontal: 16, gap: 12 },
  list: { gap: 20 },
});