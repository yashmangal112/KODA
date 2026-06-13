import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  Image,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, radii, typography } from '@/constants/theme';
import { BlurView } from 'expo-blur';


const { width, height } = Dimensions.get('window');

const HERO_SIZE = width * 0.72;
const GLOW_SIZE = HERO_SIZE * 0.75;

function ProgressDots({ activeIndex = 1 }: { activeIndex?: number }) {
  return (
    <View style={styles.dotsRow}>
      {[0, 1, 2, 3].map(i => (
        <View
          key={i}
          style={[
            styles.dot,
            i === activeIndex
              ? styles.dotActive
              : styles.dotInactive,
          ]}
        />
      ))}
    </View>
  );
}

export default function Onboarding5BScreen() {
  const router = useRouter();

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Top */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.push('/(auth)/onboarding-5c')}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Main */}
      <View
        style={[
          styles.mainContent,
          {
            opacity,
            transform: [{ translateY }],
          },
        ]}
      >
        {/* Hero */}
          <BlurView intensity={100} tint="dark" style={styles.heroSection}>

          <Image
            source={require('@/assets/images/device-connect.jpg')}
            style={styles.heroImage}
            resizeMode="contain"
          />
        </BlurView>

        {/* Text */}
        <View style={styles.copyBlock}>
          <Text style={styles.headline}>
            Place KODA in the room
          </Text>

          <Text style={styles.body}>
            The device captures every voice.
            You only need the app to review and act.
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.9}
          onPress={() => router.push('/(auth)/onboarding-5c')}
        >
          <Text style={styles.primaryButtonText}>
            I have my device
          </Text>

          <Text style={styles.primaryButtonArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/(auth)/onboarding-5c')}
        >
          <Text style={styles.secondaryButtonText}>
            I don't have one yet
          </Text>
        </TouchableOpacity>

        <ProgressDots activeIndex={1} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    paddingLeft: spacing.marginPage,
    paddingRight: spacing.marginPage,
    overflow: 'hidden',
  },

  topBar: {
    height: 60,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  skipText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 13,
    color: colors.muted,
    letterSpacing: 0.3,
  },

  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 10,
  },

  heroSection: {
    width: HERO_SIZE/3,
    height: HERO_SIZE/3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
  },

  ambientGlow: {
    position: 'absolute',
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    borderRadius: GLOW_SIZE / 2,
    backgroundColor: colors.brandOrange,
    opacity: 0.08,
  },


  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    opacity: 0.9,
    tintColor: undefined,
    transform: [{ scale: 1 }],
  },

  copyBlock: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },

  headline: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 30,
    lineHeight: 36,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: -0.7,
  },

  body: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 15,
    lineHeight: 24,
    color: colors.muted,
    textAlign: 'center',
    maxWidth: 290,
  },

  footer: {
    paddingBottom: 28,
    gap: spacing.md,
  },

  primaryButton: {
    height: 56,
    borderRadius: radii.button,
    backgroundColor: colors.brandOrange,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,

    shadowColor: colors.brandOrange,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },

  primaryButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 17,
    color: colors.buttonTextDark,
  },

  primaryButtonArrow: {
    fontSize: 18,
    color: colors.buttonTextDark,
  },

  secondaryButton: {
    alignItems: 'center',
  },

  secondaryButtonText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 13,
    color: colors.muted,
  },

  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },

  dotActive: {
    backgroundColor: colors.brandOrange,

    shadowColor: colors.brandOrange,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },

  dotInactive: {
    backgroundColor: '#3A3A3A',
  },
});
