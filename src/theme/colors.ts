/**
 * Centralized color definitions for light and dark themes.
 */

export type ColorScheme = 'light' | 'dark' | 'auto';

export type Colors = {
  background: string;
  backgroundSecondary: string;
  focusBackground: string;
  primary: string;
  accent: string;
  destruction: string;
  success: string;
  text: string;
  textMuted: string;
};

export const darkColors: Colors = {
  background: '#121212',
  backgroundSecondary: '#1A1A1A',
  focusBackground: '#1a3d1a',
  primary: '#4A6FA5',
  accent: '#7B8FA1',
  destruction: '#FF3B30',
  success: '#34C759',
  text: '#FFFFFF',
  textMuted: '#8E8E93',
} as const;

export const lightColors: Colors = {
  background: '#F2F2F7',
  backgroundSecondary: '#FFFFFF',
  focusBackground: '#d4ecd4',
  primary: '#2E5A8A',
  accent: '#5A6F7F',
  destruction: '#FF3B30',
  success: '#34C759',
  text: '#000000',
  textMuted: '#6C6C70',
} as const;
