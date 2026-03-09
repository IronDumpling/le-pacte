import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePacteStore } from '../store/pacteStore';
import { ChainDisplay, HeavyButton } from '../design/components';
import { colors, spacing, typography } from '../design/theme';

interface IdleScreenProps {
  animateSuccess?: boolean;
  animateBreak?: boolean;
}

export function IdleScreen({
  animateSuccess,
  animateBreak,
}: IdleScreenProps) {
  const router = useRouter();
  const { chainCount, reserve, clearIdleAnimation } = usePacteStore();

  useEffect(() => {
    if (animateSuccess || animateBreak) {
      const t = setTimeout(clearIdleAnimation, 1500);
      return () => clearTimeout(t);
    }
  }, [animateSuccess, animateBreak, clearIdleAnimation]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <ChainDisplay
          count={chainCount}
          animateSuccess={animateSuccess}
          animateBreak={animateBreak}
        />
        <HeavyButton title="预约启动" onPress={reserve} variant="primary" />
        <Pressable
          onPress={() => router.push('/constitution')}
          style={styles.constitutionLink}
          hitSlop={16}
        >
          <Text style={styles.constitutionText}>宪法 · 判例</Text>
        </Pressable>
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
  constitutionText: {
    ...typography.body,
    color: colors.textMuted,
  },
});
