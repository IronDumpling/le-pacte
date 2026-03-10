import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Chain } from '../types/chain';

const KEYS = {
  CHAINS: '@lepacte/chains',
  ARCHIVED_CHAINS: '@lepacte/archived_chains',
  PINNED_ARCHIVED_CHAIN_IDS: '@lepacte/pinned_archived_chain_ids',
  ACTIVE_CHAIN_ID: '@lepacte/active_chain_id',
  RESERVED_AT: '@lepacte/reserved_at',
  FOCUSED_STARTED_AT: '@lepacte/focused_started_at',
  COLOR_SCHEME: '@lepacte/color_scheme',
  LOCALE: '@lepacte/locale',
} as const;

export type ColorScheme = 'light' | 'dark' | 'auto';
export type Locale = 'zh' | 'en' | 'fr' | 'ja';

export const storage = {
  async getChains(): Promise<Chain[]> {
    const value = await AsyncStorage.getItem(KEYS.CHAINS);
    if (!value) return [];
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  },

  async setChains(chains: Chain[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.CHAINS, JSON.stringify(chains));
  },

  async getArchivedChains(): Promise<Chain[]> {
    const value = await AsyncStorage.getItem(KEYS.ARCHIVED_CHAINS);
    if (!value) return [];
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  },

  async setArchivedChains(chains: Chain[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.ARCHIVED_CHAINS, JSON.stringify(chains));
  },

  async getPinnedArchivedChainIds(): Promise<string[]> {
    const value = await AsyncStorage.getItem(KEYS.PINNED_ARCHIVED_CHAIN_IDS);
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  async setPinnedArchivedChainIds(ids: string[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.PINNED_ARCHIVED_CHAIN_IDS, JSON.stringify(ids));
  },

  async getActiveChainId(): Promise<string | null> {
    const value = await AsyncStorage.getItem(KEYS.ACTIVE_CHAIN_ID);
    return value || null;
  },

  async setActiveChainId(id: string | null): Promise<void> {
    if (id === null) {
      await AsyncStorage.removeItem(KEYS.ACTIVE_CHAIN_ID);
    } else {
      await AsyncStorage.setItem(KEYS.ACTIVE_CHAIN_ID, id);
    }
  },

  async getReservedAt(): Promise<number | null> {
    const value = await AsyncStorage.getItem(KEYS.RESERVED_AT);
    return value !== null ? parseInt(value, 10) : null;
  },

  async setReservedAt(timestamp: number | null): Promise<void> {
    if (timestamp === null) {
      await AsyncStorage.removeItem(KEYS.RESERVED_AT);
    } else {
      await AsyncStorage.setItem(KEYS.RESERVED_AT, timestamp.toString());
    }
  },

  async getFocusedStartedAt(): Promise<number | null> {
    const value = await AsyncStorage.getItem(KEYS.FOCUSED_STARTED_AT);
    return value !== null ? parseInt(value, 10) : null;
  },

  async setFocusedStartedAt(timestamp: number | null): Promise<void> {
    if (timestamp === null) {
      await AsyncStorage.removeItem(KEYS.FOCUSED_STARTED_AT);
    } else {
      await AsyncStorage.setItem(KEYS.FOCUSED_STARTED_AT, timestamp.toString());
    }
  },

  async getColorScheme(): Promise<ColorScheme | null> {
    const value = await AsyncStorage.getItem(KEYS.COLOR_SCHEME);
    if (value === 'light' || value === 'dark' || value === 'auto') return value;
    return null;
  },

  async setColorScheme(scheme: ColorScheme): Promise<void> {
    await AsyncStorage.setItem(KEYS.COLOR_SCHEME, scheme);
  },

  async getLocale(): Promise<Locale | null> {
    const value = await AsyncStorage.getItem(KEYS.LOCALE);
    if (value === 'zh' || value === 'en' || value === 'fr' || value === 'ja') return value;
    return null;
  },

  async setLocale(locale: Locale): Promise<void> {
    await AsyncStorage.setItem(KEYS.LOCALE, locale);
  },
};
