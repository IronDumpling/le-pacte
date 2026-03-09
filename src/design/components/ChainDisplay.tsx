import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
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
        withTiming(-5, { duration: 50 }),
        withTiming(5, { duration: 50 }),
        withTiming(-5, { duration: 50 }),
        withTiming(5, { duration: 50 }),
        withTiming(-8, { duration: 80 }),
        withTiming(8, { duration: 80 }),
        withTiming(0, { duration: 100 })
      );
      opacity.value = withSequence(
        withTiming(0.7, { duration: 200 }),
        withTiming(0.3, { duration: 200 }),
        withTiming(1, { duration: 100 })
      );
      scale.value = withSequence(
        withTiming(0.9, { duration: 300 }),
        withSpring(1)
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
