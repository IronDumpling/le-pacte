import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePacteStore } from '../store/pacteStore';
import { HeavyButton } from '../design/components';
import { useReservedCountdown, formatMsToTime } from '../hooks/useTimer';
import { colors, typography, spacing } from '../design/theme';

export function ReservedScreen() {
  const { reservedAt, enterFocus, timeoutReserved } = usePacteStore();
  const remainingMs = useReservedCountdown(reservedAt, timeoutReserved);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Text style={styles.label}>预约缓冲</Text>
        <Text style={styles.timer}>{formatMsToTime(remainingMs)}</Text>
        <Text style={styles.hint}>15 分钟内入座，否则链条断裂</Text>
      </View>
      <View style={styles.footer}>
        <HeavyButton title="入座 (开始专注)" onPress={enterFocus} variant="primary" />
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
