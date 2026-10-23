import * as SecureStore from 'expo-secure-store';

/** Kho key–value an toàn: native = Keychain / Keystore (expo-secure-store). Web: xem secureKv.web.ts. */
export async function kvGet(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function kvSet(key: string, value: string | null): Promise<void> {
  try {
    if (value === null) await SecureStore.deleteItemAsync(key);
    else await SecureStore.setItemAsync(key, value);
  } catch {
    // bỏ qua: lần sau sẽ phải tạo lại
  }
}
