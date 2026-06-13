import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { colors, splash } from '@/constants/theme';

const LOADER_EASING = Easing.bezier(0.4, 0, 0.2, 1);
const SIZE = splash.loaderSize;

export function KodaGeometricLoader() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: splash.loaderDurationMs,
        easing: LOADER_EASING,
      }),
      -1,
      false,
    );
  }, [rotation]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={SIZE} viewBox="0 0 24 24" style={styles.staticRing}>
        <Circle
          cx="12"
          cy="12"
          r="10"
          fill="none"
          stroke={colors.white}
          strokeWidth={0.5}
          opacity={0.1}
        />
      </Svg>
      <Animated.View style={[styles.rotatingWrap, ringStyle]}>
        <Svg width={SIZE} height={SIZE} viewBox="0 0 24 24">
          <Path
            d="M12 2 A10 10 0 0 1 22 12"
            fill="none"
            stroke={colors.brandOrange}
            strokeLinecap="round"
            strokeWidth={1.5}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SIZE,
    height: SIZE,
    marginTop: 16,
  },
  staticRing: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  rotatingWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SIZE,
    height: SIZE,
  },
});
