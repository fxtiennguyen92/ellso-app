import { useLocalSearchParams } from 'expo-router';

import { CourseMapScreen } from '@/components/courses/CourseMapScreen';
import { LoopScope } from '@/hooks/LoopScope';

export default function CourseMapRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <LoopScope>
      <CourseMapScreen courseId={id} />
    </LoopScope>
  );
}