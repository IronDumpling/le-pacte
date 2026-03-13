import type { Locale } from '../../storage/storage';

const FONT_CDN_BASE =
  'https://irondumpling.github.io/assets-hub/fonts/noto_serif';

export const SERIF_FONT_URIS = {
  NotoSerifSC_400Regular: `${FONT_CDN_BASE}/NotoSerifSC-Regular.ttf`,
  NotoSerifSC_600SemiBold: `${FONT_CDN_BASE}/NotoSerifSC-SemiBold.ttf`,
  NotoSerifSC_700Bold: `${FONT_CDN_BASE}/NotoSerifSC-Bold.ttf`,
  NotoSerifJP_400Regular: `${FONT_CDN_BASE}/NotoSerifJP-Regular.ttf`,
  NotoSerifJP_600SemiBold: `${FONT_CDN_BASE}/NotoSerifJP-SemiBold.ttf`,
  NotoSerifJP_700Bold: `${FONT_CDN_BASE}/NotoSerifJP-Bold.ttf`,
} as const;

type SerifFontKey = keyof typeof SERIF_FONT_URIS;

type SerifFontMap = {
  [K in SerifFontKey]?: { uri: string };
};

export function getSerifFontsForLocale(locale: Locale): SerifFontMap {
  const isJa = locale === 'ja';

  if (isJa) {
    return {
      NotoSerifJP_400Regular: { uri: SERIF_FONT_URIS.NotoSerifJP_400Regular },
      NotoSerifJP_600SemiBold: { uri: SERIF_FONT_URIS.NotoSerifJP_600SemiBold },
      NotoSerifJP_700Bold: { uri: SERIF_FONT_URIS.NotoSerifJP_700Bold },
    };
  }

  return {
    NotoSerifSC_400Regular: { uri: SERIF_FONT_URIS.NotoSerifSC_400Regular },
    NotoSerifSC_600SemiBold: { uri: SERIF_FONT_URIS.NotoSerifSC_600SemiBold },
    NotoSerifSC_700Bold: { uri: SERIF_FONT_URIS.NotoSerifSC_700Bold },
  };
}

