import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, radii, typography } from '@/constants/theme';
import { KodaWordmark } from '@/components/KodaWordmark';
import { FileCheck,
  Layers3,
  StickyNote,
  Calendar } from 'lucide-react-native';

import { LinearGradient } from 'expo-linear-gradient';

// ─── App icon data ────────────────────────────────────────────────────────────
// Icon labels are Material Symbols-style; replace text with real icons/images
const LEFT_APPS = [
  { id: 'task', icon: FileCheck, name: 'Jira' },
  { id: 'forum', icon: Layers3, name: 'Slack' },
];

const RIGHT_APPS = [
  { id: 'note', icon: StickyNote, name: 'Notion' },
  { id: 'calendar', icon: Calendar, name: 'Calendar' },
];

// ─── App icon tile ────────────────────────────────────────────────────────────
function AppIconTile({
  Icon,
}: {
  Icon: React.ComponentType<any>;
}) {
  return (
    <View style={styles.appTile}>
      <Icon
        size={22}
        color={colors.white}
        strokeWidth={2}
      />
    </View>
  );
}
// ─── Animated connecting line ─────────────────────────────────────────────────
function ConnectingLine() {
  const translateX = useRef(new Animated.Value(-60)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: 60,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 300,
              delay: 1200,
              useNativeDriver: true,
            }),
          ]),
        ]),
        Animated.timing(translateX, { toValue: -60, duration: 0, useNativeDriver: true }),
      ]),
    ).start();
  }, [translateX, opacity]);

  return (
    <View style={styles.connectingLineWrapper} pointerEvents="none">
      {/* Static baseline */}
      <View style={styles.staticLine} />
      {/* Animated travelling dot */}
      <Animated.View
        style={[
          styles.travelDot,
          { opacity, transform: [{ translateX }] },
        ]}
      />
    </View>
  );
}

// ─── Central KODA hub ─────────────────────────────────────────────────────────
function KodaHub() {
  const rotate = useRef(new Animated.Value(45)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotate, {
        toValue: 45 + 360,
        duration: 24000,
        useNativeDriver: true,
      }),
    ).start();
  }, [rotate]);

  const rotateInterp = rotate.interpolate({
    inputRange: [0, 360 + 45],
    outputRange: ['0deg', '405deg'],
  });

  return (
    <View style={styles.hubWrapper}>
      {/* Pulsing ring */}
      <View style={styles.hubPingRing} />

      {/* Rotated orange diamond */}
      <Animated.View
        style={[
          styles.hubDiamond,
          { transform: [{ rotate: rotateInterp }] },
        ]}
      />

      {/* K letter always upright */}
      <View style={styles.hubLetterWrapper}>
        <Text style={styles.hubLetter}>K</Text>
      </View>

      {/* Glow behind */}
      <View pointerEvents="none" style={styles.hubGlow} />
    </View>
  );
}

