import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Chain } from '../types/chain';

const KEYS = {
  CHAINS: '@lepacte/chains',
  ACTIVE_CHAIN_ID: '@lepacte/active_chain_id',
  RESERVED_AT: '@lepacte/reserved_at',
  FOCUSED_STARTED_AT: '@lepacte/focused_started_at',
} as const;

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
};
