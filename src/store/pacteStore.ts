import { create } from 'zustand';
import { storage } from '../storage/storage';
import type { Chain } from '../types/chain';
import { createDefaultChain } from '../types/chain';

export type PacteStateType = 'IDLE' | 'RESERVED' | 'FOCUSED' | 'DILEMMA';

export type IdleAnimationType = 'success' | 'break' | null;

interface PacteState {
  currentState: PacteStateType;
  chains: Chain[];
  activeChainId: string | null;
  reservedAt: number | null;
  focusedStartedAt: number | null;
  frozenElapsedMs: number | null;
  lastIdleAnimation: IdleAnimationType;
  _hydrated: boolean;
}

interface PacteActions {
  addChain: () => void;
  setActiveChain: (id: string | null) => void;
  updateChain: (id: string, partial: Partial<Chain>) => void;
  addPrecedentRule: (chainId: string, text: string) => void;
  reserve: () => void;
  enterFocus: () => void;
  timeoutReserved: () => void;
  completeFocus: () => void;
  triggerDilemma: () => void;
  triggerPause: () => void;
  chooseDestruction: () => void;
  chooseCompromise: (exceptionText: string) => void;
  returnToFocus: () => void;
  resumeFromPause: () => void;
  clearIdleAnimation: () => void;
  hydrate: () => Promise<void>;
}

type PacteStore = PacteState & PacteActions;

function persistChains(chains: Chain[]) {
  storage.setChains(chains);
}

