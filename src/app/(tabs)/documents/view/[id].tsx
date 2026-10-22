import { useLocalSearchParams } from 'expo-router';

import { ComingSoon } from '@/components/ComingSoon';
import { useDocuments } from '@/components/documents/DocumentsContext';

/** Trình xem video / PDF / sách — chưa có thiết kế, đang là màn tạm. Chỉ xem trong app, không tải về. */
export default function DocViewerRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { docs } = useDocuments();
  const doc = docs.find((d) => d.id === id);
  return <ComingSoon title={doc ? doc.title : 'Không tìm thấy tài liệu'} back />;
}