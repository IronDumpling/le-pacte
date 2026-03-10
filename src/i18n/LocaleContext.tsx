import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { storage, type Locale } from '../storage/storage';
import { t as translate, type Locale as LocaleType } from './translations';

interface LocaleContextValue {
  locale: Locale;
  t: (key: string, params?: Record<string, string>) => string;
  setLocale: (locale: Locale) => Promise<void>;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('zh');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    storage.getLocale().then((saved) => {
      if (saved) setLocaleState(saved);
      setHydrated(true);
    });
  }, []);

  const setLocale = useCallback(async (newLocale: Locale) => {
    setLocaleState(newLocale);
    await storage.setLocale(newLocale);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string>) =>
      translate(locale as LocaleType, key, params),
    [locale]
  );

  if (!hydrated) {
    return (
      <LocaleContext.Provider
        value={{
          locale: 'zh',
          t: (key, params) => translate('zh', key, params),
          setLocale,
        }}
      >
        {children}
      </LocaleContext.Provider>
    );
  }

  return (
    <LocaleContext.Provider value={{ locale, t, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}
