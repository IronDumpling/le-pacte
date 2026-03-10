import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { Appearance } from 'react-native';
import { storage, type ColorScheme } from '../storage/storage';
import { darkColors, lightColors, type Colors } from './colors';

interface ThemeContextValue {
  colors: Colors;
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => Promise<void>;
  resolvedScheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>('auto');
  const [systemScheme, setSystemScheme] = useState<'light' | 'dark'>(
    Appearance.getColorScheme() ?? 'dark'
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    storage.getColorScheme().then((saved) => {
      if (saved) setColorSchemeState(saved);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme: scheme }) => {
      setSystemScheme(scheme ?? 'dark');
    });
    return () => sub.remove();
  }, []);

  const setColorScheme = useCallback(async (scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    await storage.setColorScheme(scheme);
  }, []);

  const resolvedScheme: 'light' | 'dark' =
    colorScheme === 'auto' ? systemScheme : colorScheme;
  const colors = resolvedScheme === 'light' ? lightColors : darkColors;

  if (!hydrated) {
    const fallbackColors =
      (Appearance.getColorScheme() ?? 'dark') === 'light'
        ? lightColors
        : darkColors;
    return (
      <ThemeContext.Provider
        value={{
          colors: fallbackColors,
          colorScheme: 'auto',
          setColorScheme,
          resolvedScheme: Appearance.getColorScheme() ?? 'dark',
        }}
      >
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider
      value={{ colors, colorScheme, setColorScheme, resolvedScheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
