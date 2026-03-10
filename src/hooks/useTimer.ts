import { useState, useEffect } from 'react';

/**
 * Countdown timer for RESERVED state
 * Returns remaining ms, updates every second
 */
export function useReservedCountdown(
  reservedAt: number | null,
  durationMs: number,
  onTimeout: () => void
) {
  const [remainingMs, setRemainingMs] = useState(durationMs);

  useEffect(() => {
    if (reservedAt === null) {
      setRemainingMs(durationMs);
      return;
    }

    const update = () => {
      const elapsed = Date.now() - reservedAt;
      const remaining = Math.max(0, durationMs - elapsed);
      setRemainingMs(remaining);

      if (remaining <= 0) {
        onTimeout();
      }
    };

    update();
    const interval = setInterval(update, 100);
    return () => clearInterval(interval);
  }, [reservedAt, durationMs, onTimeout]);

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

/**
 * Target countdown for FOCUSED state
 * Returns remaining ms until target, 0 when target reached
 */
export function useFocusCountdown(
  focusedStartedAt: number | null,
  targetMs: number
) {
  const [remainingMs, setRemainingMs] = useState(targetMs);

  useEffect(() => {
    if (focusedStartedAt === null) {
      setRemainingMs(targetMs);
      return;
    }

    const update = () => {
      const elapsed = Date.now() - focusedStartedAt;
      const remaining = Math.max(0, targetMs - elapsed);
      setRemainingMs(remaining);
    };

    update();
    const interval = setInterval(update, 100);
    return () => clearInterval(interval);
  }, [focusedStartedAt, targetMs]);

  return remainingMs;
}

export function formatMsToTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
