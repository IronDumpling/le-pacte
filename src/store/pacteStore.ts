import { create } from 'zustand';
import { storage } from '../storage/storage';
import type { Chain, NodeMetadata, NodePause } from '../types/chain';
import { createDefaultChain } from '../types/chain';

export type PacteStateType = 'IDLE' | 'RESERVED' | 'FOCUSED' | 'DILEMMA';
export type DilemmaSource = 'minimize' | 'exit' | null;

export type IdleAnimationType = 'success' | 'break' | null;

export interface PauseReason {
  ruleIndex: number;
  text: string;
}

/** startMs = wall-clock when the pause segment began (triggerDilemma), not when the user confirms the rule */
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
  pinnedArchivedChainIds: string[];
  activeChainId: string | null;
  reservedAt: number | null;
  focusedStartedAt: number | null;
  frozenElapsedMs: number | null;
  pauseReason: PauseReason | null;
  currentSessionPauses: SessionPause[];
  lastIdleAnimation: IdleAnimationType;
  pendingDestructionChainId: string | null;
  destructionStartedAt: number | null;
  dilemmaSource: DilemmaSource;
  /** Wall-clock Date.now() when triggerDilemma ran (background or exit); used as SessionPause.startMs */
  dilemmaPauseStartedAt: number | null;
  _hydrated: boolean;
}

interface PacteActions {
  addChain: () => void;
  archiveChain: (id: string) => void;
  unarchiveChain: (id: string) => void;
  deleteArchivedChain: (id: string) => void;
  pinArchivedChain: (id: string) => void;
  unpinArchivedChain: (id: string) => void;
  setActiveChain: (id: string | null) => void;
  updateChain: (id: string, partial: Partial<Chain>) => void;
  addPrecedentRule: (chainId: string, text: string) => void;
  deletePrecedentRule: (chainId: string, ruleIndex: number) => void;
  updatePrecedentRule: (chainId: string, ruleIndex: number, newText: string) => void;
  reserve: () => void;
  enterFocus: () => void;
  timeoutReserved: () => void;
  completeFocus: () => void;
  triggerDilemma: (source?: DilemmaSource) => void;
  chooseDestruction: () => void;
  finalizeDestruction: (chainId: string) => void;
  chooseCompromise: (exceptionText: string) => void;
  chooseExistingRule: (ruleIndex: number, ruleText: string) => void;
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
  pinnedArchivedChainIds: [],
  activeChainId: null,
  reservedAt: null,
  focusedStartedAt: null,
  frozenElapsedMs: null,
  pauseReason: null,
  currentSessionPauses: [],
  lastIdleAnimation: null,
  pendingDestructionChainId: null,
  destructionStartedAt: null,
  dilemmaSource: null,
  dilemmaPauseStartedAt: null,
  _hydrated: false,

