import { useState, useEffect, useCallback } from 'react';
import { RESERVED_DURATION_MS } from '../design/theme';

/**
 * Countdown timer for RESERVED state (15 min)
 * Returns remaining ms, updates every second
 */
export function useReservedCountdown(reservedAt: number | null, onTimeout: () => void) {
  const [remainingMs, setRemainingMs] = useState<number>(RESERVED_DURATION_MS);

  useEffect(() => {
    if (reservedAt === null) {
      setRemainingMs(RESERVED_DURATION_MS);
      return;
    }

    const update = () => {
      const elapsed = Date.now() - reservedAt;
      const remaining = Math.max(0, RESERVED_DURATION_MS - elapsed);
      setRemainingMs(remaining);

      if (remaining <= 0) {
        onTimeout();
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [reservedAt, onTimeout]);

  return remainingMs;
}

/**
 * Elapsed timer for FOCUSED state
 * Returns elapsed ms, updates every second
 */
export function useFocusedElapsed(focusedStartedAt: number | null) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (focusedStartedAt === null) {
      setElapsedMs(0);
      return;
    }

    const update = () => {
      setElapsedMs(Date.now() - focusedStartedAt);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [focusedStartedAt]);

  return elapsedMs;
}

export function formatMsToTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
