/**
 * Le Pacte Design System
 * 拟物化、厚重感、工业冷峻风
 */

export const colors = {
  background: '#121212',
  backgroundSecondary: '#1A1A1A',
  primary: '#4A6FA5',
  accent: '#7B8FA1',
  destruction: '#FF3B30',
  success: '#34C759',
  text: '#FFFFFF',
  textMuted: '#8E8E93',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const typography = {
  chainNumber: {
    fontFamily: 'monospace',
    fontWeight: '700' as const,
    fontSize: 48,
  },
  chainLabel: {
    fontFamily: 'monospace',
    fontWeight: '600' as const,
    fontSize: 18,
  },
  title: {
    fontFamily: 'System',
    fontWeight: '600' as const,
    fontSize: 24,
  },
  body: {
    fontFamily: 'System',
    fontWeight: '400' as const,
    fontSize: 16,
  },
  button: {
    fontFamily: 'System',
    fontWeight: '700' as const,
    fontSize: 18,
  },
} as const;

export const shadows = {
  heavyButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  heavyButtonPressed: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
} as const;

export const RESERVED_DURATION_MS = 15 * 60 * 1000; // 15 minutes
