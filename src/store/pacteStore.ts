import { create } from 'zustand';
import { storage } from '../storage/storage';
import { RESERVED_DURATION_MS } from '../design/theme';

export type PacteStateType = 'IDLE' | 'RESERVED' | 'FOCUSED' | 'DILEMMA';

interface PacteState {
  currentState: PacteStateType;
  chainCount: number;
  precedentLog: string[];
  reservedAt: number | null;
  focusedStartedAt: number | null;
  frozenElapsedMs: number | null;
  backgroundTimestamp: number | null;
  _hydrated: boolean;
}

interface PacteActions {
  reserve: () => void;
  enterFocus: () => void;
  timeoutReserved: () => void;
  completeFocus: () => void;
  triggerDilemma: () => void;
  chooseDestruction: () => void;
  chooseCompromise: (exceptionText: string) => void;
  setBackgroundTimestamp: (ts: number | null) => void;
  adjustReservedForBackground: (elapsedMs: number) => void;
  hydrate: () => Promise<void>;
}

type PacteStore = PacteState & PacteActions;

export const usePacteStore = create<PacteStore>((set, get) => ({
  currentState: 'IDLE',
  chainCount: 0,
  precedentLog: [],
  reservedAt: null,
  focusedStartedAt: null,
  frozenElapsedMs: null,
  backgroundTimestamp: null,
  _hydrated: false,

  hydrate: async () => {
    const [chainCount, precedentLog] = await Promise.all([
      storage.getChainCount(),
      storage.getPrecedentLog(),
    ]);
    set({
      chainCount,
      precedentLog,
      _hydrated: true,
    });
  },

  reserve: () => {
    const { currentState } = get();
    if (currentState !== 'IDLE') return;
    const now = Date.now();
    set({
      currentState: 'RESERVED',
      reservedAt: now,
    });
    storage.setReservedAt(now);
  },

  enterFocus: () => {
    const { currentState } = get();
    if (currentState !== 'RESERVED') return;
    const now = Date.now();
    set({
      currentState: 'FOCUSED',
      reservedAt: null,
      focusedStartedAt: now,
    });
    storage.setReservedAt(null);
    storage.setFocusedStartedAt(now);
  },

  timeoutReserved: () => {
    const { currentState } = get();
    if (currentState !== 'RESERVED') return;
    set({
      currentState: 'IDLE',
      chainCount: 0,
      reservedAt: null,
    });
    storage.setChainCount(0);
    storage.setReservedAt(null);
  },

  completeFocus: () => {
    const { currentState, chainCount } = get();
    if (currentState !== 'FOCUSED') return;
    const newCount = chainCount + 1;
    set({
      currentState: 'IDLE',
      chainCount: newCount,
      focusedStartedAt: null,
    });
    storage.setChainCount(newCount);
    storage.setFocusedStartedAt(null);
  },

  triggerDilemma: () => {
    const { currentState, focusedStartedAt } = get();
    if (currentState !== 'FOCUSED') return;
    const frozenElapsedMs = focusedStartedAt ? Date.now() - focusedStartedAt : 0;
    set({
      currentState: 'DILEMMA',
      frozenElapsedMs,
    });
  },

  chooseDestruction: () => {
    const { currentState } = get();
    if (currentState !== 'DILEMMA') return;
    set({
      currentState: 'IDLE',
      chainCount: 0,
      frozenElapsedMs: null,
    });
    storage.setChainCount(0);
  },

  chooseCompromise: (exceptionText: string) => {
    const { currentState, precedentLog, frozenElapsedMs } = get();
    if (currentState !== 'DILEMMA') return;
    const trimmed = exceptionText.trim();
    const newLog = trimmed ? [...precedentLog, trimmed] : precedentLog;
    const now = Date.now();
    const newFocusedStartedAt = frozenElapsedMs !== null ? now - frozenElapsedMs : now;
    set({
      currentState: 'FOCUSED',
      precedentLog: newLog,
      frozenElapsedMs: null,
      focusedStartedAt: newFocusedStartedAt,
    });
    storage.setPrecedentLog(newLog);
    storage.setFocusedStartedAt(newFocusedStartedAt);
  },

  setBackgroundTimestamp: (ts: number | null) => {
    set({ backgroundTimestamp: ts });
  },

  adjustReservedForBackground: (elapsedMs: number) => {
    const { currentState, reservedAt } = get();
    if (currentState !== 'RESERVED' || reservedAt === null) return;
    const newReservedAt = reservedAt + elapsedMs;
    set({ reservedAt: newReservedAt });
    storage.setReservedAt(newReservedAt);
  },
}));
