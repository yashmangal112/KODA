import { useEffect } from "react";
import * as Linking from "expo-linking";
import { supabase } from "@/utils/supabase";
import { sendSessionToBackend } from "@/services/auth";
import { router } from "expo-router";

export function useOAuthCallback() {
  useEffect(() => {
    const handleOAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          return;
        }

        await sendSessionToBackend(
          session.access_token
        );

        router.replace("/(main)/(tabs)");
      } catch (error) {
        console.log(
          "OAuth callback failed",
          error
        );
      }
    };

    const sub =
      Linking.addEventListener(
        "url",
        handleOAuth
      );

    handleOAuth();

    return () => {
      sub.remove();
    };
  }, []);
}