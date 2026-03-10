import { StatusBar } from 'expo-status-bar';
import { useTheme } from './ThemeContext';

export function ThemeStatusBar() {
  const { resolvedScheme } = useTheme();
  return (
    <StatusBar style={resolvedScheme === 'dark' ? 'light' : 'dark'} />
  );
}
