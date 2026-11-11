import * as Application from 'expo-application';
import Constants, { ExecutionEnvironment } from 'expo-constants';

/**
 * Phiên bản app lấy từ chính bản cài (không đặt cứng):
 * - Bản build thật (iOS / Android): version + số build của file cài (expo-application), vd "1.2.0 (34)".
 * - Expo Go / web: version trong app.json (expo-constants) — trong Expo Go, expo-application trả version của chính Expo Go.
 */
export function appVersionLabel(): string {
  const configVersion = Constants.expoConfig?.version ?? '—';
  if (Constants.executionEnvironment !== ExecutionEnvironment.Standalone && Constants.executionEnvironment !== ExecutionEnvironment.Bare) {
    return configVersion;
  }
  const version = Application.nativeApplicationVersion ?? configVersion;
  const build = Application.nativeBuildVersion;
  return build && build !== version ? `${version} (${build})` : version;
}
