import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { colors, splash } from '@/constants/theme';

const RIPPLE_EASING = Easing.bezier(0, 0.2, 0.8, 1);
const RIPPLE_DELAYS_MS = [0, 1000, 2000];

function RippleRing({ delayMs }: { delayMs: number }) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const duration = splash.rippleDurationMs;

    scale.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(0.8, { duration: 0 }),
          withTiming(2, { duration, easing: RIPPLE_EASING }),
        ),
        -1,
        false,
      ),
    );

    opacity.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(0.15, { duration: duration / 2, easing: Easing.linear }),
          withTiming(0, { duration: duration / 2, easing: Easing.linear }),
        ),
        -1,
        false,
      ),
    );
  }, [delayMs, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.ring, animatedStyle]} />;
}

export function SplashRippleRings() {
  return (
    <View style={styles.container} pointerEvents="none">
      {RIPPLE_DELAYS_MS.map((delay) => (
        <RippleRing key={delay} delayMs={delay} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: 'rgba(255, 92, 58, 0.3)',
  },
});
