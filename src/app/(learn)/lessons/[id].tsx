import { useLocalSearchParams } from 'expo-router';

import { LessonScreen } from '@/components/lesson/LessonScreen';
import { LoopScope } from '@/hooks/LoopScope';

/** Nội dung một bài học (mở từ bản đồ lộ trình). `color` = màu chương, `course` = id khoá (quay lại khi mở thẳng link). */
export default function LessonRoute() {
  const { id, color, course } = useLocalSearchParams<{ id: string; color?: string; course?: string }>();
  return (
    <LoopScope>
      <LessonScreen lessonId={id} color={color} courseId={course} />
    </LoopScope>
  );
}
