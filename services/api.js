import axios from 'axios';
import { router } from 'expo-router';

import { getAuthToken, clearAuthToken } from '@/services/storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let onNetworkError = null;
let onUnauthorized = null;

export function setApiErrorHandlers({ networkError, unauthorized }) {
  onNetworkError = networkError;
  onUnauthorized = unauthorized;
}

api.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response) {
      onNetworkError?.();
      return Promise.reject(error);
    }

    if (error.response.status === 401) {
      await clearAuthToken();
      onUnauthorized?.();
      router.replace('/(auth)/login');
    }

    return Promise.reject(error);
  },
);

export async function validateAuthToken() {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { valid: false, reason: 'no_token' };
    }
    await api.get('/api/v1/auth/me');
    return { valid: true };
  } catch (error) {
    if (error.response?.status === 401) {
      return { valid: false, reason: 'expired' };
    }
    if (!error.response) {
      return { valid: false, reason: 'network' };
    }
    return { valid: false, reason: 'unknown' };
  }
}
