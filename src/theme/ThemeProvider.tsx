import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
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
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('system');

  const scheme: ColorScheme = mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;

  const toggle = useCallback(() => {
    setMode(scheme === 'dark' ? 'light' : 'dark');
  }, [scheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      scheme,
      colors: scheme === 'dark' ? darkColors : lightColors,
      setMode,
      toggle,
    }),
    [mode, scheme, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme phải nằm trong <ThemeProvider>');
  return ctx;
}
