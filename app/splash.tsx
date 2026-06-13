import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KodaWordmark } from "@/components/KodaWordmark";
import { SplashAmbientGlow } from "@/components/splash/SplashAmbientGlow";
import { SplashFooter } from "@/components/splash/SplashFooter";
import { SplashRippleRings } from "@/components/splash/SplashRippleRings";
import { SplashWordmarkSection } from "@/components/splash/SplashWordmarkSection";
import { colors, spacing, splash as splashTheme } from "@/constants/theme";
import { resolvePostSplashRoute } from "@/lib/navigation";
import ListeningGlowBackground  from '@/components/CinematicBackground';


const MIN_ANIMATION_MS = splashTheme.minReadyMs;

export default function SplashScreen() {
  const insets = useSafeAreaInsets();
  const [animationDone, setAnimationDone] = useState(false);
  const [route, setRoute] = useState<{
    href: string;
    minSplashMs: number;
  } | null>(null);
  const startTimeRef = useRef(Date.now());
  const navigatedRef = useRef(false);

  useEffect(() => {
    resolvePostSplashRoute().then(setRoute);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setAnimationDone(true), MIN_ANIMATION_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!animationDone || !route || navigatedRef.current) return;

    const elapsed = Date.now() - startTimeRef.current;
    const requiredMs = Math.max(route.minSplashMs, MIN_ANIMATION_MS);
    const delay = Math.max(0, requiredMs - elapsed);

    const timer = setTimeout(() => {
      if (navigatedRef.current) return;
      navigatedRef.current = true;
      router.replace(route.href as never);
    }, delay);

    return () => clearTimeout(timer);
  }, [animationDone, route]);

  return (
    <View style={styles.container}>
      {/* <SplashAmbientGlow /> */}
      <ListeningGlowBackground/>

      <View style={[styles.main, { paddingHorizontal: spacing.marginPage }]}>
        <View style={styles.focal}>
          <SplashRippleRings />
          <KodaWordmark scale={1.25} />
        </View>

        <SplashWordmarkSection />
      </View>

      <View
        style={[
          styles.footerWrap,
          { paddingBottom: insets.bottom + spacing.marginPage },
        ]}
      >
        <SplashFooter />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: "hidden",
  },
  main: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    gap: spacing.stackXl,
  },
  focal: {
    width: splashTheme.focalSize,
    height: splashTheme.focalSize,
    alignItems: "center",
    justifyContent: "center",
  },
  footerWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});
