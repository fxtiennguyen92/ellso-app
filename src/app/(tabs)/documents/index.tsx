import { DocumentsScreen } from '@/components/documents/DocumentsScreen';
import { LoopScope } from '@/hooks/LoopScope';

export default function DocumentsRoute() {
  return (
    <LoopScope>
      <DocumentsScreen />
    </LoopScope>
  );
}