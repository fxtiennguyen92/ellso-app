import { Animated, StyleSheet } from 'react-native';

import { useRevealStyle } from '@/components/splash/RevealContext';
import type { HomeTraining } from '@/data/home';

import { SectionTitle } from './SectionTitle';
import { TrainingCard } from './TrainingCard';

/** Chương trình huấn luyện (offline, nhiều buổi — GET /v1/trainings): tối đa 3 thẻ, buổi sắp tới gần nhất trước. Bấm thẻ → bottom sheet. */
export function TrainingSchedule({ trainings, onOpen }: { trainings: HomeTraining[]; onOpen: (t: HomeTraining) => void }) {
  const reveal = useRevealStyle(2);
  const list = trainings.slice(0, 3);
  if (list.length === 0) return null;

  return (
    <Animated.View style={[styles.section, reveal]}>
      <SectionTitle title="Chương trình huấn luyện" subtitle={list.length > 1 ? `${trainings.length} chương trình sắp diễn ra` : 'Chương trình sắp diễn ra'} />
      {list.map((t) => (
        <TrainingCard key={t.id} training={t} onPress={() => onOpen(t)} />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  section: { paddingTop: 28, paddingHorizontal: 16, gap: 12 },
});
