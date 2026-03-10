import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { usePacteStore } from '../store/pacteStore';
import { HeavyButton } from '../design/components';
import {
  useFocusCountdown,
  useFocusedElapsed,
  formatMsToTime,
} from '../hooks/useTimer';
import { colors, typography, spacing } from '../design/theme';
import { PauseModal } from './PauseModal';

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
      ? `已暂停\n引用下必为例规则第${pauseReason.ruleIndex}条：${pauseReason.text}`
      : '已暂停';
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.content}>
          <Text style={styles.pauseReason} numberOfLines={4}>
            {reasonText}
          </Text>
          {pausedTargetReached ? (
            <Text style={styles.timer}>{formatMsToTime(displayElapsed)}</Text>
          ) : (
            <Text style={styles.timer}>{formatMsToTime(displayRemaining)}</Text>
          )}
        </View>
        <View style={styles.actions}>
          <HeavyButton
            title="← 返回继续"
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
        style={[styles.container, styles.focusContainer]}
        edges={['top']}
      >
        <View style={styles.content}>
          <Text style={styles.label}>专注中</Text>
          {targetReached ? (
            <Text style={styles.timer}>{formatMsToTime(displayElapsed)}</Text>
          ) : (
            <Text style={styles.timer}>{formatMsToTime(displayRemaining)}</Text>
          )}
          {targetReached && (
            <Text style={styles.extraHint}>已达目标 · 额外专注时间</Text>
          )}
        </View>

        <View style={styles.actions}>
          {targetReached && (
            <HeavyButton
              title="完成结算"
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
                <Text style={styles.exitText}>暂停</Text>
              </Pressable>
              <Pressable
                onPress={triggerDilemma}
                style={({ pressed }) => [
                  styles.exitButton,
                  pressed && styles.exitButtonPressed,
                ]}
              >
                <Text style={styles.exitText}>退出</Text>
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
              <Text style={styles.exitText}>退出</Text>
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

const styles = StyleSheet.create({
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
