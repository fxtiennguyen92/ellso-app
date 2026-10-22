import { ProfileScreen } from '@/components/profile/ProfileScreen';
import { LoopScope } from '@/hooks/LoopScope';

export default function ProfileRoute() {
  return (
    <LoopScope>
      <ProfileScreen />
    </LoopScope>
  );
}