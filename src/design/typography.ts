import { useMemo } from 'react';
import type { Locale } from '../storage/storage';
import { useLocale } from '../i18n/LocaleContext';

type FontWeightKey = 'regular' | 'semibold' | 'bold';

export type Typography = {
  chainNumber: { fontFamily: string; fontWeight: '700'; fontSize: number };
  chainLabel: { fontFamily: string; fontWeight: '600'; fontSize: number };
  title: { fontFamily: string; fontWeight: '600'; fontSize: number };
  body: { fontFamily: string; fontWeight: '400'; fontSize: number };
  button: { fontFamily: string; fontWeight: '700'; fontSize: number };
};

function fontKey(locale: Locale, weight: FontWeightKey) {
  const family = locale === 'ja' ? 'PacteSansJP' : 'PacteSansSC';
  if (weight === 'regular') return `${family}_400Regular`;
  if (weight === 'semibold') return `${family}_600SemiBold`;
  return `${family}_700Bold`;
}

export function createTypography(locale: Locale): Typography {
  // A small, consistent size ladder used app-wide.
  // Countdown screens may override with explicit fontSize where needed.
  return {
    chainNumber: {
      fontFamily: fontKey(locale, 'bold'),
      fontWeight: '700',
      fontSize: 48,
    },
    chainLabel: {
      fontFamily: fontKey(locale, 'semibold'),
      fontWeight: '600',
      fontSize: 18,
    },
    title: {
      fontFamily: fontKey(locale, 'semibold'),
      fontWeight: '600',
      fontSize: 24,
    },
    body: {
      fontFamily: fontKey(locale, 'regular'),
      fontWeight: '400',
      fontSize: 16,
    },
    button: {
      fontFamily: fontKey(locale, 'bold'),
      fontWeight: '700',
      fontSize: 18,
    },
  };
}

export function useTypography(): Typography {
  const { locale } = useLocale();
  return useMemo(() => createTypography(locale), [locale]);
}

