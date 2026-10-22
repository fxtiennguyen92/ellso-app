import { useLocalSearchParams } from 'expo-router';

import { ComingSoon } from '@/components/ComingSoon';
import { profileSections, type ProfileSection } from '@/data/profile';

/** Trang con của Hồ sơ — đang là màn tạm, làm thật ở bước sau (mỗi trang tách thành route riêng khi làm). */
export default function ProfileSectionRoute() {
  const { section } = useLocalSearchParams<{ section: string }>();
  const title = profileSections[section as ProfileSection] ?? 'Hồ sơ';
  return <ComingSoon title={title} back />;
}