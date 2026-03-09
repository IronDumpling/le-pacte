import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePacteStore } from '../store/pacteStore';
import { ChainDisplay, HeavyButton } from '../design/components';
import { colors, spacing } from '../design/theme';

interface IdleScreenProps {
  onShowConstitution?: () => void;
  animateSuccess?: boolean;
  animateBreak?: boolean;
}

export function IdleScreen({
  onShowConstitution,
  animateSuccess,
  animateBreak,
}: IdleScreenProps) {
  const { chainCount, reserve } = usePacteStore();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <ChainDisplay
          count={chainCount}
          animateSuccess={animateSuccess}
          animateBreak={animateBreak}
        />
        <HeavyButton title="预约启动" onPress={reserve} variant="primary" />
        {onShowConstitution && (
          <Pressable
            onPress={onShowConstitution}
            style={styles.constitutionLink}
            hitSlop={16}
          >
            {/* Constitution link - minimal, can add Text later */}
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  constitutionLink: {
    marginTop: spacing.xl,
    padding: spacing.sm,
  },
});
