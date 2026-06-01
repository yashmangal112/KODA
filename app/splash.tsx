import LottieView from 'lottie-react-native';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/constants/theme';
import { resolvePostSplashRoute } from '@/lib/navigation';

const MIN_ANIMATION_MS = 1500;

export default function SplashScreen() {
  const [animationDone, setAnimationDone] = useState(false);
  const [route, setRoute] = useState<{ href: string; minSplashMs: number } | null>(
    null,
  );
  const startTimeRef = useRef(Date.now());
  const navigatedRef = useRef(false);

  useEffect(() => {
    resolvePostSplashRoute().then(setRoute);
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
      <LottieView
        source={require('@/assets/lottie/koda_logo.json')}
        autoPlay
        loop={false}
        style={styles.lottie}
        onAnimationFinish={() => setAnimationDone(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottie: {
    width: 220,
    height: 220,
  },
});
