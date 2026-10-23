import { env } from '@/config/env';

import { deviceHeaders } from './device';

/**
 * Gọi API ellso-server (Laravel, prefix /v1). Base URL: src/config/env.ts.
 * Lỗi luôn ném ApiError: status (0 = không kết nối được), message tiếng Việt từ server, lỗi theo trường (422).
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fieldErrors: Record<string, string[]> = {},
    public retryAfter?: number,
  ) {
    super(message);
  }
  /** Lỗi đầu tiên của một trường (422). */
  field(name: string): string | undefined {
    return this.fieldErrors[name]?.[0];
  }
}

const TIMEOUT_MS = 15000;

export async function apiRequest<T>(method: 'GET' | 'POST', path: string, opts: { body?: unknown; token?: string | null } = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(await deviceHeaders()),
  };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(env.apiUrl + path, {
      method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });
  } catch {
    throw new ApiError('Không kết nối được máy chủ. Kiểm tra mạng và thử lại.', 0);
  } finally {
    clearTimeout(timer);
  }

  let data: Record<string, unknown> = {};
  try {
    data = (await res.json()) as Record<string, unknown>;
  } catch {
    // không có body JSON
  }

  if (!res.ok) {
    const message =
      typeof data.message === 'string' && data.message
        ? data.message
        : res.status >= 500
          ? 'Máy chủ đang gặp sự cố, thử lại sau.'
          : 'Có lỗi xảy ra, thử lại sau.';
    const retry = typeof data.retry_after === 'number' ? data.retry_after : undefined;
    throw new ApiError(message, res.status, (data.errors as Record<string, string[]>) ?? {}, retry);
  }
  return data as T;
}
