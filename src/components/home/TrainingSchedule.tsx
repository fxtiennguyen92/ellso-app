import { Animated, StyleSheet } from 'react-native';

import { useRevealStyle } from '@/components/splash/RevealContext';
import type { TutorSession } from '@/data/home';

import { SectionTitle } from './SectionTitle';
import { SessionRow, TicketCard } from './TutorSchedule';

/**
 * Lịch huấn luyện: buổi gần nhất là thẻ vé, 2 buổi sau là dòng gọn.
 * Màu nhấn violet để phân biệt với "Lịch hẹn của tôi" (emerald).
 */
export function TrainingSchedule({ sessions }: { sessions: TutorSession[] }) {
  const reveal = useRevealStyle(2);
  const [next, ...later] = [...sessions].sort((a, b) => a.start.localeCompare(b.start)).slice(0, 3);
  if (!next) return null;

  return (
    <Animated.View style={[styles.section, reveal]}>
      <SectionTitle title="Lịch huấn luyện" subtitle={`${later.length + 1} buổi huấn luyện sắp tới`} action={{ label: 'Xem lịch' }} />
      <TicketCard session={next} accent="violet" />
      {later.map((s) => (
        <SessionRow key={s.id} session={s} accent="violet" personLabel="HLV" />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  section: { paddingTop: 28, paddingHorizontal: 16, gap: 12 },
});