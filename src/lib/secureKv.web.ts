/** Web: expo-secure-store không chạy trên web → localStorage (bọc try/catch vì có thể bị chặn). */
export async function kvGet(key: string): Promise<string | null> {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function kvSet(key: string, value: string | null): Promise<void> {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // bỏ qua
  }
}
