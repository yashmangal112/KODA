import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, typography } from '@/constants/theme';

type ScreenPlaceholderProps = {
  title: string;
  subtitle?: string;
};

/**
 * Temporary shell used while Stitch screens are implemented screen-by-screen.
 */
export function ScreenPlaceholder({ title, subtitle }: ScreenPlaceholderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 24,
    color: colors.white,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontFamily: typography.fontFamily.regular,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
});
