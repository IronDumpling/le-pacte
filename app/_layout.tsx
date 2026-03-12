import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { ThemeProvider } from '../src/theme/ThemeContext';
import { ThemeStatusBar } from '../src/theme/ThemeStatusBar';
import { LocaleProvider } from '../src/i18n/LocaleContext';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    // Roboto Mono - numeric / technical labels
    RobotoMono_400Regular: require('../assets/fonts/robot_mono/RobotoMono-Regular.ttf'),
    RobotoMono_600SemiBold: require('../assets/fonts/robot_mono/RobotoMono-SemiBold.ttf'),
    RobotoMono_700Bold: require('../assets/fonts/robot_mono/RobotoMono-Bold.ttf'),
    // Noto Sans SC/JP - general UI text
    NotoSansSC_400Regular: require('../assets/fonts/noto_sans/NotoSansSC-Regular.ttf'),
    NotoSansSC_600SemiBold: require('../assets/fonts/noto_sans/NotoSansSC-SemiBold.ttf'),
    NotoSansSC_700Bold: require('../assets/fonts/noto_sans/NotoSansSC-Bold.ttf'),
    NotoSansJP_400Regular: require('../assets/fonts/noto_sans/NotoSansJP-Regular.ttf'),
    NotoSansJP_600SemiBold: require('../assets/fonts/noto_sans/NotoSansJP-SemiBold.ttf'),
    NotoSansJP_700Bold: require('../assets/fonts/noto_sans/NotoSansJP-Bold.ttf'),
    // Noto Serif SC/JP - \"case law\" and rules
    NotoSerifSC_400Regular: require('../assets/fonts/noto_serif/NotoSerifSC-Regular.ttf'),
    NotoSerifSC_600SemiBold: require('../assets/fonts/noto_serif/NotoSerifSC-SemiBold.ttf'),
    NotoSerifSC_700Bold: require('../assets/fonts/noto_serif/NotoSerifSC-Bold.ttf'),
    NotoSerifJP_400Regular: require('../assets/fonts/noto_serif/NotoSerifJP-Regular.ttf'),
    NotoSerifJP_600SemiBold: require('../assets/fonts/noto_serif/NotoSerifJP-SemiBold.ttf'),
    NotoSerifJP_700Bold: require('../assets/fonts/noto_serif/NotoSerifJP-Bold.ttf'),
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
