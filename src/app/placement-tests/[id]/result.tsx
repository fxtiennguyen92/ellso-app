import { PlacementResultScreen } from '@/components/placement/PlacementResultScreen';
import { LoopScope } from '@/hooks/LoopScope';

/** Kết quả bài kiểm tra đầu vào (chỉ xem, màn "thành tựu" có hiệu ứng chúc mừng). */
export default function PlacementResultRoute() {
  return (
    <LoopScope>
      <PlacementResultScreen />
    </LoopScope>
  );
}
