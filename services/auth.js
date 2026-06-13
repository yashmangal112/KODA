import { STORAGE_KEYS } from "@/constants/storage";
import { api } from "@/services/api";
import {
  setAuthToken,
  setItem,
  setPendingVerification,
} from "@/services/storage";

export async function register({ name, email, password }) {
  const { data } = await api.post("/api/v1/auth/register", {
    name: name,
    email,
    password,
  });
  await setItem(STORAGE_KEYS.USER_EMAIL, email);
  if(data.requires_verification) await setPendingVerification(true);
  return data;
}

export async function login({ email, password }) {
  const { data } = await api.post("/api/v1/auth/login", { email, password });
  const token = data.token ?? data.access_token;
  const needsVerification =
    Boolean(data.requires_verification) ||
    Boolean(data.pending_verification) ||
    Boolean(data.email_verified === false);

  if (token && !needsVerification) {
    await setAuthToken(token);
    await setPendingVerification(false);
  } else if (token && needsVerification) {
    await setAuthToken(token);
    await setPendingVerification(true);
  } else if (needsVerification) {
    await setPendingVerification(true);
  } else if (token) {
    await setAuthToken(token);
    await setPendingVerification(false);
  }

  await setItem(STORAGE_KEYS.USER_EMAIL, email);
  return data;
}

export async function verifyToken({ token, email }) {
  const { data } = await api.post("/api/v1/auth/verify-otp", { email, token });
  const Verifytoken = data.token ?? data.access_token;
  if (Verifytoken) {
    await setAuthToken(Verifytoken);
  }
  await setPendingVerification(false);
  return data;
}

export async function resendVerificationCode(email) {
  const { data } = await api.post("/api/v1/auth/resend-otp", { email });
  return data;
}

async function oauthLogin(supabaseToken) {
  const { data } = await api.post(
    "/api/v1/auth/oauth-login",
    {},
    {
      headers: {
        Authorization: `Bearer ${supabaseToken}`,
      },
    },
  );

  return data;
}

export async function sendSessionToBackend(supabaseToken) {
  const data = await oauthLogin(supabaseToken);

  const token = data.access_token ?? data.token;

  if (token) {
    await setAuthToken(token);
  }

  return data;
}
