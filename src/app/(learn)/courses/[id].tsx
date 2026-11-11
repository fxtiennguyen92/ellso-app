import { useLocalSearchParams } from 'expo-router';

import { CourseLearnScreen } from '@/components/courses/CourseLearnScreen';
import { LoopScope } from '@/hooks/LoopScope';

/** Vào học một khoá đã ghi danh: lộ trình (bản đồ bài học) nối CMS. */
export default function CourseMapRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <LoopScope>
      <CourseLearnScreen courseId={id} />
    </LoopScope>
  );
}
