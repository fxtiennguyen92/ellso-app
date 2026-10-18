import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BOTTOM_BAR_SPACE } from '@/components/BottomBar';
import { CourseCarousel } from '@/components/home/CourseCarousel';
import { DailyActivities } from '@/components/home/DailyActivities';
import { HomeHeader } from '@/components/home/HomeHeader';
import { TutorSchedule } from '@/components/home/TutorSchedule';
import { getHomeDataSync } from '@/data/home';
import { useTheme } from '@/theme/ThemeProvider';

export default function HomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const data = getHomeDataSync();

  const [headerHeight, setHeaderHeight] = useState(200);
  const [scrolled, setScrolled] = useState(false);

  // Spec: top 56px trên khung 390 (đã gồm status bar). Native: status bar thật + 12px; web: 24px.
  const topInset = Platform.OS === 'web' ? 24 : insets.top + 12;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <ScrollView
        scrollEventThrottle={16}
        onScroll={(e) => setScrolled(e.nativeEvent.contentOffset.y > 4)}
        contentContainerStyle={{ paddingTop: headerHeight, paddingBottom: BOTTOM_BAR_SPACE + insets.bottom + 16 }}
        showsVerticalScrollIndicator={false}
      >
        <CourseCarousel courses={data.courses} />
        <DailyActivities daily={data.daily} />
        <TutorSchedule sessions={data.sessions} />
      </ScrollView>

      <HomeHeader
        student={data.student}
        scrolled={scrolled}
        topInset={topInset}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
