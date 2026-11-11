import { useLocalSearchParams } from 'expo-router';

import { DocViewerScreen } from '@/components/documents/DocViewerScreen';

/** Trình xem video / PDF (ngoài nhóm (tabs) → không có thanh tab; đường dẫn vẫn /documents/view/[id]). */
export default function DocViewerRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DocViewerScreen id={id} />;
}
