import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { ThemeProvider } from '../src/theme/ThemeContext';
import { ThemeStatusBar } from '../src/theme/ThemeStatusBar';
import { LocaleProvider } from '../src/i18n/LocaleContext';
import { prepareSplashScreen } from '../src/splash/splashGate';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({});
  const [splashReady, setSplashReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    prepareSplashScreen().then(() => {
      if (!cancelled) setSplashReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!fontsLoaded || !splashReady) {
    return null;
  }

  return (
    <ThemeProvider>
      <LocaleProvider>
        <ThemeStatusBar />
        <Stack screenOptions={{ headerShown: false }} />
      </LocaleProvider>
    </ThemeProvider>
  );
}
