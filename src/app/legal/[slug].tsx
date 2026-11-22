import { useLocalSearchParams } from 'expo-router';

import { LegalScreen } from '@/components/legal/LegalScreen';

/** Điều khoản sử dụng (/legal/terms) · Chính sách bảo mật (/legal/privacy) — mở được khi chưa đăng nhập. */
export default function LegalRoute() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return <LegalScreen slug={slug === 'privacy' ? 'privacy' : 'terms'} />;
}
