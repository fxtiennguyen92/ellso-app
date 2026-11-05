import { Animated, StyleSheet } from 'react-native';

import { initialsOf } from '@/data/auth';
import { useRevealStyle } from '@/components/splash/RevealContext';
import { feeLabel, type HomeTraining, type TutorSession } from '@/data/home';

import { SessionRow, TicketCard } from './ScheduleCards';
import { SectionTitle } from './SectionTitle';

const toSession = (t: HomeTraining): TutorSession => ({
  id: t.id,
  title: t.title,
  start: t.next.start,
  end: t.next.end,
  location: t.next.place ?? 'Địa điểm sẽ thông báo',
  room: t.sessionsCount > 1 ? `Buổi ${t.next.number}/${t.sessionsCount}` : undefined,
  tutor: { name: t.trainer ?? 'Ellso', initials: initialsOf(t.trainer ?? 'Ellso') },
});

/**
 * Lịch huấn luyện (chương trình offline nhiều buổi, GET /v1/trainings): chương trình có buổi gần nhất là thẻ vé,
 * 2 chương trình sau là dòng gọn. Màu nhấn violet.
 */
export function TrainingSchedule({ trainings }: { trainings: HomeTraining[] }) {
  const reveal = useRevealStyle(2);
  const [next, ...later] = trainings.slice(0, 3);
  if (!next) return null;

  const chips = [
    ...(next.registered ? [{ label: 'Đã đăng ký', tone: 'accent' as const }] : []),
    { label: feeLabel(next.isFree, next.price), tone: 'neutral' as const },
    ...(!next.registered && next.seatsLeft !== null ? [{ label: next.seatsLeft > 0 ? `Còn ${next.seatsLeft} chỗ` : 'Hết chỗ', tone: 'neutral' as const }] : []),
  ];

  return (
    <Animated.View style={[styles.section, reveal]}>
      <SectionTitle title="Lịch huấn luyện" subtitle={trainings.length > 1 ? `${trainings.length} chương trình sắp diễn ra` : 'Chương trình sắp diễn ra'} />
      <TicketCard session={toSession(next)} accent="violet" personLabel="HLV" chips={chips} />
      {later.map((t) => (
        <SessionRow key={t.id} session={toSession(t)} accent="violet" personLabel="HLV" />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  section: { paddingTop: 28, paddingHorizontal: 16, gap: 12 },
});
