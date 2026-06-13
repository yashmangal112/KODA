import { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { colors, spacing } from "@/constants/theme";

import { KodaGeometricLoader } from "../KodaGeometricLoader";
import { KodaWordmark } from "../KodaWordmark";

export function SplashWordmarkSection() {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 1200,
      easing: Easing.out(Easing.ease),
    });
    translateY.value = withTiming(0, {
      duration: 1200,
      easing: Easing.out(Easing.ease),
    });
  }, [opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.section, animatedStyle]}>
      <KodaWordmark kodColor={colors.onSurface} />
      <KodaGeometricLoader />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  section: {
    alignItems: "center",
    gap: spacing.md,
  },
});
