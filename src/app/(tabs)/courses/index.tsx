import { CoursesScreen } from '@/components/courses/CoursesScreen';
import { LoopScope } from '@/hooks/LoopScope';

export default function CoursesRoute() {
  return (
    <LoopScope>
      <CoursesScreen />
    </LoopScope>
  );
}