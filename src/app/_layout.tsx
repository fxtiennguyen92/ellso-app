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

import { AuthProvider, useAuth } from '@/auth/AuthProvider';
import { useAppSessionTracking } from '@/auth/useAppSessionTracking';
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
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function AppShell() {
  const { colors, scheme } = useTheme();
  const { status, token } = useAuth();

  // Lượt mở app cho CMS › Thống kê › Hoạt động học viên (chỉ khi đã đăng nhập)
  useAppSessionTracking(token);

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

  // 2) Chuẩn bị dữ liệu (hiện là data tạm; sau này gọi API /v1…). Phiên đăng nhập do AuthProvider đọc song song.
  const [dataReady, setDataReady] = useState(false);
  useEffect(() => {
    getHomeData()
      .catch(() => null)
      .finally(() => setDataReady(true));
  }, []);

  const fontsReady = fontsLoaded || !!fontError;
  const ready = fontsReady && dataReady && status !== 'loading';
  const signedIn = status === 'signedIn';

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
        {ready && (
          // Chặn theo trạng thái đăng nhập: đổi status (đăng nhập / đổi mật khẩu / đăng xuất) là router tự chuyển nhóm màn.
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
            <Stack.Protected guard={signedIn}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="search" />
              <Stack.Screen name="campaign/[id]" />
              <Stack.Screen name="placement-test" />
            </Stack.Protected>
            {/* Đăng nhập bằng mật khẩu tạm: chỉ còn màn đặt mật khẩu mới (không vuốt lui được) */}
            <Stack.Protected guard={status === 'mustChangePassword'}>
              <Stack.Screen name="set-password" options={{ gestureEnabled: false }} />
            </Stack.Protected>
            {/* Chưa đăng nhập: màn đầu tiên trong nhóm (login) là nơi router chuyển tới */}
            <Stack.Protected guard={status === 'signedOut'}>
              <Stack.Screen name="login" />
              <Stack.Screen name="register" />
              <Stack.Screen name="register-sent" options={{ gestureEnabled: false }} />
              <Stack.Screen name="forgot-password" />
              <Stack.Screen name="forgot-sent" options={{ gestureEnabled: false }} />
            </Stack.Protected>
          </Stack>
        )}
      </RevealProvider>
      {!splashDone && <SplashOverlay ready={ready} onExitStart={onExitStart} onFinish={onFinish} />}
      <StatusBar style={!splashDone || scheme === 'light' ? 'dark' : 'light'} />
    </AppFrame>
  );
}
