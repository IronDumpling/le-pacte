import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors, typography } from '../theme';

interface ChainDisplayProps {
  count: number;
  animateBreak?: boolean;
  animateSuccess?: boolean;
}

export function ChainDisplay({ count, animateBreak, animateSuccess }: ChainDisplayProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const translateX = useSharedValue(0);

  React.useEffect(() => {
    if (animateSuccess) {
      scale.value = withSequence(
        withSpring(1.15, { damping: 10, stiffness: 200 }),
        withSpring(1)
      );
    }
  }, [animateSuccess, count]);

  React.useEffect(() => {
    if (animateBreak) {
      translateX.value = withSequence(
        withTiming(-8, { duration: 40 }),
        withTiming(8, { duration: 40 }),
        withTiming(-12, { duration: 60 }),
        withTiming(12, { duration: 60 }),
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withTiming(0, { duration: 80 })
      );
      opacity.value = withSequence(
        withTiming(0.8, { duration: 150 }),
        withTiming(0.2, { duration: 200 }),
        withTiming(1, { duration: 150 })
      );
      scale.value = withSequence(
        withTiming(1.05, { duration: 100 }),
        withTiming(0.85, { duration: 250 }),
        withSpring(1, { damping: 12, stiffness: 100 })
      );
    }
  }, [animateBreak]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Text style={styles.label}>CHAIN</Text>
      <Text style={styles.number}>#{count}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 24,
  },
  label: {
    ...typography.chainLabel,
    color: colors.accent,
    letterSpacing: 4,
    marginBottom: 4,
  },
  number: {
    ...typography.chainNumber,
    color: colors.text,
  },
});
