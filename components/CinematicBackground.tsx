// components/ListeningGlowBackground.tsx

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';

import Svg, {
  Defs,
  RadialGradient,
  Stop,
  Rect,
} from 'react-native-svg';

import { colors } from '@/constants/theme';

const AnimatedView = Animated.createAnimatedComponent(View);

export default function ListeningGlowBackground() {
  const pulse = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (
      value: Animated.Value,
      delay = 0,
    ) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),

          Animated.timing(value, {
            toValue: 1,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),

          Animated.timing(value, {
            toValue: 0,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
    };

    Animated.parallel([
      animate(pulse),
      animate(pulse2, 2000),
    ]).start();
  }, []);

  const scale1 = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  const opacity1 = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.08, 0.18],
  });

  const scale2 = pulse2.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });

  const opacity2 = pulse2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.04, 0.12],
  });

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Primary Glow */}
      <AnimatedView
        style={[
          styles.glow,
          {
            opacity: opacity1,
            transform: [{ scale: scale1 }],
          },
        ]}
      >
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient
              id="grad1"
              cx="50%"
              cy="50%"
              r="50%"
            >
              <Stop
                offset="0%"
                stopColor={colors.brandOrange}
                stopOpacity="1"
              />

              <Stop
                offset="100%"
                stopColor={colors.brandOrange}
                stopOpacity="0"
              />
            </RadialGradient>
          </Defs>

          <Rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="url(#grad1)"
          />
        </Svg>
      </AnimatedView>

      {/* Secondary Glow */}
      <AnimatedView
        style={[
          styles.glowXL,
          {
            opacity: opacity2,
            transform: [{ scale: scale2 }],
          },
        ]}
      >
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient
              id="grad2"
              cx="50%"
              cy="50%"
              r="50%"
            >
              <Stop
                offset="0%"
                stopColor={colors.brandOrange}
                stopOpacity="1"
              />

              <Stop
                offset="100%"
                stopColor={colors.brandOrange}
                stopOpacity="0"
              />
            </RadialGradient>
          </Defs>

          <Rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="url(#grad2)"
          />
        </Svg>
      </AnimatedView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,

    alignItems: 'center',
    justifyContent: 'center',

    overflow: 'hidden',
  },

  glow: {
    position: 'absolute',

    width: 420,
    height: 420,
  },

  glowXL: {
    position: 'absolute',

    width: 700,
    height: 700,
  },
});