export const usePacteStore = create<PacteStore>((set, get) => ({
  currentState: 'IDLE',
  chains: [],
  activeChainId: null,
  reservedAt: null,
  focusedStartedAt: null,
  frozenElapsedMs: null,
  lastIdleAnimation: null,
  _hydrated: false,

  hydrate: async () => {
    const [chains, storedActiveId] = await Promise.all([
      storage.getChains(),
      storage.getActiveChainId(),
    ]);
    const finalChains = chains.length > 0 ? chains : [createDefaultChain()];
    if (chains.length === 0) persistChains(finalChains);
    const validActiveId =
      storedActiveId && finalChains.some((c) => c.id === storedActiveId)
        ? storedActiveId
        : finalChains[0]?.id ?? null;
    if (validActiveId && validActiveId !== storedActiveId) {
      storage.setActiveChainId(validActiveId);
    }
    set({
      chains: finalChains,
      activeChainId: validActiveId,
      _hydrated: true,
    });
  },

  addChain: () => {
    const { chains } = get();
    const newChain = createDefaultChain();
    const next = [...chains, newChain];
    set({ chains: next, activeChainId: newChain.id });
    persistChains(next);
    storage.setActiveChainId(newChain.id);
  },

  setActiveChain: (id: string | null) => {
    set({ activeChainId: id });
    storage.setActiveChainId(id);
  },

  updateChain: (id: string, partial: Partial<Chain>) => {
    const { chains } = get();
    const next = chains.map((c) => (c.id === id ? { ...c, ...partial } : c));
    set({ chains: next });
    persistChains(next);
  },

  addPrecedentRule: (chainId: string, text: string) => {
    const { chains } = get();
    const trimmed = text.trim();
    if (!trimmed) return;
    const next = chains.map((c) => {
      if (c.id !== chainId) return c;
      return {
        ...c,
        precedentRules: [
          ...c.precedentRules,
          { text: trimmed, nodeIndex: -1 },
        ],
      };
    });
    set({ chains: next });
    persistChains(next);
  },

  reserve: () => {
    const { currentState, chains, activeChainId } = get();
    if (currentState !== 'IDLE' || !activeChainId) return;
    const chain = chains.find((c) => c.id === activeChainId);
    if (!chain || chain.focusTargetMs === null) return;
    const now = Date.now();
    set({
      currentState: 'RESERVED',
      reservedAt: now,
      lastIdleAnimation: null,
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
    const { currentState, chains, activeChainId } = get();
    if (currentState !== 'RESERVED' || !activeChainId) return;
    const chain = chains.find((c) => c.id === activeChainId);
    if (!chain) return;
    const next = chains.map((c) =>
      c.id === activeChainId ? { ...c, length: 0 } : c
    );
    set({
      currentState: 'IDLE',
      chains: next,
      reservedAt: null,
      lastIdleAnimation: 'break',
    });
    persistChains(next);
    storage.setReservedAt(null);
  },

  completeFocus: () => {
    const { currentState, chains, activeChainId } = get();
    if (currentState !== 'FOCUSED' || !activeChainId) return;
    const chain = chains.find((c) => c.id === activeChainId);
    if (!chain) return;
    const next = chains.map((c) =>
      c.id === activeChainId ? { ...c, length: c.length + 1 } : c
    );
    set({
      currentState: 'IDLE',
      chains: next,
      focusedStartedAt: null,
      lastIdleAnimation: 'success',
    });
    persistChains(next);
    storage.setFocusedStartedAt(null);
  },

  triggerDilemma: () => {
    const { currentState, focusedStartedAt } = get();
    if (currentState !== 'FOCUSED') return;
    const frozenElapsedMs = focusedStartedAt ? Date.now() - focusedStartedAt : 0;
    set({ currentState: 'DILEMMA', frozenElapsedMs });
  },

  triggerPause: () => {
    const { focusedStartedAt } = get();
    const frozenElapsedMs = focusedStartedAt ? Date.now() - focusedStartedAt : 0;
    set({ frozenElapsedMs });
  },

  chooseDestruction: () => {
    const { currentState, chains, activeChainId } = get();
    if (currentState !== 'DILEMMA' || !activeChainId) return;
    const next = chains.map((c) =>
      c.id === activeChainId
        ? { ...c, length: 0, precedentRules: [] }
        : c
    );
    set({
      currentState: 'IDLE',
      chains: next,
      frozenElapsedMs: null,
      lastIdleAnimation: 'break',
    });
    persistChains(next);
  },

  chooseCompromise: (exceptionText: string) => {
    const { currentState, chains, activeChainId, frozenElapsedMs } = get();
    if (currentState !== 'DILEMMA' || !activeChainId) return;
    const chain = chains.find((c) => c.id === activeChainId);
    if (!chain) return;
    const trimmed = exceptionText.trim();
    const newRule = trimmed
      ? { text: trimmed, nodeIndex: chain.length }
      : null;
    const next = chains.map((c) => {
      if (c.id !== activeChainId) return c;
      const rules = newRule ? [...c.precedentRules, newRule] : c.precedentRules;
      return { ...c, precedentRules: rules };
    });
    const now = Date.now();
    const newFocusedStartedAt =
      frozenElapsedMs !== null ? now - frozenElapsedMs : now;
    set({
      currentState: 'FOCUSED',
      chains: next,
      frozenElapsedMs: null,
      focusedStartedAt: newFocusedStartedAt,
    });
    persistChains(next);
    storage.setFocusedStartedAt(newFocusedStartedAt);
  },

  returnToFocus: () => {
    const { currentState, frozenElapsedMs } = get();
    if (currentState !== 'DILEMMA') return;
    const now = Date.now();
    const newFocusedStartedAt =
      frozenElapsedMs !== null ? now - frozenElapsedMs : now;
    set({
      currentState: 'FOCUSED',
      frozenElapsedMs: null,
      focusedStartedAt: newFocusedStartedAt,
    });
    storage.setFocusedStartedAt(newFocusedStartedAt);
  },

  resumeFromPause: () => {
    const { frozenElapsedMs } = get();
    if (frozenElapsedMs === null) return;
    const now = Date.now();
    set({
      frozenElapsedMs: null,
      focusedStartedAt: now - frozenElapsedMs,
    });
    storage.setFocusedStartedAt(now - frozenElapsedMs);
  },

  clearIdleAnimation: () => {
    set({ lastIdleAnimation: null });
  },
}));
