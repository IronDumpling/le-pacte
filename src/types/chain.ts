export interface PrecedentRule {
  text: string;
  nodeIndex: number;
}

export interface NodePause {
  /** 暂停发生时的已过时间（毫秒），用于显示 mm:ss */
  atElapsedMs: number;
  durationMs: number;
  ruleIndex: number;
}

export interface NodeMetadata {
  extraDurationMs?: number;
  pauses?: NodePause[];
}

export interface ReservationOption {
  durationMs: number;
}

export const RESERVATION_OPTIONS: readonly ReservationOption[] = [
  { durationMs: 5 * 1000 },
  { durationMs: 30 * 1000 },
  { durationMs: 1 * 60 * 1000 },
  { durationMs: 5 * 60 * 1000 },
  { durationMs: 10 * 60 * 1000 },
  { durationMs: 15 * 60 * 1000 },
  { durationMs: 20 * 60 * 1000 },
  { durationMs: 25 * 60 * 1000 },
  { durationMs: 30 * 60 * 1000 },
] as const;

export interface Chain {
  id: string;
  length: number;
  precedentRules: PrecedentRule[];
  reservationDurationMs: number;
  reservationDurationLocked?: boolean;
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
    reservationDurationLocked: false,
    focusTargetMs: null,
    theme: null,
    triggerRitual: null,
  };
}
