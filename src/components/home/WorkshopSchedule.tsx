import { Animated, StyleSheet } from 'react-native';

import { initialsOf } from '@/data/auth';
import { useRevealStyle } from '@/components/splash/RevealContext';
import { feeLabel, type HomeWorkshop, type TutorSession } from '@/data/home';

import { SessionRow, TicketCard } from './ScheduleCards';
import { SectionTitle } from './SectionTitle';

const toSession = (w: HomeWorkshop): TutorSession => ({
  id: w.id,
  title: w.title,
  start: w.next.start,
  end: w.next.end,
  location: 'Online',
  room: w.upcomingCount > 1 ? `${w.upcomingCount} khung giờ` : undefined,
  tutor: { name: w.trainer ?? 'Ellso', initials: initialsOf(w.trainer ?? 'Ellso') },
});

/**
 * Lịch Workshop (online, 1 buổi lặp nhiều ngày — GET /v1/workshops): workshop có buổi gần nhất là thẻ vé,
 * 2 workshop sau là dòng gọn. Màu nhấn cam, biểu tượng video thay cho địa điểm.
 */
export function WorkshopSchedule({ workshops }: { workshops: HomeWorkshop[] }) {
  const reveal = useRevealStyle(3);
  const [next, ...later] = workshops.slice(0, 3);
  if (!next) return null;

  const chips = [{ label: feeLabel(next.isFree, next.price), tone: 'accent' as const }];

  return (
    <Animated.View style={[styles.section, reveal]}>
      <SectionTitle title="Lịch Workshop" subtitle="Online · chọn khung giờ phù hợp" />
      <TicketCard session={toSession(next)} accent="orange" placeIcon="video" personLabel="Người dẫn" chips={chips} />
      {later.map((w) => (
        <SessionRow key={w.id} session={toSession(w)} accent="orange" personLabel="Người dẫn" />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  section: { paddingTop: 28, paddingHorizontal: 16, gap: 12 },
});
