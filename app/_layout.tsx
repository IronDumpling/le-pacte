import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { ThemeProvider } from '../src/theme/ThemeContext';
import { ThemeStatusBar } from '../src/theme/ThemeStatusBar';
import { LocaleProvider } from '../src/i18n/LocaleContext';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PacteSansSC_400Regular: require('../assets/fonts/PacteSansSC-Regular.ttf'),
    PacteSansSC_600SemiBold: require('../assets/fonts/PacteSansSC-SemiBold.ttf'),
    PacteSansSC_700Bold: require('../assets/fonts/PacteSansSC-Bold.ttf'),
    PacteSansJP_400Regular: require('../assets/fonts/PacteSansJP-Regular.ttf'),
    PacteSansJP_600SemiBold: require('../assets/fonts/PacteSansJP-SemiBold.ttf'),
    PacteSansJP_700Bold: require('../assets/fonts/PacteSansJP-Bold.ttf'),
  });

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
