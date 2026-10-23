import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { kvGet, kvSet } from './secureKv';

/**
 * Thông tin thiết bị gửi kèm mỗi request (server: App\Support\DeviceInfo):
 * X-Device-Name · X-Device-Platform (ios | android | web) · X-Device-OS · X-App-Version · X-Device-Id
 */
const ID_KEY = 'ellso.deviceId';
let deviceId: string | null = null;

function randomId() {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** Id cố định của máy (tạo 1 lần, lưu trong kho an toàn). */
async function getDeviceId(): Promise<string> {
  if (deviceId) return deviceId;
  const saved = await kvGet(ID_KEY);
  deviceId = saved ?? randomId();
  if (!saved) await kvSet(ID_KEY, deviceId);
  return deviceId;
}

function deviceName(): string | null {
  if (Platform.OS === 'web') {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const browser = /Edg\//.test(ua)
      ? 'Edge'
      : /Chrome\//.test(ua)
        ? 'Chrome'
        : /Firefox\//.test(ua)
          ? 'Firefox'
          : /Safari\//.test(ua)
            ? 'Safari'
            : null;
    return browser ? `${browser} (web)` : null;
  }
  return Constants.deviceName ?? null;
}

export async function deviceHeaders(): Promise<Record<string, string>> {
  const h: Record<string, string> = {
    'X-Device-Platform': Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web',
    'X-Device-Id': await getDeviceId(),
  };
  const name = deviceName();
  if (name) h['X-Device-Name'] = name;
  if (Platform.OS !== 'web') h['X-Device-OS'] = String(Platform.Version);
  const version = Constants.expoConfig?.version;
  if (version) h['X-App-Version'] = version;
  return h;
}
