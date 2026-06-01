import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/constants/theme';

export default function MainLayout() {
  const { isLoading, isAuthenticated, pendingVerification } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (pendingVerification) {
    return <Redirect href="/(auth)/verify-token" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="meeting/[id]"
        options={{
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
}
