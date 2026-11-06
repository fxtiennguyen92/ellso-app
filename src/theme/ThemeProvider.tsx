import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { darkColors, lightColors, type ColorTokens } from './tokens';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ColorScheme = 'light' | 'dark';

type ThemeContextValue = {
  /** Lựa chọn của người dùng: theo hệ thống / sáng / tối. */
  mode: ThemeMode;
  /** Chế độ đang hiển thị thực tế. */
  scheme: ColorScheme;
  colors: ColorTokens;
  setMode: (mode: ThemeMode) => void;
  /** Đổi nhanh sáng ↔ tối (dùng khi test). */
  toggle: () => void;
  /** Đã đọc xong lựa chọn đã lưu trên máy (root layout chờ cờ này trước khi tắt splash → không nháy sai màu). */
  ready: boolean;
};

/** Khoá lưu lựa chọn giao diện trên máy (AsyncStorage; web: localStorage). */
const STORAGE_KEY = 'ellso.themeMode';
const isMode = (v: unknown): v is ThemeMode => v === 'system' || v === 'light' || v === 'dark';

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [ready, setReady] = useState(false);

  // Mở app: đọc lựa chọn lần trước (lỗi / chưa có → theo hệ thống)
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => isMode(v) && setModeState(v))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  // Đổi giao diện → lưu xuống máy để lần sau mở app vẫn giữ
  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem(STORAGE_KEY, m).catch(() => {});
  }, []);

  const scheme: ColorScheme = mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;

  const toggle = useCallback(() => {
    setMode(scheme === 'dark' ? 'light' : 'dark');
  }, [scheme, setMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      scheme,
      colors: scheme === 'dark' ? darkColors : lightColors,
      setMode,
      toggle,
      ready,
    }),
    [mode, scheme, setMode, toggle, ready],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme phải nằm trong <ThemeProvider>');
  return ctx;
}
