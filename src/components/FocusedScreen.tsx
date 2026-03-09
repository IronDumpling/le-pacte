import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { usePacteStore } from '../store/pacteStore';
import { HeavyButton } from '../design/components';
import { useFocusedElapsed, formatMsToTime } from '../hooks/useTimer';
import { colors, typography, spacing } from '../design/theme';

const LONG_PRESS_DURATION_MS = 800;

export function FocusedScreen() {
  const { focusedStartedAt, completeFocus, triggerDilemma } = usePacteStore();
  const elapsedMs = useFocusedElapsed(focusedStartedAt);
  const [longPressProgress, setLongPressProgress] = useState(0);

  const handleLongPressComplete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    completeFocus();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Text style={styles.label}>专注中</Text>
        <Text style={styles.timer}>{formatMsToTime(elapsedMs)}</Text>
      </View>

      <View style={styles.actions}>
        <HeavyButton
          title="完成结算"
          onLongPress={handleLongPressComplete}
          onPress={() => {}}
          variant="primary"
          style={styles.completeButton}
        />
        <Pressable
          onPress={triggerDilemma}
          style={({ pressed }) => [
            styles.exitButton,
            pressed && styles.exitButtonPressed,
          ]}
        >
          <Text style={styles.exitText}>暂停 / 退出</Text>
        </Pressable>
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
