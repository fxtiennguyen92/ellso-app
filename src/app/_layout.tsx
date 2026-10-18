import {
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
} from '@expo-google-fonts/be-vietnam-pro';
import { Lexend_500Medium, Lexend_600SemiBold, Lexend_700Bold } from '@expo-google-fonts/lexend';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useCallback, useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppFrame } from '@/components/AppFrame';
import { RevealProvider } from '@/components/splash/RevealContext';
import { SplashOverlay } from '@/components/splash/SplashOverlay';
import { getHomeData } from '@/data/home';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

// Giữ splash gốc (nền trắng) cho tới khi video splash có khung hình đầu tiên.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppShell />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function AppShell() {
  const { colors, scheme } = useTheme();

  // 1) Nạp font
  const [fontsLoaded, fontError] = useFonts({
    Lexend_500Medium,
    Lexend_600SemiBold,
    Lexend_700Bold,
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
  });

  // 2) Chuẩn bị dữ liệu (hiện là data tạm; sau này: token đăng nhập, gọi API /v1…)
  const [dataReady, setDataReady] = useState(false);
  useEffect(() => {
    getHomeData()
      .catch(() => null)
      .finally(() => setDataReady(true));
  }, []);

  const fontsReady = fontsLoaded || !!fontError;
  const ready = fontsReady && dataReady;

  // 3) Splash video → chuyển cảnh sang Home
  const [revealed, setRevealed] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const onExitStart = useCallback(() => setRevealed(true), []);
  const onFinish = useCallback(() => setSplashDone(true), []);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.bg).catch(() => {});
  }, [colors.bg]);

  return (
    <AppFrame>
      <RevealProvider revealed={revealed}>
        {ready && <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />}
      </RevealProvider>
      {!splashDone && <SplashOverlay ready={ready} onExitStart={onExitStart} onFinish={onFinish} />}
      <StatusBar style={!splashDone || scheme === 'light' ? 'dark' : 'light'} />
    </AppFrame>
  );
}
