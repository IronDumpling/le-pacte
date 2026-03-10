export interface PrecedentRule {
  text: string;
  nodeIndex: number;
}

export interface NodePause {
  atMinute: number;
  durationMs: number;
  ruleIndex: number;
}

export interface NodeMetadata {
  extraDurationMs?: number;
  pauses?: NodePause[];
}

export const RESERVATION_OPTIONS = [1, 5, 10, 15, 20, 30] as const;

export interface Chain {
  id: string;
  length: number;
  precedentRules: PrecedentRule[];
  reservationDurationMs: number;
  focusTargetMs: number | null;
  theme: string | null;
  triggerRitual: string | null;
  nodeMetadata?: Record<number, NodeMetadata>;
}

export function createDefaultChain(): Chain {
  return {
    id: `chain_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    length: 0,
    precedentRules: [],
    reservationDurationMs: 15 * 60 * 1000,
    focusTargetMs: null,
    theme: null,
    triggerRitual: null,
  };
}
