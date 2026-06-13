import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { KodaWordmark } from "@/components/KodaWordmark";
import { colors, spacing, typography } from "@/constants/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const BRAND_ORANGE = colors.brandOrange;
const ON_PRIMARY = colors.orangeDark;
const ON_SURFACE = colors.onSurface;
const ON_SURFACE_VARIANT = "rgba(227,190,182,0.75)";
const DOT_INACTIVE = colors.surfaceHighest;

/* ─────────────────────────────────────────────────────────────────
   Ripple Ring — border-only circle that expands and fades out
   Mirrors:  @keyframes ripple { scale 1→2.5, opacity 0.4→0 }
             animation: ripple 3s cubic-bezier(0,0,0.2,1) infinite
             animation-delay: 0s / 1s / 2s
───────────────────────────────────────────────────────────────────*/
function RippleRing({ delay = 0 }: { delay?: number }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 2.5,
            duration: 3000,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ]),
        // instant reset
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.4,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={[styles.rippleRing, { transform: [{ scale }], opacity }]}
    />
  );
}

/* ─────────────────────────────────────────────────────────────────
   Pulse — scale 1→1.05, simulated brightness via opacity 0.85→1
   Mirrors:  @keyframes pulse-soft { scale(1)→scale(1.05),
                                      brightness(1)→brightness(1.2) }
             animation: pulse-soft 2s ease-in-out infinite
───────────────────────────────────────────────────────────────────*/
function usePulseSoft(duration = 2000) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });
  // brightness(1.2): we fake it by dipping opacity slightly at 0% keyframe
  const opacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1],
  });

  return { scale, opacity };
}

/* ─────────────────────────────────────────────────────────────────
   Progress Dot
───────────────────────────────────────────────────────────────────*/
function Dot({ active }: { active?: boolean }) {
  return <View style={[styles.dot, active && styles.dotActive]} />;
}

/* ─────────────────────────────────────────────────────────────────
   Screen
───────────────────────────────────────────────────────────────────*/
export default function Onboarding5DScreen() {
  const router = useRouter();
  const pulse = usePulseSoft(2000);

  return (
    <View style={styles.container}>
      {/* ── Top spacer (mirrors <div class="h-16">) ── */}
      <View style={{ height: 64 }} />

      {/* ── Main content ── */}
      <View style={styles.center}>
        {/* Brand visual: ripples + glow blob + wordmark */}
        <View style={styles.brandWrapper}>
          {/* Orange glow blob behind logo
              Mirrors: w-32 h-32 bg-primary-container/20 blur-[60px] */}

          <View style={styles.glowWrapper}>
            {/* base glow color */}
            <View style={styles.logoGlowBlob} />

            {/* blur layer */}
            <BlurView
              intensity={90}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          </View>
          {/* 3 ripple rings, staggered 1s each */}
          <RippleRing delay={0} />
          <RippleRing delay={1000} />
          <RippleRing delay={2000} />

          {/* Wordmark with pulse-soft
              Mirrors: <span>KOD</span><span class="text-primary-container">A</span> */}
          <Animated.View
            style={[
              styles.wordmarkWrapper,
              { transform: [{ scale: pulse.scale }], opacity: pulse.opacity },
            ]}
          >
            <KodaWordmark kodColor={ON_SURFACE} />
          </Animated.View>
        </View>

        {/* Title */}
        <Text style={styles.title}>KODA is ready.</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Start your first meeting or record a personal note.
        </Text>
      </View>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        {/* CTA button — glow via shadowColor */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.button}
          onPress={() => router.push("/(main)/(tabs)/")}
        >
          <Text style={styles.buttonText}>Go to meetings</Text>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>

        {/* Progress dots — last one active/orange */}
        <View style={styles.dotsRow}>
          <Dot />
          <Dot />
          <Dot />
          <Dot active />
        </View>
      </View>
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Styles
───────────────────────────────────────────────────────────────────*/
const RIPPLE_SIZE = 96; // w-24 h-24
const GLOW_SIZE = 128; // w-32 h-32

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0D",
    justifyContent: "space-between",
    overflow: "hidden",
    paddingHorizontal: spacing.marginPage,
  },

  /* Atmosphere (radial gradient approximation) */
  atmoOuter: {
    position: "absolute",
    width: SCREEN_WIDTH * 1.2,
    height: SCREEN_HEIGHT * 0.8,
    borderRadius: SCREEN_WIDTH,
    backgroundColor: BRAND_ORANGE,
    opacity: 0.04,
    top: SCREEN_HEIGHT * 0.0,
    alignSelf: "center",
  },
  atmoMid: {
    position: "absolute",
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_HEIGHT * 0.5,
    borderRadius: SCREEN_WIDTH,
    backgroundColor: BRAND_ORANGE,
    opacity: 0.04,
    top: SCREEN_HEIGHT * 0.05,
    alignSelf: "center",
  },
  atmoInner: {
    position: "absolute",
    width: SCREEN_WIDTH * 0.5,
    height: SCREEN_HEIGHT * 0.3,
    borderRadius: SCREEN_WIDTH,
    backgroundColor: BRAND_ORANGE,
    opacity: 0.04,
    top: SCREEN_HEIGHT * 0.1,
    alignSelf: "center",
  },

  /* Main area */
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
  },

  /* Brand visual container — must be large enough to contain scaled rings */
  brandWrapper: {
    width: GLOW_SIZE + 40,
    height: GLOW_SIZE + 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },


  glowWrapper: {
    position: "absolute",
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    borderRadius: GLOW_SIZE / 2,
    overflow: "hidden",
  },

  logoGlowBlob: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: GLOW_SIZE / 2,
    backgroundColor: BRAND_ORANGE,
    opacity: 0.15,
    shadowColor: BRAND_ORANGE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
  },

  /* Ripple ring — border only, no fill */
  rippleRing: {
    position: "absolute",
    width: RIPPLE_SIZE,
    height: RIPPLE_SIZE,
    borderRadius: RIPPLE_SIZE / 2,
    borderWidth: 1,
    borderColor: BRAND_ORANGE,
    backgroundColor: "transparent",
  },

  /* Wordmark sits on top of everything in brandWrapper */
  wordmarkWrapper: {
    zIndex: 10,
  },

  /* Typography */
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: ON_SURFACE,
    textAlign: "center",
    letterSpacing: -0.5,
    marginTop: 20,
    marginBottom: 8,
    fontFamily: typography.fontFamily.medium,
  },

  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    color: ON_SURFACE_VARIANT,
    textAlign: "center",
    maxWidth: 280,
    fontFamily: typography.fontFamily.regular,
  },

  /* Footer */
  footer: {
    paddingBottom: 40,
    alignItems: "center",
    gap: 18,
    fontFamily: typography.fontFamily.regular,
  },

  button: {
    width: "100%",
    height: 56,
    backgroundColor: BRAND_ORANGE,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: BRAND_ORANGE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },

  buttonText: {
    color: ON_PRIMARY,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.1,
    fontFamily: typography.fontFamily.regular,
  },

  arrow: {
    color: ON_PRIMARY,
    fontSize: 18,
  },

  /* Progress dots */
  dotsRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: DOT_INACTIVE,
  },

  dotActive: {
    backgroundColor: BRAND_ORANGE,
    shadowColor: BRAND_ORANGE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
});
