/**
 * KodaDotsLoader.tsx
 *
 * Pixel-matched KODA loader
 * - 3 dots
 * - Sequential animation (1 → 2 → 3)
 * - Fullscreen blur support
 * - Inline / button / fullscreen usage
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  ViewStyle,
  StyleSheet as RNStyleSheet,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '@/constants/theme';

type Props = {
  size?: number;
  spacing?: number;
  duration?: number;

  activeColor?: string;
  inactiveColor?: string;

  centered?: boolean;
  fullscreen?: boolean;

  blurIntensity?: number;

  style?: ViewStyle;
};

const DEFAULT_ACTIVE = colors.brandOrange;
const DEFAULT_INACTIVE = colors.surfaceHigh;

type DotProps = {
  progress: Animated.Value;
  offset: number;
  size: number;
  activeColor: string;
  inactiveColor: string;
};

function LoaderDot({
  progress,
  offset,
  size,
  activeColor,
  inactiveColor,
}: DotProps) {
  const shifted = Animated.modulo(
    Animated.add(progress, offset),
    1
  );

  const scale = shifted.interpolate({
    inputRange: [0, 0.24, 0.25, 0.75, 0.76, 1],
    outputRange: [1, 1, 1.5, 1.5, 1, 1],
  });

  const backgroundColor = shifted.interpolate({
    inputRange: [0, 0.24, 0.25, 0.75, 0.76, 1],
    outputRange: [
      inactiveColor,
      inactiveColor,
      activeColor,
      activeColor,
      inactiveColor,
      inactiveColor,
    ],
  });

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor,
        transform: [{ scale }],
      }}
    />
  );
}

export default function KodaDotsLoader({
  size = 7,
  spacing = 10,
  duration = 1000,

  activeColor = DEFAULT_ACTIVE,
  inactiveColor = DEFAULT_INACTIVE,

  centered = false,
  fullscreen = false,

  blurIntensity = 20,

  style,
}: Props) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.setValue(0);

    const animation = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [duration, progress]);

  const dots = (
    <View style={[styles.row, { gap: spacing }]}>
      <LoaderDot
        progress={progress}
        offset={0}
        size={size}
        activeColor={activeColor}
        inactiveColor={inactiveColor}
      />

      <LoaderDot
        progress={progress}
        offset={-0.111}
        size={size}
        activeColor={activeColor}
        inactiveColor={inactiveColor}
      />

      <LoaderDot
        progress={progress}
        offset={-0.222}
        size={size}
        activeColor={activeColor}
        inactiveColor={inactiveColor}
      />
    </View>
  );

  if (fullscreen) {
    return (
      <View style={styles.fullscreen}>
        <BlurView
          intensity={blurIntensity}
          tint="dark"
          style={RNStyleSheet.absoluteFill}
        />

        {dots}
      </View>
    );
  }

  return (
    <View
      pointerEvents="none"
      style={[
        centered && styles.centered,
        style,
      ]}
    >
      {dots}
    </View>
  );
}

const styles = StyleSheet.create({
  fullscreen: {
    ...StyleSheet.absoluteFillObject,

    zIndex: 9999,
    elevation: 9999,

    justifyContent: 'center',
    alignItems: 'center',
  },

  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});