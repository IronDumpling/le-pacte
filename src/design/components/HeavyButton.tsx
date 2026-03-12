import React, { useMemo } from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, spacing, shadows } from '../theme';
import { useTypography } from '../typography';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface HeavyButtonProps {
  title: string;
  onPress: () => void;
  onLongPress?: () => void;
  delayLongPress?: number;
  variant?: 'primary' | 'destruction' | 'secondary';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

const variantColors = {
  primary: colors.primary,
  destruction: colors.destructionBase,
  secondary: colors.accent,
};

export function HeavyButton({
  title,
  onPress,
  onLongPress,
  delayLongPress,
  variant = 'primary',
  style,
  textStyle,
  disabled = false,
}: HeavyButtonProps) {
  const scale = useSharedValue(1);
  const typography = useTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const bgColor = variantColors[variant];

  return (
    <AnimatedPressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={delayLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        styles.button,
        { backgroundColor: bgColor },
        shadows.heavyButton,
        animatedStyle,
        style,
      ]}
    >
      <Text style={[styles.text, textStyle]}>{title}</Text>
    </AnimatedPressable>
  );
}

const makeStyles = (typography: ReturnType<typeof useTypography>) =>
  StyleSheet.create({
  button: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
  text: {
    ...typography.button,
    color: colors.text,
  },
});
