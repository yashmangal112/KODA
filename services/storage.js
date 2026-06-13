import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEYS } from '@/constants/storage';

export async function getItem(key) {
  return AsyncStorage.getItem(key);
}

export async function setItem(key, value) {
  return AsyncStorage.setItem(key, value);
}

export async function removeItem(key) {
  return AsyncStorage.removeItem(key);
}

export async function getAuthToken() {
  return getItem(STORAGE_KEYS.AUTH_TOKEN);
}

export async function setAuthToken(token) {
  return setItem(STORAGE_KEYS.AUTH_TOKEN, token);
}

export async function clearAuthToken() {
  return removeItem(STORAGE_KEYS.AUTH_TOKEN);
}

export async function isOnboarding5aDone() {
  const value = await getItem(STORAGE_KEYS.ONBOARDING_5A_DONE);
  return value === 'true';
}

export async function setOnboarding5aDone() {
  return setItem(STORAGE_KEYS.ONBOARDING_5A_DONE, 'true');
}

export async function isPendingVerification() {
  const value = await getItem(STORAGE_KEYS.PENDING_VERIFICATION);
  return value === 'true';
}

export async function setPendingVerification(pending) {
  if (pending) {
    return setItem(STORAGE_KEYS.PENDING_VERIFICATION, 'true');
  }
  return removeItem(STORAGE_KEYS.PENDING_VERIFICATION);
}

export async function getUserEmail() {
  return getItem(STORAGE_KEYS.USER_EMAIL);
}

export async function clearSession() {
  await Promise.all([
    clearAuthToken(),
    removeItem(STORAGE_KEYS.PENDING_VERIFICATION),
    removeItem(STORAGE_KEYS.USER_EMAIL),
  ]);
}
