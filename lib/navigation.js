import {
  getAuthToken,
  isOnboarding5aDone,
  isPendingVerification,
} from '@/services/storage';
import { validateAuthToken } from '@/services/api';

/**
 * Resolves where splash should navigate after animation + auth checks.
 * @returns {Promise<{ href: string; minSplashMs: number }>}
 */
export async function resolvePostSplashRoute() {
  const [token, onboardingDone, pendingVerify] = await Promise.all([
    getAuthToken(),
    isOnboarding5aDone(),
    isPendingVerification(),
  ]);

  if (!onboardingDone) {
    return { href: '/(auth)/onboarding-5a', minSplashMs: 0 };
  }

  if (!token) {
    return { href: '/(auth)/login', minSplashMs: 0 };
  }

  const validation = await validateAuthToken();

  if (!validation.valid) {
    if (validation.reason === 'expired' || validation.reason === 'no_token') {
      return { href: '/(auth)/login', minSplashMs: 2000 };
    }
    if (validation.reason === 'network') {
      return { href: '/(main)/(tabs)', minSplashMs: 2000 };
    }
    return { href: '/(auth)/login', minSplashMs: 2000 };
  }

  if (pendingVerify) {
    return { href: '/(auth)/verify-token', minSplashMs: 0 };
  }

  return { href: '/(main)/(tabs)', minSplashMs: 2000 };
}

/**
 * After successful login.
 */
export async function resolvePostLoginRoute() {
  const [onboardingDone, pendingVerify] = await Promise.all([
    isOnboarding5aDone(),
    isPendingVerification(),
  ]);

  if (!onboardingDone) {
    return '/(auth)/onboarding-5a';
  }

  if (pendingVerify) {
    return '/(auth)/verify-token';
  }

  return '/(main)/(tabs)';
}

/**
 * After successful email verification.
 */
export function resolvePostVerifyRoute() {
  return '/(auth)/onboarding-5b';
}
