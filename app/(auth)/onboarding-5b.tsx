import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenPlaceholder } from '@/components/layout/ScreenPlaceholder';
import { colors, radii, spacing, typography } from '@/constants/theme';

export default function Onboarding5BScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
      <Pressable style={styles.skip} onPress={() => router.replace('/(main)/(tabs)')}>
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      <ScreenPlaceholder title="Onboarding 5B" subtitle="Skippable — UI next" />

      <View style={styles.dots}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>

      <Pressable style={styles.button} onPress={() => router.push('/(auth)/onboarding-5c')}>
        <Text style={styles.buttonText}>Next</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  skip: { position: 'absolute', top: 56, right: 20, zIndex: 2 },
  skipText: {
    color: colors.muted,
    fontFamily: typography.fontFamily.medium,
    fontSize: 14,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surface,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.brandOrange,
  },
  button: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.brandOrange,
    borderRadius: radii.button,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 16,
    color: colors.buttonTextDark,
  },
});
