import { useLocalSearchParams } from 'expo-router';

import { CourseMapScreen } from '@/components/courses/CourseMapScreen';

export default function CourseMapRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CourseMapScreen courseId={id} />;
}