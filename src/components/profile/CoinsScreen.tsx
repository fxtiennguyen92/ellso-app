import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { useAuth } from '@/auth/AuthProvider';

import { CoinCard } from './CoinCard';
import { SubpageShell } from './SubpageShell';

/** Hồ sơ › Xu của bạn: số xu đang có (không quy đổi tiền) + nút Lịch sử → /profile/lich-su-credit (tạm). */
export function CoinsScreen() {
  const { user, refreshUser } = useAuth();

  useFocusEffect(
    useCallback(() => {
      refreshUser();
    }, [refreshUser]),
  );

  return (
    <SubpageShell title="Xu của bạn">
      <CoinCard coins={user?.coins ?? 0} onHistory={() => router.push('/profile/lich-su-credit')} />
    </SubpageShell>
  );
}
