import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { usePacteStore } from '../store/pacteStore';
import { HeavyButton } from '../design/components';
import { useReservedCountdown, formatMsToTime } from '../hooks/useTimer';
import { colors, typography, spacing } from '../design/theme';

const LAST_PHASE_MS = 20 * 1000;

export function ReservedScreen() {
  const { chains, activeChainId, reservedAt, enterFocus, timeoutReserved } =
    usePacteStore();

  const chain = chains.find((c) => c.id === activeChainId);
  const durationMs = chain?.reservationDurationMs ?? 15 * 60 * 1000;

  const handleTimeout = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    timeoutReserved();
  }, [timeoutReserved]);

  const remainingMs = useReservedCountdown(reservedAt, durationMs, handleTimeout);

  const isLast20Seconds = remainingMs > 0 && remainingMs <= LAST_PHASE_MS;
  const last20SecondsCount = Math.ceil(remainingMs / 1000);

  const reservationMinutes = Math.floor(durationMs / 60000);
  const triggerRitual = chain?.triggerRitual || '开始';
  const theme = chain?.theme || '专注';

  const buttonLabel = chain?.triggerRitual || '开始';

  return (
    <SafeAreaView
      style={[styles.container, isLast20Seconds && styles.containerRed]}
      edges={['top', 'bottom']}
    >
      <View style={styles.content}>
        <Text
          style={[
            styles.label,
            isLast20Seconds && styles.textRed,
          ]}
        >
          预定缓冲
        </Text>
        {isLast20Seconds ? (
          <Text style={styles.bigCountdown}>{last20SecondsCount}</Text>
        ) : (
          <Text
            style={[
              styles.timer,
              isLast20Seconds && styles.textRed,
            ]}
          >
            {formatMsToTime(remainingMs)}
          </Text>
        )}
        <Text
          style={[
            styles.hint,
            isLast20Seconds && styles.textRed,
          ]}
        >
          {reservationMinutes} 分钟内{triggerRitual}后进行{theme}
        </Text>
      </View>
      <View style={styles.footer}>
        <HeavyButton
          title={buttonLabel}
          onPress={enterFocus}
          variant="primary"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  containerRed: {
    backgroundColor: colors.destruction,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    ...typography.chainLabel,
    color: colors.accent,
    letterSpacing: 4,
    marginBottom: spacing.md,
  },
  timer: {
    ...typography.chainNumber,
    color: colors.text,
    fontSize: 64,
  },
  bigCountdown: {
    ...typography.chainNumber,
    color: colors.text,
    fontSize: 120,
  },
  hint: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.lg,
  },
  textRed: {
    color: colors.text,
  },
  footer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
});
