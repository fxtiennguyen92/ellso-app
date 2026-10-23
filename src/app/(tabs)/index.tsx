import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BOTTOM_BAR_SPACE } from '@/components/BottomBar';
import { CampaignCard } from '@/components/home/CampaignCard';
import { CourseCarousel } from '@/components/home/CourseCarousel';
import { DailyActivities } from '@/components/home/DailyActivities';
import { HomeBooks } from '@/components/home/HomeBooks';
import { HomeHeader } from '@/components/home/HomeHeader';
import { TrainingSchedule } from '@/components/home/TrainingSchedule';
import { TutorSchedule } from '@/components/home/TutorSchedule';
import { useAuth } from '@/auth/AuthProvider';
import { getHomeDataSync } from '@/data/home';
import { LoopScope } from '@/hooks/LoopScope';
import { useTheme } from '@/theme/ThemeProvider';

export default function HomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const data = getHomeDataSync();
  const { user } = useAuth();
  // Lời chào theo tài khoản đang đăng nhập
  const student = user ? { ...data.student, name: user.name, initials: user.initials } : data.student;

  const [headerHeight, setHeaderHeight] = useState(200);
  const [scrolled, setScrolled] = useState(false);

  // Khoảng trống phía trên header. Native: dưới status bar thật 28px; web (không có status bar): 44px.
  const topInset = Platform.OS === 'web' ? 44 : insets.top + 28;

  return (
    <LoopScope>
      <View style={[styles.screen, { backgroundColor: colors.bg }]}>
        <ScrollView
          scrollEventThrottle={16}
          onScroll={(e) => setScrolled(e.nativeEvent.contentOffset.y > 4)}
          contentContainerStyle={{ paddingTop: headerHeight, paddingBottom: BOTTOM_BAR_SPACE + insets.bottom + 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Thứ tự: Chiến dịch → Lịch huấn luyện → Khoá học của bạn → Lịch hẹn → Hoạt động hằng ngày → Sách */}
          {data.campaign && <CampaignCard campaign={data.campaign} />}
          <TrainingSchedule sessions={data.trainings} />
          <CourseCarousel courses={data.courses} />
          <TutorSchedule sessions={data.sessions} />
          <DailyActivities daily={data.daily} />
          <HomeBooks />
        </ScrollView>

        <HomeHeader student={student} scrolled={scrolled} topInset={topInset} onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)} />
      </View>
    </LoopScope>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
