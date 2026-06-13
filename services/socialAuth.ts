import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

import { supabase } from "@/utils/supabase";

WebBrowser.maybeCompleteAuthSession();

export async function signInWithGoogle(): Promise<string> {

    const redirectTo = __DEV__
        ? "exp+koda://auth/callback"   // Expo Go tunnel
        : "koda://auth/callback";
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error || !data.url) throw error ?? new Error("No auth URL returned");
  return data.url;
}


export async function signInWithMicrosoft(): Promise<string> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "azure",
    options: {
      redirectTo: "koda://auth/callback", // same as Google
      skipBrowserRedirect: true,
      scopes: "email profile openid", // gets name + email from Microsoft
    },
  });

  if (error || !data.url) throw error ?? new Error("No auth URL returned");
  return data.url;
}