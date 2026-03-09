import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, spacing, typography, shadows } from '../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface HeavyButtonProps {
  title: string;
  onPress: () => void;
  onLongPress?: () => void;
  variant?: 'primary' | 'destruction' | 'secondary';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

const variantColors = {
  primary: '#4A6FA5',
  destruction: '#FF3B30',
  secondary: '#7B8FA1',
};

export function HeavyButton({
  title,
  onPress,
  onLongPress,
  variant = 'primary',
  style,
  textStyle,
  disabled = false,
}: HeavyButtonProps) {
  const scale = useSharedValue(1);

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

const styles = StyleSheet.create({
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
