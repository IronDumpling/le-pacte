import { useMemo } from 'react';
import type { Locale } from '../storage/storage';
import { useLocale } from '../i18n/LocaleContext';

type FontWeightKey = 'regular' | 'semibold' | 'bold';

type FontTriple = {
  regular: string;
  semibold: string;
  bold: string;
};

type MonoTypography = {
  /** 大号数字：倒计时、计时、水印等 */
  numberXL: { fontFamily: string; fontWeight: '700'; fontSize: number };
  /** 中号数字：如 CHAIN #10、小徽章数字等 */
  numberM: { fontFamily: string; fontWeight: '700'; fontSize: number };
  /** 技术标签：如 CHAIN、小标签文字等 */
  label: { fontFamily: string; fontWeight: '600'; fontSize: number; letterSpacing: number };
};

type SansTypography = {
  titleXL: { fontFamily: string; fontWeight: '600'; fontSize: number; letterSpacing: number };
  title: { fontFamily: string; fontWeight: '600'; fontSize: number; letterSpacing: number };
  body: { fontFamily: string; fontWeight: '400'; fontSize: number };
  button: { fontFamily: string; fontWeight: '700'; fontSize: number; letterSpacing: number };
};

type SerifTypography = {
  title: { fontFamily: string; fontWeight: '700'; fontSize: number; letterSpacing: number };
  subtitle: { fontFamily: string; fontWeight: '600'; fontSize: number; letterSpacing: number };
  body: { fontFamily: string; fontWeight: '400' | '600'; fontSize: number; lineHeight: number };
};

export type Typography = {
  mono: MonoTypography;
  sans: SansTypography;
  serif: SerifTypography;
  /**
   * 兼容旧代码的字段：
   * - chainNumber：等同 mono.numberXL
   * - chainLabel：等同 mono.label
   * - title：等同 sans.title
   * - body：等同 sans.body
   * - button：等同 sans.button
   */
  chainNumber: MonoTypography['numberXL'];
  chainLabel: MonoTypography['label'];
  title: SansTypography['title'];
  body: SansTypography['body'];
  button: SansTypography['button'];
};

const MONO_KEYS: FontTriple = {
  regular: 'RobotoMono_400Regular',
  semibold: 'RobotoMono_600SemiBold',
  bold: 'RobotoMono_700Bold',
};

function sansKeys(locale: Locale): FontTriple {
  const base = locale === 'ja' ? 'NotoSansJP' : 'NotoSansSC';
  return {
    regular: `${base}_400Regular`,
    semibold: `${base}_600SemiBold`,
    bold: `${base}_700Bold`,
  };
}

function serifKeys(locale: Locale): FontTriple {
  const base = locale === 'ja' ? 'NotoSerifJP' : 'NotoSerifSC';
  return {
    regular: `${base}_400Regular`,
    semibold: `${base}_600SemiBold`,
    bold: `${base}_700Bold`,
  };
}

export function createTypography(locale: Locale): Typography {
  const sans = sansKeys(locale);
  const serif = serifKeys(locale);

  const mono: MonoTypography = {
    numberXL: {
      fontFamily: MONO_KEYS.bold,
      fontWeight: '700',
      fontSize: 52,
    },
    numberM: {
      fontFamily: MONO_KEYS.bold,
      fontWeight: '700',
      fontSize: 36,
    },
    label: {
      fontFamily: MONO_KEYS.semibold,
      fontWeight: '600',
      fontSize: 14,
      letterSpacing: 2.5,
    },
  };

  const sansTypography: SansTypography = {
    titleXL: {
      fontFamily: sans.semibold,
      fontWeight: '600',
      fontSize: 32,
      letterSpacing: 0.5,
    },
    title: {
      fontFamily: sans.semibold,
      fontWeight: '600',
      fontSize: 26,
      letterSpacing: 0.5,
    },
    body: {
      fontFamily: sans.regular,
      fontWeight: '400',
      fontSize: 16,
    },
    button: {
      fontFamily: sans.bold,
      fontWeight: '700',
      fontSize: 18,
      letterSpacing: 1.5,
    },
  };

  const serifTypography: SerifTypography = {
    title: {
      fontFamily: serif.bold,
      fontWeight: '700',
      fontSize: 24,
      letterSpacing: 0.5,
    },
    subtitle: {
      fontFamily: serif.semibold,
      fontWeight: '600',
      fontSize: 18,
      letterSpacing: 0.5,
    },
    body: {
      fontFamily: serif.regular,
      fontWeight: '400',
      fontSize: 16,
      lineHeight: 22,
    },
  };

  return {
    mono,
    sans: sansTypography,
    serif: serifTypography,
    // 兼容旧字段
    chainNumber: mono.numberXL,
    chainLabel: mono.label,
    title: sansTypography.title,
    body: sansTypography.body,
    button: sansTypography.button,
  };
}

export function useTypography(): Typography {
  const { locale } = useLocale();
  return useMemo(() => createTypography(locale), [locale]);
}

