import axios from 'axios';

/**
 * @param {unknown} error
 * @param {string} fallback
 * @returns {string}
 */
export function getApiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return fallback;
    }

    const { data } = error.response;

    if (typeof data === 'string' && data.trim()) {
      return data;
    }

    if (data?.message) {
      return String(data.message);
    }

    if (data?.error) {
      if (typeof data.error === 'string') return data.error;
      if (data.error?.message) return String(data.error.message);
    }

    if (data?.detail) {
      return String(data.detail);
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

/**
 * @param {unknown} error
 * @returns {Record<string, string>}
 */
export function getFieldErrors(error) {
  if (!axios.isAxiosError(error) || !error.response?.data) {
    return {};
  }

  const { data } = error.response;

  if (data?.errors && typeof data.errors === 'object' && !Array.isArray(data.errors)) {
    return normalizeFieldErrors(data.errors);
  }

  if (data?.field_errors && typeof data.field_errors === 'object') {
    return normalizeFieldErrors(data.field_errors);
  }

  return {};
}

/**
 * @param {Record<string, string | string[]>} raw
 * @returns {Record<string, string>}
 */
function normalizeFieldErrors(raw) {
  return Object.entries(raw).reduce((acc, [key, value]) => {
    if (Array.isArray(value)) {
      acc[key] = value[0] ?? '';
    } else if (typeof value === 'string') {
      acc[key] = value;
    }
    return acc;
  }, /** @type {Record<string, string>} */ ({}));
}

/**
 * @param {unknown} error
 */
export function isNetworkError(error) {
  return axios.isAxiosError(error) && !error.response;
}
