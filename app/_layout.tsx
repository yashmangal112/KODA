import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
  useFonts,
} from '@expo-google-fonts/space-grotesk';
import { Stack } from 'expo-router';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider, useToast } from '@/contexts/ToastContext';
import { colors } from '@/constants/theme';
import { setApiErrorHandlers } from '@/services/api';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

ExpoSplashScreen.preventAutoHideAsync();

function ApiErrorBridge() {
  const toast = useToast();

  useEffect(() => {
    setApiErrorHandlers({
      networkError: () => toast.showNetworkError(),
      unauthorized: () => toast.showError('Session expired. Please sign in again.'),
    });
  }, [toast]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded) {
      ExpoSplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <AuthProvider>
        <ToastProvider>
          <ApiErrorBridge />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
              animation: 'fade',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="splash" options={{ animation: 'none' }} />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(main)" />
            <Stack.Screen name="+not-found" />
          </Stack>
        </ToastProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
