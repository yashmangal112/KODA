import { Stack } from 'expo-router';

import { colors } from '@/constants/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="onboarding-5a" />
      <Stack.Screen name="register" />
      <Stack.Screen name="login" />
      <Stack.Screen name="verify-token" />
      <Stack.Screen name="onboarding-5b" />
      <Stack.Screen name="onboarding-5c" />
      <Stack.Screen name="onboarding-5d" />
    </Stack>
  );
}
