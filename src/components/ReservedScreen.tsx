import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { usePacteStore } from '../store/pacteStore';
import { HeavyButton, CircularProgressBar } from '../design/components';
import { useReservedCountdown, formatMsToTime } from '../hooks/useTimer';
import { colors, typography, spacing } from '../design/theme';
import { useTheme } from '../theme/ThemeContext';
import { useLocale } from '../i18n/LocaleContext';

const LAST_PHASE_MS = 20 * 1000;
const TIMER_RING_SIZE = 240;

export function ReservedScreen() {
  const { chains, activeChainId, reservedAt, enterFocus, timeoutReserved } =
    usePacteStore();
  const { colors: themeColors } = useTheme();
  const { t } = useLocale();

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
  const triggerRitual = chain?.triggerRitual || t('reserved_start');
  const theme = chain?.theme || t('idle_defaultTheme');

  const buttonLabel = chain?.triggerRitual || t('reserved_start');

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: themeColors.background },
        isLast20Seconds && { backgroundColor: themeColors.destruction },
      ]}
      edges={['top', 'bottom']}
    >
      <View style={styles.content}>
        <Text
          style={[
            styles.label,
            { color: isLast20Seconds ? '#FFFFFF' : themeColors.accent },
          ]}
        >
          {t('reserved_buffer')}
        </Text>
        <View style={styles.timerWrapper}>
          <CircularProgressBar
            progress={(durationMs - remainingMs) / durationMs}
            size={TIMER_RING_SIZE}
            strokeWidth={6}
            strokeColor={isLast20Seconds ? '#FFFFFF' : themeColors.accent}
            backgroundColor={isLast20Seconds ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)'}
          />
          {isLast20Seconds ? (
            <Text
              style={[
                styles.bigCountdown,
                { color: '#FFFFFF' },
              ]}
            >
              {last20SecondsCount}
            </Text>
          ) : (
            <Text
              style={[
                styles.timer,
                { color: themeColors.text },
              ]}
            >
              {formatMsToTime(remainingMs)}
            </Text>
          )}
        </View>
        <Text
          style={[
            styles.hint,
            { color: isLast20Seconds ? '#FFFFFF' : themeColors.textMuted },
          ]}
        >
          {t('reserved_hint', {
            minutes: String(reservationMinutes),
            ritual: triggerRitual,
            theme,
          })}
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
  timerWrapper: {
    width: TIMER_RING_SIZE,
    height: TIMER_RING_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
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
  footer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
});
