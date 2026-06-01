import { api } from '@/services/api';
import {
  setAuthToken,
  setPendingVerification,
  setItem,
} from '@/services/storage';
import { STORAGE_KEYS } from '@/constants/storage';

export async function register({ fullName, email, password }) {
  const { data } = await api.post('/api/v1/auth/register', {
    full_name: fullName,
    email,
    password,
  });
  await setItem(STORAGE_KEYS.USER_EMAIL, email);
  await setPendingVerification(true);
  return data;
}

export async function login({ email, password }) {
  const { data } = await api.post('/api/v1/auth/login', { email, password });
  const token = data.token ?? data.access_token;
  if (token) {
    await setAuthToken(token);
  }
  await setItem(STORAGE_KEYS.USER_EMAIL, email);
  return data;
}

export async function verifyToken({ code, email }) {
  const { data } = await api.post('/api/v1/auth/verify', { code, email });
  const token = data.token ?? data.access_token;
  if (token) {
    await setAuthToken(token);
  }
  await setPendingVerification(false);
  return data;
}

export async function resendVerificationCode(email) {
  const { data } = await api.post('/api/v1/auth/resend', { email });
  return data;
}
