import { StyleSheet, Text, View } from 'react-native';

import { colors, typography } from '@/constants/theme';

type KodaWordmarkProps = {
  kodColor?: string;
  scale?: number;
  fontSize?: number;
  letterSpacing?: number;
};

export function KodaWordmark({
  kodColor = colors.white,
  scale = 1,
  fontSize = 28,
  letterSpacing = 4.2,
}: KodaWordmarkProps) {
  return (
    <View style={[styles.wrapper, { transform: [{ scale }] }]}>
      <Text style={[styles.text, { fontSize, color: kodColor, letterSpacing }]}>KOD</Text>
      <Text style={[styles.text, styles.accent, { fontSize, letterSpacing }]}>A</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  text: {
    fontFamily: typography.fontFamily.bold,
    letterSpacing: 4.2,
    includeFontPadding: false,
  },
  accent: {
    color: colors.brandOrange,
  },
});
