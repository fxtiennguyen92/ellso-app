import { Animated, StyleSheet } from 'react-native';

import { useRevealStyle } from '@/components/splash/RevealContext';
import type { HomeWorkshop } from '@/data/home';
import { useTheme } from '@/theme/ThemeProvider';

import { SectionTitle } from './SectionTitle';
import { WorkshopCard } from './WorkshopCard';

/**
 * Workshop (online, lặp hằng tuần — GET /v1/workshops): dải nền đậm hơn nền trang để tách khỏi Chương trình huấn luyện.
 * Tối đa 3 thẻ; mỗi thẻ hiện 3 ngày sắp diễn ra.
 */
export function WorkshopSchedule({ workshops }: { workshops: HomeWorkshop[] }) {
  const { colors } = useTheme();
  const reveal = useRevealStyle(3);
  const list = workshops.slice(0, 3);
  if (list.length === 0) return null;

  return (
    <Animated.View style={[styles.band, { backgroundColor: colors.workshopBand }, reveal]}>
      <SectionTitle title="Workshop" subtitle="Trao đổi hàng tuần" />
      {list.map((w) => (
        <WorkshopCard key={w.id} workshop={w} />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  band: { marginTop: 32, paddingTop: 24, paddingBottom: 28, paddingHorizontal: 16, gap: 12 },
});
