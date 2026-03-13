import type { Locale } from '../../storage/storage';

const SANS_FONT_CDN_BASE =
  'https://irondumpling.github.io/assets-hub/fonts/noto_sans';

export const SANS_FONT_URIS = {
  NotoSansSC_400Regular: `${SANS_FONT_CDN_BASE}/NotoSansSC-Regular.ttf`,
  NotoSansSC_600SemiBold: `${SANS_FONT_CDN_BASE}/NotoSansSC-SemiBold.ttf`,
  NotoSansSC_700Bold: `${SANS_FONT_CDN_BASE}/NotoSansSC-Bold.ttf`,
  NotoSansJP_400Regular: `${SANS_FONT_CDN_BASE}/NotoSansJP-Regular.ttf`,
  NotoSansJP_600SemiBold: `${SANS_FONT_CDN_BASE}/NotoSansJP-SemiBold.ttf`,
  NotoSansJP_700Bold: `${SANS_FONT_CDN_BASE}/NotoSansJP-Bold.ttf`,
} as const;

type SansFontKey = keyof typeof SANS_FONT_URIS;

type SansFontMap = {
  [K in SansFontKey]?: { uri: string };
};

type GetSansOptions = {
  /** 仅在 locale === 'ja' 时加载 JP 字体，避免与本地 SC 重复 */
  jpOnly?: boolean;
};

export function getSansFontsForLocale(
  locale: Locale,
  options: GetSansOptions = {}
): SansFontMap {
  const isJa = locale === 'ja';
  const { jpOnly } = options;

  if (jpOnly) {
    if (!isJa) return {};
    return {
      NotoSansJP_400Regular: { uri: SANS_FONT_URIS.NotoSansJP_400Regular },
      NotoSansJP_600SemiBold: { uri: SANS_FONT_URIS.NotoSansJP_600SemiBold },
      NotoSansJP_700Bold: { uri: SANS_FONT_URIS.NotoSansJP_700Bold },
    };
  }

  if (isJa) {
    return {
      NotoSansJP_400Regular: { uri: SANS_FONT_URIS.NotoSansJP_400Regular },
      NotoSansJP_600SemiBold: { uri: SANS_FONT_URIS.NotoSansJP_600SemiBold },
      NotoSansJP_700Bold: { uri: SANS_FONT_URIS.NotoSansJP_700Bold },
    };
  }

  return {
    NotoSansSC_400Regular: { uri: SANS_FONT_URIS.NotoSansSC_400Regular },
    NotoSansSC_600SemiBold: { uri: SANS_FONT_URIS.NotoSansSC_600SemiBold },
    NotoSansSC_700Bold: { uri: SANS_FONT_URIS.NotoSansSC_700Bold },
  };
}

