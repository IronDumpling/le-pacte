import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { usePacteStore } from '../store/pacteStore';
import { HeavyButton, CircularProgressBar } from '../design/components';
import {
  useFocusCountdown,
  useFocusedElapsed,
  formatMsToTime,
} from '../hooks/useTimer';
import { colors, spacing } from '../design/theme';
import { useTheme } from '../theme/ThemeContext';
import { useLocale } from '../i18n/LocaleContext';
import { PauseModal } from './PauseModal';
import { useTypography } from '../design/typography';

const TIMER_RING_SIZE = 240;

export function FocusedScreen() {
  const {
    chains,
    activeChainId,
    focusedStartedAt,
    frozenElapsedMs,
    pauseReason,
    completeFocus,
    triggerDilemma,
    triggerPause,
    resumeFromPause,
  } = usePacteStore();
  const { colors: themeColors } = useTheme();
  const { t } = useLocale();
  const typography = useTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);

  const chain = chains.find((c) => c.id === activeChainId);
  const targetMs = chain?.focusTargetMs ?? 60 * 60 * 1000;
  const hasPrecedents = (chain?.precedentRules.length ?? 0) > 0;

  const remainingMs = useFocusCountdown(focusedStartedAt, targetMs);
  const elapsedMs = useFocusedElapsed(focusedStartedAt);

  const [showPauseModal, setShowPauseModal] = useState(false);
  const targetReached = remainingMs <= 0;

  const handleComplete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    completeFocus();
  };

  const handlePauseBack = () => {
    resumeFromPause();
    setShowPauseModal(false);
  };

  const handlePauseSelect = (ruleIndex: number, ruleText: string) => {
    triggerPause(ruleIndex, ruleText);
    setShowPauseModal(false);
  };

  const isPaused = frozenElapsedMs !== null;
  const displayRemaining = isPaused
    ? Math.max(0, targetMs - frozenElapsedMs!)
    : remainingMs;
  const displayElapsed = isPaused ? frozenElapsedMs! : elapsedMs;
  const pausedTargetReached = isPaused && (frozenElapsedMs ?? 0) >= targetMs;

  if (isPaused) {
    const reasonText = pauseReason
      ? t('focus_pausedRule', {
          ruleIndex: String(pauseReason.ruleIndex),
          text: pauseReason.text,
        })
      : t('focus_paused');
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
        <View style={styles.content}>
          <Text style={[styles.pauseReason, { color: themeColors.textMuted }]} numberOfLines={4}>
            {reasonText}
          </Text>
          <View style={styles.timerWrapper}>
            <CircularProgressBar
              progress={Math.min(1, (frozenElapsedMs ?? 0) / targetMs)}
              size={TIMER_RING_SIZE}
              strokeWidth={6}
              strokeColor={themeColors.accent}
            />
            {pausedTargetReached ? (
              <Text style={[styles.timer, { color: themeColors.text }]}>{formatMsToTime(displayElapsed)}</Text>
            ) : (
              <Text style={[styles.timer, { color: themeColors.text }]}>{formatMsToTime(displayRemaining)}</Text>
            )}
          </View>
        </View>
        <View style={styles.actions}>
          <HeavyButton
            title={t('focus_backContinue')}
            onPress={resumeFromPause}
            variant="primary"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView
        style={[
          styles.container,
          styles.focusContainer,
          { backgroundColor: themeColors.focusBackground },
        ]}
        edges={['top']}
      >
        <View style={styles.content}>
          <Text style={styles.label}>
            {chain?.theme || t('idle_defaultTheme')}{t('focus_themeSuffix')}
          </Text>
          <View style={styles.timerWrapper}>
            <CircularProgressBar
              progress={targetReached ? 1 : (targetMs - displayRemaining) / targetMs}
              size={TIMER_RING_SIZE}
              strokeWidth={6}
              strokeColor={themeColors.accent}
            />
            {targetReached ? (
              <Text style={[styles.timer, { color: themeColors.text }]}>{formatMsToTime(displayElapsed)}</Text>
            ) : (
              <Text style={[styles.timer, { color: themeColors.text }]}>{formatMsToTime(displayRemaining)}</Text>
            )}
          </View>
          {targetReached && (
            <Text style={[styles.extraHint, { color: themeColors.textMuted }]}>{t('focus_extraHint')}</Text>
          )}
        </View>

        <View style={styles.actions}>
          {targetReached && (
            <HeavyButton
              title={t('focus_complete')}
              onPress={handleComplete}
              variant="primary"
              style={styles.completeButton}
            />
          )}
          {hasPrecedents ? (
            <>
              <Pressable
                onPress={() => setShowPauseModal(true)}
                style={({ pressed }) => [
                  styles.exitButton,
                  pressed && styles.exitButtonPressed,
                ]}
              >
                <Text style={styles.exitText}>{t('focus_pause')}</Text>
              </Pressable>
              <Pressable
                onPress={triggerDilemma}
                style={({ pressed }) => [
                  styles.exitButton,
                  pressed && styles.exitButtonPressed,
                ]}
              >
                <Text style={styles.exitText}>{t('focus_exit')}</Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={triggerDilemma}
              style={({ pressed }) => [
                styles.exitButton,
                pressed && styles.exitButtonPressed,
              ]}
            >
              <Text style={styles.exitText}>{t('focus_exit')}</Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>

      {showPauseModal && chain && (
        <PauseModal
          precedentRules={chain.precedentRules}
          onSelect={handlePauseSelect}
          onBack={handlePauseBack}
        />
      )}
    </>
  );
}

const makeStyles = (typography: ReturnType<typeof useTypography>) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  focusContainer: {
    backgroundColor: colors.focusBackground,
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
  pauseReason: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  timer: {
    ...typography.chainNumber,
    color: colors.text,
    fontSize: 64,
  },
  extraHint: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  actions: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  completeButton: {
    minWidth: 240,
  },
  exitButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  exitButtonPressed: {
    opacity: 0.7,
  },
  exitText: {
    ...typography.body,
    color: colors.textMuted,
  },
});
