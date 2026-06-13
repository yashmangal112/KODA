import { StyleSheet, View } from 'react-native';

import { colors, splash } from '@/constants/theme';

export function SplashAmbientGlow() {
  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.glow} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    width: splash.ambientGlowSize,
    height: splash.ambientGlowSize,
    borderRadius: splash.ambientGlowSize / 2,
    backgroundColor: colors.brandOrange,
    opacity: 0.02,
  },
});