// ─── Progress dots ────────────────────────────────────────────────────────────
function ProgressDots({ activeIndex = 2 }: { activeIndex?: number }) {
  const dots = [0, 1, 2, 3];
  return (
    <View style={styles.dotsRow}>
      {dots.map(i => (
        <View
          key={i}
          style={[
            styles.dot,
            i === activeIndex ? styles.dotActive : styles.dotInactive,
          ]}
        />
      ))}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function Onboarding5CScreen() {
  const router = useRouter();

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(contentTranslateY, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [contentOpacity, contentTranslateY]);

  const handleConnectApps = () => {
    router.push('/(auth)/onboarding-5d');
  };

  const handleSkip = () => {
    router.push('/(auth)/onboarding-5d');
  };

  const handleLater = () => {
    router.push('/(auth)/onboarding-5d');
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Background tech texture overlay (subtle) */}
      <View pointerEvents="none" style={styles.bgGradientTop} />

      {/* Skip */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleSkip} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Main content */}
      <Animated.View
        style={[
          styles.mainContent,
          {
            opacity: contentOpacity,
            transform: [{ translateY: contentTranslateY }],
          },
        ]}
      >
        {/* Integration diagram */}
        <View style={styles.diagramWrapper}>
          {/* Ambient radial glow */}

          <LinearGradient
            pointerEvents="none"
            colors={[
              'rgba(255,92,58,0.18)',
              'rgba(255,92,58,0.10)',
              'rgba(255,92,58,0.03)',
              'transparent',
            ]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.diagramGlow}
          />

          <View style={styles.diagramRow}>
            {/* Left apps */}
            <View style={styles.appColumn}>
              {LEFT_APPS.map(app => (
                <AppIconTile key={app.id} Icon={app.icon} />
              ))}
            </View>

            {/* Left connector */}
            <ConnectingLine />

            {/* Central hub */}
            <KodaHub />

            {/* Right connector */}
            <ConnectingLine />

            {/* Right apps */}
            <View style={styles.appColumn}>
              {RIGHT_APPS.map(app => (
                <AppIconTile key={app.id} Icon={app.icon} />
              ))}
            </View>
          </View>

          {/* Horizontal thread */}
          <View pointerEvents="none" style={styles.horizontalThread} />
        </View>

        {/* Copy */}
        <View style={styles.copyBlock}>
          <Text style={styles.headline}>Connect your tools</Text>
          <Text style={styles.body}>
            KODA pushes action items and summaries to where your team already works.
          </Text>
        </View>
      </Animated.View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleConnectApps}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Connect apps</Text>
          <Text style={styles.primaryButtonArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLater} style={styles.laterButton}>
          <Text style={styles.laterText}>I'll do this later</Text>
        </TouchableOpacity>

        <ProgressDots activeIndex={2} />
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const HUB_SIZE = 80;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    paddingHorizontal: spacing.marginPage,
    overflow: 'hidden',
  },

  bgGradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '25%',
    backgroundColor: 'rgba(13,13,13,0.4)',
    opacity: 0.4,
  },

  // ── Top bar ──
  topBar: {
    height: 64,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  skipText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
    color: colors.muted,
    letterSpacing: 0.5,
  },

  // ── Main content ──
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxl + 8,
  },

  // ── Diagram ──
  diagramWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: spacing.lg,
  },
  diagramGlow: {
    position: 'absolute',

    width: 320,
    height: 180,
    borderRadius: 80,
    alignSelf: 'center',

    opacity: 0.5,
  },
  diagramRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    zIndex: 1
  },
  appColumn: {
    gap: spacing.sm + 4,
  },
  appTile: {
    width: 52,
    height: 52,
    borderRadius: radii.card,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brandOrange,
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },

  // Connecting line
  connectingLineWrapper: {
    width: 50,
    height: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  staticLine: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(91,64,59,0.25)',
  },
  travelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brandOrange,
    shadowColor: colors.brandOrange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },

  // KODA hub
  hubWrapper: {
    width: HUB_SIZE,
    height: HUB_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  hubPingRing: {
    position: 'absolute',
    width: HUB_SIZE + 16,
    height: HUB_SIZE + 16,
    borderRadius: (HUB_SIZE + 16) / 4,
    borderWidth: 1.5,
    borderColor: colors.brandOrange,
    opacity: 0.2,
  },
  hubDiamond: {
    position: 'absolute',
    width: HUB_SIZE,
    height: HUB_SIZE,
    borderRadius: 20,
    backgroundColor: colors.brandOrange,
    shadowColor: colors.brandOrange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
  hubLetterWrapper: {
    position: 'absolute',
    zIndex: 2,
  },
  hubLetter: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 26,
    color: colors.buttonTextDark,
    letterSpacing: -0.5,
  },
  hubGlow: {
    position: 'absolute',
    width: HUB_SIZE * 1.5,
    height: HUB_SIZE * 1.5,
    borderRadius: HUB_SIZE,
    backgroundColor: colors.brandOrange,
    opacity: 0.08,
  },

  horizontalThread: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(91,64,59,0.1)',
    zIndex: 0,
  },

  // ── Copy ──
  copyBlock: {
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  headline: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 28,
    lineHeight: 34,
    color: colors.white,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  body: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.muted,
    textAlign: 'center',
    maxWidth: 280,
  },

  // ── Footer ──
  footer: {
    paddingBottom: spacing.xl + 8,
    alignItems: 'center',
    gap: spacing.md,
  },
  primaryButton: {
    width: '100%',
    height: 56,
    backgroundColor: colors.brandOrange,
    borderRadius: radii.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.brandOrange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 8,
  },
  primaryButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 17,
    color: colors.buttonTextDark,
    letterSpacing: -0.2,
  },
  primaryButtonArrow: {
    fontSize: 18,
    color: colors.buttonTextDark,
  },
  laterButton: {
    paddingVertical: spacing.xs,
  },
  laterText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 13,
    color: colors.muted,
    letterSpacing: 0.2,
  },

  // ── Dots ──
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radii.pill,
  },
  dotActive: {
    backgroundColor: colors.brandOrange,
    shadowColor: colors.brandOrange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  dotInactive: {
    backgroundColor: colors.surfaceHighest,
  },
});