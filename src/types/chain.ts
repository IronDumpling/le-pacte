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
  label: string;
  durationMs: number;
}

export const RESERVATION_OPTIONS: readonly ReservationOption[] = [
  { label: '5秒', durationMs: 5 * 1000 },
  { label: '30秒', durationMs: 30 * 1000 },
  { label: '1分钟', durationMs: 1 * 60 * 1000 },
  { label: '5分钟', durationMs: 5 * 60 * 1000 },
  { label: '10分钟', durationMs: 10 * 60 * 1000 },
  { label: '15分钟', durationMs: 15 * 60 * 1000 },
  { label: '20分钟', durationMs: 20 * 60 * 1000 },
  { label: '25分钟', durationMs: 25 * 60 * 1000 },
  { label: '30分钟', durationMs: 30 * 60 * 1000 },
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
