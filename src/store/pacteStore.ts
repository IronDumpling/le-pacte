import { create } from 'zustand';
import { storage } from '../storage/storage';
import type { Chain, NodeMetadata, NodePause } from '../types/chain';
import { createDefaultChain } from '../types/chain';

export type PacteStateType = 'IDLE' | 'RESERVED' | 'FOCUSED' | 'DILEMMA';

export type IdleAnimationType = 'success' | 'break' | null;

export interface PauseReason {
  ruleIndex: number;
  text: string;
}

interface SessionPause {
  atElapsedMs: number;
  startMs: number;
  ruleIndex: number;
  durationMs?: number;
}

interface PacteState {
  currentState: PacteStateType;
  chains: Chain[];
  archivedChains: Chain[];
  activeChainId: string | null;
  reservedAt: number | null;
  focusedStartedAt: number | null;
  frozenElapsedMs: number | null;
  pauseReason: PauseReason | null;
  currentSessionPauses: SessionPause[];
  lastIdleAnimation: IdleAnimationType;
  _hydrated: boolean;
}

interface PacteActions {
  addChain: () => void;
  archiveChain: (id: string) => void;
  unarchiveChain: (id: string) => void;
  deleteArchivedChain: (id: string) => void;
  pinArchivedChain: (id: string) => void;
  setActiveChain: (id: string | null) => void;
  updateChain: (id: string, partial: Partial<Chain>) => void;
  addPrecedentRule: (chainId: string, text: string) => void;
  reserve: () => void;
  enterFocus: () => void;
  timeoutReserved: () => void;
  completeFocus: () => void;
  triggerDilemma: () => void;
  triggerPause: (ruleIndex: number, ruleText: string) => void;
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

function persistArchivedChains(archivedChains: Chain[]) {
  storage.setArchivedChains(archivedChains);
}

export const usePacteStore = create<PacteStore>((set, get) => ({
  currentState: 'IDLE',
  chains: [],
  archivedChains: [],
  activeChainId: null,
  reservedAt: null,
  focusedStartedAt: null,
  frozenElapsedMs: null,
  pauseReason: null,
  currentSessionPauses: [],
  lastIdleAnimation: null,
  _hydrated: false,

  hydrate: async () => {
    const [chains, archivedChains, storedActiveId] = await Promise.all([
      storage.getChains(),
      storage.getArchivedChains(),
      storage.getActiveChainId(),
    ]);
    let finalChains = chains.length > 0 ? chains : [createDefaultChain()];
    if (chains.length > 0) {
      finalChains = finalChains.map((c) => {
        let nodeMetadata = c.nodeMetadata;
        if (nodeMetadata) {
          nodeMetadata = { ...nodeMetadata };
          for (const key of Object.keys(nodeMetadata)) {
            const meta = nodeMetadata[Number(key)];
            if (meta?.pauses?.length) {
              type LegacyPause = { atMinute: number; durationMs: number; ruleIndex: number };
              nodeMetadata[Number(key)] = {
                ...meta,
                pauses: meta.pauses.map((p: NodePause | LegacyPause): NodePause =>
                  'atElapsedMs' in p
                    ? p
                    : { atElapsedMs: (p as LegacyPause).atMinute * 60_000, durationMs: (p as LegacyPause).durationMs, ruleIndex: (p as LegacyPause).ruleIndex }
                ),
              };
            }
          }
        }
        return {
          ...c,
          nodeMetadata,
          reservationDurationLocked:
            c.reservationDurationLocked === undefined
              ? true
              : c.reservationDurationLocked,
        };
      });
      persistChains(finalChains);
    }
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
      archivedChains: archivedChains ?? [],
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

  archiveChain: (id: string) => {
    const { chains, archivedChains, activeChainId } = get();
    const chain = chains.find((c) => c.id === id);
    if (!chain) return;
    const nextChains = chains.filter((c) => c.id !== id);
    const nextArchived = [...archivedChains, chain];
    let newActiveId = activeChainId;
    if (activeChainId === id) {
      newActiveId = nextChains[0]?.id ?? null;
      storage.setActiveChainId(newActiveId);
    }
    if (nextChains.length === 0) {
      const defaultChain = createDefaultChain();
      nextChains.push(defaultChain);
      newActiveId = defaultChain.id;
      storage.setActiveChainId(newActiveId);
    }
    set({
      chains: nextChains,
      archivedChains: nextArchived,
      activeChainId: newActiveId,
    });
    persistChains(nextChains);
    persistArchivedChains(nextArchived);
  },

  unarchiveChain: (id: string) => {
    const { chains, archivedChains } = get();
    const chain = archivedChains.find((c) => c.id === id);
    if (!chain) return;
    const nextArchived = archivedChains.filter((c) => c.id !== id);
    const nextChains = [...chains, chain];
    set({ chains: nextChains, archivedChains: nextArchived });
    persistChains(nextChains);
    persistArchivedChains(nextArchived);
  },

  deleteArchivedChain: (id: string) => {
    const { archivedChains } = get();
    const next = archivedChains.filter((c) => c.id !== id);
    set({ archivedChains: next });
    persistArchivedChains(next);
  },

  pinArchivedChain: (id: string) => {
    const { archivedChains } = get();
    const chain = archivedChains.find((c) => c.id === id);
    if (!chain) return;
    const next = [chain, ...archivedChains.filter((c) => c.id !== id)];
    set({ archivedChains: next });
    persistArchivedChains(next);
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
    const {
      currentState,
      chains,
      activeChainId,
      focusedStartedAt,
      currentSessionPauses,
    } = get();
    if (currentState !== 'FOCUSED' || !activeChainId) return;
    const chain = chains.find((c) => c.id === activeChainId);
    if (!chain || chain.focusTargetMs === null) return;
    const elapsedMs = focusedStartedAt ? Date.now() - focusedStartedAt : 0;
    const targetMs = chain.focusTargetMs;
    const extraDurationMs =
      elapsedMs > targetMs ? elapsedMs - targetMs : undefined;
    const pauses: NodePause[] = currentSessionPauses
      .filter((p) => p.durationMs !== undefined)
      .map((p) => ({
        atElapsedMs: p.atElapsedMs,
        durationMs: p.durationMs!,
        ruleIndex: p.ruleIndex,
      }));
    const newNodeIndex = chain.length;
    const metadata: NodeMetadata = {};
    if (extraDurationMs !== undefined) metadata.extraDurationMs = extraDurationMs;
    if (pauses.length > 0) metadata.pauses = pauses;
    const next = chains.map((c) => {
      if (c.id !== activeChainId) return c;
      const nodeMetadata = {
        ...(c.nodeMetadata ?? {}),
        [newNodeIndex]: metadata,
      };
      return {
        ...c,
        length: c.length + 1,
        nodeMetadata: Object.keys(metadata).length > 0 ? nodeMetadata : c.nodeMetadata,
      };
    });
    set({
      currentState: 'IDLE',
      chains: next,
      focusedStartedAt: null,
      currentSessionPauses: [],
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

  triggerPause: (ruleIndex: number, ruleText: string) => {
    const { focusedStartedAt, currentSessionPauses } = get();
    const elapsedMs = focusedStartedAt ? Date.now() - focusedStartedAt : 0;
    set({
      frozenElapsedMs: elapsedMs,
      pauseReason: { ruleIndex, text: ruleText },
      currentSessionPauses: [
        ...currentSessionPauses,
        { atElapsedMs: elapsedMs, startMs: Date.now(), ruleIndex },
      ],
    });
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
      currentSessionPauses: [],
      lastIdleAnimation: 'break',
    });
    persistChains(next);
  },

  chooseCompromise: (exceptionText: string) => {
    const { currentState, chains, activeChainId, frozenElapsedMs, currentSessionPauses } = get();
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
    const rulesAfterAdd = next.find((c) => c.id === activeChainId)!
      .precedentRules;
    const ruleDisplayIndex = rulesAfterAdd.length;
    const elapsedMs = frozenElapsedMs ?? 0;
    const sessionPauses =
      newRule && trimmed
        ? [
            ...currentSessionPauses,
            { atElapsedMs: elapsedMs, startMs: now, ruleIndex: ruleDisplayIndex },
          ]
        : currentSessionPauses;
    set({
      currentState: 'FOCUSED',
      chains: next,
      frozenElapsedMs: elapsedMs,
      pauseReason: newRule
        ? { ruleIndex: ruleDisplayIndex, text: newRule.text }
        : null,
      currentSessionPauses: sessionPauses,
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
      pauseReason: null,
      focusedStartedAt: newFocusedStartedAt,
    });
    storage.setFocusedStartedAt(newFocusedStartedAt);
  },

  resumeFromPause: () => {
    const { frozenElapsedMs, currentSessionPauses } = get();
    if (frozenElapsedMs === null) return;
    const now = Date.now();
    const last = currentSessionPauses[currentSessionPauses.length - 1];
    const updated =
      last && last.durationMs === undefined
        ? [
            ...currentSessionPauses.slice(0, -1),
            { ...last, durationMs: now - last.startMs },
          ]
        : currentSessionPauses;
    set({
      frozenElapsedMs: null,
      pauseReason: null,
      currentSessionPauses: updated,
      focusedStartedAt: now - frozenElapsedMs,
    });
    storage.setFocusedStartedAt(now - frozenElapsedMs);
  },

  clearIdleAnimation: () => {
    set({ lastIdleAnimation: null });
  },
}));
