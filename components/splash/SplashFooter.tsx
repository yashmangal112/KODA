import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { colors, splash, spacing, typography } from '@/constants/theme';

const STATUSES = [
  'INITIALIZING SECURE CONNECTION',
  'HANDSHAKING HARDWARE MODULE',
  'DECRYPTING KERNEL ASSETS',
  'ESTABLISHING SYNC PROTOCOL',
];

export function SplashFooter() {
  const [statusIndex, setStatusIndex] = useState(0);
  const statusOpacity = useSharedValue(0);
  const dotOpacity = useSharedValue(1);

  const advanceStatus = () => {
    setStatusIndex((prev) => (prev + 1) % STATUSES.length);
  };

  useEffect(() => {
    statusOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) });

    const interval = setInterval(() => {
      statusOpacity.value = withTiming(0, { duration: 500, easing: Easing.inOut(Easing.ease) }, (finished) => {
        if (finished) {
          runOnJS(advanceStatus)();
          statusOpacity.value = withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) });
        }
      });
    }, splash.statusIntervalMs);

    dotOpacity.value = withRepeat(
      withSequence(
        withTiming(0.35, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );

    return () => clearInterval(interval);
  }, [dotOpacity, statusOpacity]);

  const statusStyle = useAnimatedStyle(() => ({
    opacity: statusOpacity.value,
  }));

  const dotStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
  }));

  return (
    <View style={styles.footer}>
      <Animated.View style={[styles.dot, dotStyle]} />
      <Animated.Text style={[styles.status, statusStyle]}>
        {STATUSES[statusIndex]}
      </Animated.Text>
      <Text style={styles.system}>SYSTEM v2.4.0-STABLE // ENCRYPTED</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.sm,
    opacity: 0.6,
    paddingHorizontal: spacing.marginPage,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.brandOrange,
    marginBottom: spacing.sm,
  },
  status: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
    letterSpacing: 3,
    color: colors.onSurface,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  system: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 10,
    letterSpacing: -0.2,
    color: '#E3BEB6',
    opacity: 0.4,
    textAlign: 'center',
  },
});
