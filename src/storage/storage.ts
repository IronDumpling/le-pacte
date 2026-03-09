import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  CHAIN_COUNT: '@lepacte/chain_count',
  PRECEDENT_LOG: '@lepacte/precedent_log',
  RESERVED_AT: '@lepacte/reserved_at',
  FOCUSED_STARTED_AT: '@lepacte/focused_started_at',
} as const;

export const storage = {
  async getChainCount(): Promise<number> {
    const value = await AsyncStorage.getItem(KEYS.CHAIN_COUNT);
    return value !== null ? parseInt(value, 10) : 0;
  },

  async setChainCount(count: number): Promise<void> {
    await AsyncStorage.setItem(KEYS.CHAIN_COUNT, count.toString());
  },

  async getPrecedentLog(): Promise<string[]> {
    const value = await AsyncStorage.getItem(KEYS.PRECEDENT_LOG);
    if (!value) return [];
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  },

  async setPrecedentLog(log: string[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.PRECEDENT_LOG, JSON.stringify(log));
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
