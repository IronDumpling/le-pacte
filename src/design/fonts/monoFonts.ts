const MONO_FONT_CDN_BASE =
  'https://irondumpling.github.io/assets-hub/fonts/robot_mono';

export const MONO_FONT_URIS = {
  RobotoMono_600SemiBold: `${MONO_FONT_CDN_BASE}/RobotoMono-SemiBold.ttf`,
  RobotoMono_700Bold: `${MONO_FONT_CDN_BASE}/RobotoMono-Bold.ttf`,
} as const;

type MonoFontKey = keyof typeof MONO_FONT_URIS;

type MonoFontMap = {
  [K in MonoFontKey]?: { uri: string };
};

export function getMonoFonts(): MonoFontMap {
  return {
    RobotoMono_600SemiBold: { uri: MONO_FONT_URIS.RobotoMono_600SemiBold },
    RobotoMono_700Bold: { uri: MONO_FONT_URIS.RobotoMono_700Bold },
  };
}

