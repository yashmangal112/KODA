import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';

type StatusDotProps = {
  size?: number;
  color?: string;
  pulse?: boolean;
  inactiveColor?: string;
  active?: boolean;
};

export default function StatusDot({
  size = 8,
  color = '#FF5C3A',
  inactiveColor = '#5b403b',
  pulse = false,
  active = true,
}: StatusDotProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!pulse) return;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [pulse]);

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.25],
  });

  const dotSize = size;
  const radius = size / 2;

  if (!pulse) {
    return (
      <View
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: radius,
          backgroundColor: active ? color : inactiveColor,
        }}
      />
    );
  }

  return (
    <View
      style={{
        width: dotSize,
        height: dotSize,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Animated.View
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: radius,
          backgroundColor: color,
          transform: [{ scale }],
          opacity,
        }}
      />
    </View>
  );
}