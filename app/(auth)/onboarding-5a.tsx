import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radii, spacing, typography } from '@/constants/theme';
import { setOnboarding5aDone } from '@/services/storage';

export default function Onboarding5AScreen() {
  const insets = useSafeAreaInsets();

  const onGetStarted = async () => {
    await setOnboarding5aDone();
    router.replace('/(auth)/register');
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.content}>
        <Text style={styles.placeholder}>Onboarding 5A — UI pending</Text>
      </View>

      <Pressable style={styles.button} onPress={onGetStarted}>
        <Text style={styles.buttonText}>Get started →</Text>
      </Pressable>

      <Pressable onPress={() => router.push('/(auth)/login')}>
        <Text style={styles.footer}>
          Already have an account? <Text style={styles.link}>Log in</Text>
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    justifyContent: 'flex-end',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    fontFamily: typography.fontFamily.medium,
    color: colors.muted,
    fontSize: 14,
  },
  button: {
    backgroundColor: colors.brandOrange,
    borderRadius: radii.button,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  buttonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 16,
    color: colors.buttonTextDark,
  },
  footer: {
    textAlign: 'center',
    fontFamily: typography.fontFamily.regular,
    fontSize: 14,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  link: {
    color: colors.brandOrange,
    fontFamily: typography.fontFamily.semiBold,
  },
});
