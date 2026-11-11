import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { apiPingAppSession, DEFAULT_HEARTBEAT_SECONDS } from '@/data/appSession';

/**
 * Báo server lượt mở app khi đã đăng nhập (token đầy đủ):
 * - ping ngay khi vào app / khi app quay lại foreground (web: tab hiện lại),
 * - ping mỗi `heartbeat_seconds` (mặc định 60s) khi app đang ở foreground,
 * - dừng khi app xuống nền / tab bị ẩn, hoặc khi đăng xuất (token = null).
 * Lỗi mạng hay lỗi server bỏ qua im lặng — tracking không được làm phiền người dùng.
 */
export function useAppSessionTracking(token: string | null) {
  useEffect(() => {
    if (!token) return;

    let heartbeatMs = DEFAULT_HEARTBEAT_SECONDS * 1000;
    let timer: ReturnType<typeof setInterval> | null = null;
    let inFlight = false;
    let stopped = false;

    const ping = () => {
      if (inFlight || stopped) return;
      inFlight = true;
      apiPingAppSession(token)
        .then((r) => {
          const next = Math.max(15, r.heartbeatSeconds) * 1000;
          if (next !== heartbeatMs) {
            heartbeatMs = next;
            if (timer) restartTimer();
          }
        })
        .catch(() => {})
        .finally(() => {
          inFlight = false;
        });
    };

    const stopTimer = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };

    const restartTimer = () => {
      stopTimer();
      timer = setInterval(ping, heartbeatMs);
    };

    const onActive = () => {
      ping();
      restartTimer();
    };

    if (AppState.currentState === 'active' || AppState.currentState == null) onActive();

    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        if (!timer) onActive();
      } else {
        stopTimer();
      }
    });

    return () => {
      stopped = true;
      stopTimer();
      sub.remove();
    };
  }, [token]);
}
