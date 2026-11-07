import { useToast } from '@/components/Toast';

import { DevicesSection } from './DevicesSection';
import { InfoSection } from './InfoSection';
import { SubpageShell } from './SubpageShell';

/** Hồ sơ › Thiết bị: các thiết bị đang đăng nhập, lần dùng cuối, xoá = đăng xuất tài khoản trên thiết bị đó. */
export function DevicesScreen() {
  const [toast, showToast] = useToast();
  return (
    <SubpageShell title="Thiết bị" overlay={toast}>
      <InfoSection title="Thiết bị đang đăng nhập">
        <DevicesSection onToast={showToast} />
      </InfoSection>
    </SubpageShell>
  );
}