  hydrate: async () => {
    const [chains, archivedChains, pinnedArchivedChainIds, storedActiveId, focusedStartedAtStored] = await Promise.all([
      storage.getChains(),
      storage.getArchivedChains(),
      storage.getPinnedArchivedChainIds(),
      storage.getActiveChainId(),
      storage.getFocusedStartedAt(),
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
    // If focusedStartedAt is persisted, the app was killed during a FOCUSED session.
    // Treat this as a failure: reset the active chain's length and clear the session.
    let finalChainsAfterKill = finalChains;
    if (focusedStartedAtStored !== null && validActiveId) {
      finalChainsAfterKill = finalChains.map((c) =>
        c.id === validActiveId
          ? { ...c, length: 0, precedentRules: [], nodeMetadata: undefined }
          : c
      );
      persistChains(finalChainsAfterKill);
      storage.setFocusedStartedAt(null);
    }

    set({
      chains: finalChainsAfterKill,
      archivedChains: archivedChains ?? [],
      pinnedArchivedChainIds: pinnedArchivedChainIds ?? [],
      activeChainId: validActiveId,
      lastIdleAnimation: focusedStartedAtStored !== null ? 'break' : null,
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
    const { chains, archivedChains, pinnedArchivedChainIds } = get();
    const chain = archivedChains.find((c) => c.id === id);
    if (!chain) return;
    const nextArchived = archivedChains.filter((c) => c.id !== id);
    const nextPinned = pinnedArchivedChainIds.filter((x) => x !== id);
    const nextChains = [...chains, chain];
    set({ chains: nextChains, archivedChains: nextArchived, pinnedArchivedChainIds: nextPinned });
    persistChains(nextChains);
    persistArchivedChains(nextArchived);
    storage.setPinnedArchivedChainIds(nextPinned);
  },

  deleteArchivedChain: (id: string) => {
    const { archivedChains, pinnedArchivedChainIds } = get();
    const next = archivedChains.filter((c) => c.id !== id);
    const nextPinned = pinnedArchivedChainIds.filter((x) => x !== id);
    set({ archivedChains: next, pinnedArchivedChainIds: nextPinned });
    persistArchivedChains(next);
    storage.setPinnedArchivedChainIds(nextPinned);
  },

  pinArchivedChain: (id: string) => {
    const { archivedChains, pinnedArchivedChainIds } = get();
    const chain = archivedChains.find((c) => c.id === id);
    if (!chain) return;
    const nextPinned = pinnedArchivedChainIds.includes(id)
      ? pinnedArchivedChainIds
      : [id, ...pinnedArchivedChainIds.filter((x) => x !== id)];
    set({ pinnedArchivedChainIds: nextPinned });
    storage.setPinnedArchivedChainIds(nextPinned);
  },

  unpinArchivedChain: (id: string) => {
    const { pinnedArchivedChainIds } = get();
    const nextPinned = pinnedArchivedChainIds.filter((x) => x !== id);
    set({ pinnedArchivedChainIds: nextPinned });
    storage.setPinnedArchivedChainIds(nextPinned);
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

  deletePrecedentRule: (chainId: string, ruleIndex: number) => {
    const { chains } = get();
    const next = chains.map((c) => {
      if (c.id !== chainId) return c;
      return {
        ...c,
        precedentRules: c.precedentRules.filter((_, i) => i !== ruleIndex),
      };
    });
    set({ chains: next });
    persistChains(next);
  },

  updatePrecedentRule: (chainId: string, ruleIndex: number, newText: string) => {
    const { chains } = get();
    const trimmed = newText.trim();
    if (!trimmed) return;
    const next = chains.map((c) => {
      if (c.id !== chainId) return c;
      return {
        ...c,
        precedentRules: c.precedentRules.map((r, i) =>
          i === ruleIndex ? { ...r, text: trimmed } : r
        ),
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

  triggerDilemma: (source: DilemmaSource = 'exit') => {
    const { currentState, focusedStartedAt } = get();
    if (currentState !== 'FOCUSED') return;
    const now = Date.now();
    const frozenElapsedMs = focusedStartedAt ? now - focusedStartedAt : 0;
    set({
      currentState: 'DILEMMA',
      frozenElapsedMs,
      dilemmaSource: source,
      dilemmaPauseStartedAt: now,
    });
  },

  chooseDestruction: () => {
    const { currentState, activeChainId } = get();
    if (currentState !== 'DILEMMA' || !activeChainId) return;
    const now = Date.now();
    set({
      currentState: 'IDLE',
      frozenElapsedMs: null,
      currentSessionPauses: [],
      lastIdleAnimation: 'break',
      pendingDestructionChainId: activeChainId,
      destructionStartedAt: now,
      dilemmaSource: null,
      dilemmaPauseStartedAt: null,
    });
    storage.setFocusedStartedAt(null);
  },

  finalizeDestruction: (chainId: string) => {
    const { chains, pendingDestructionChainId } = get();
    if (!pendingDestructionChainId || pendingDestructionChainId !== chainId) {
      return;
    }
    const next = chains.map((c) =>
      c.id === chainId ? { ...c, length: 0, precedentRules: [], nodeMetadata: undefined } : c
    );
    set({
      chains: next,
      pendingDestructionChainId: null,
      destructionStartedAt: null,
    });
    persistChains(next);
  },

  chooseCompromise: (exceptionText: string) => {
    const {
      currentState,
      chains,
      activeChainId,
      frozenElapsedMs,
      currentSessionPauses,
      dilemmaPauseStartedAt,
    } = get();
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
    const pauseWallClockStart = dilemmaPauseStartedAt ?? now;
    const sessionPauses =
      newRule && trimmed
        ? [
            ...currentSessionPauses,
            {
              atElapsedMs: elapsedMs,
              startMs: pauseWallClockStart,
              ruleIndex: ruleDisplayIndex,
            },
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
      dilemmaSource: null,
      dilemmaPauseStartedAt: null,
    });
    persistChains(next);
    storage.setFocusedStartedAt(newFocusedStartedAt);
  },

  chooseExistingRule: (ruleIndex: number, ruleText: string) => {
    const { currentState, frozenElapsedMs, currentSessionPauses, dilemmaPauseStartedAt } = get();
    if (currentState !== 'DILEMMA') return;
    const now = Date.now();
    const elapsedMs = frozenElapsedMs ?? 0;
    const newFocusedStartedAt = frozenElapsedMs !== null ? now - frozenElapsedMs : now;
    const pauseWallClockStart = dilemmaPauseStartedAt ?? now;
    set({
      currentState: 'FOCUSED',
      frozenElapsedMs: elapsedMs,
      pauseReason: { ruleIndex, text: ruleText },
      currentSessionPauses: [
        ...currentSessionPauses,
        { atElapsedMs: elapsedMs, startMs: pauseWallClockStart, ruleIndex },
      ],
      focusedStartedAt: newFocusedStartedAt,
      dilemmaSource: null,
      dilemmaPauseStartedAt: null,
    });
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
      dilemmaSource: null,
      dilemmaPauseStartedAt: null,
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
