import { Stack } from 'expo-router';
import { ThemeProvider } from '../src/theme/ThemeContext';
import { ThemeStatusBar } from '../src/theme/ThemeStatusBar';
import { LocaleProvider } from '../src/i18n/LocaleContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <ThemeStatusBar />
        <Stack screenOptions={{ headerShown: false }} />
      </LocaleProvider>
    </ThemeProvider>
  );
}
