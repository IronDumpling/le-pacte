import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface CircularProgressBarProps {
  /** 进度 0-1，0 为开始，1 为结束 */
  progress: number;
  size?: number;
  strokeWidth?: number;
  strokeColor?: string;
  backgroundColor?: string;
  style?: ViewStyle;
}

export function CircularProgressBar({
  progress,
  size = 200,
  strokeWidth = 6,
  strokeColor = '#7B8FA1',
  backgroundColor = 'rgba(255,255,255,0.15)',
  style,
}: CircularProgressBarProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(1, Math.max(0, progress)));

  return (
    <View style={[styles.wrapper, { width: size, height: size }, style]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* 背景轨道 */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* 进度弧 */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    top: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  svg: {
    position: 'absolute',
  },
});
