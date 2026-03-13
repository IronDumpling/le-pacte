import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { ThemeProvider } from '../src/theme/ThemeContext';
import { ThemeStatusBar } from '../src/theme/ThemeStatusBar';
import { LocaleProvider } from '../src/i18n/LocaleContext';
import { ensureSplashPrevented } from '../src/splash/splashGate';

export default function RootLayout() {
  // Fonts are now loaded on demand in individual screens/components.
  // Keep useFonts hook here with an empty map so the startup behavior stays simple.
  const [fontsLoaded] = useFonts({});

  // 确保在应用树渲染前阻止原生 splash 自动关闭
  ensureSplashPrevented();

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <LocaleProvider>
        <ThemeStatusBar />
        <Stack screenOptions={{ headerShown: false }} />
      </LocaleProvider>
    </ThemeProvider>
  );
}
