/**
 * API LƯỢT MỞ APP — ellso-server: POST /v1/app-sessions/ping (AppSessionController).
 *
 * Server tính 1 lượt mở app = 1 phiên: ping đầu tiên, hoặc ping sau ≥ 30 phút không có tín hiệu → phiên mới;
 * ping trong vòng 30 phút chỉ kéo dài phiên (đo thời gian dùng app). Thiết bị lấy từ header X-Device-* (src/lib/device.ts).
 * Dùng cho CMS › Thống kê › Hoạt động học viên.
 */
import { apiRequest } from '@/lib/api';

export type PingResult = {
  sessionId: number;
  newSession: boolean;
  /** Chu kỳ heartbeat server gợi ý (giây). */
  heartbeatSeconds: number;
};

type ServerPing = {
  session_id: number;
  new_session: boolean;
  heartbeat_seconds?: number;
};

/** Mặc định nếu server không gửi heartbeat_seconds. */
export const DEFAULT_HEARTBEAT_SECONDS = 60;

export async function apiPingAppSession(token: string): Promise<PingResult> {
  const r = await apiRequest<ServerPing>('POST', '/app-sessions/ping', { token });
  return {
    sessionId: r.session_id,
    newSession: r.new_session,
    heartbeatSeconds: r.heartbeat_seconds ?? DEFAULT_HEARTBEAT_SECONDS,
  };
}
