import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { supabase } from "@/utils/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleDeepLink = async (url: string) => {
    if (!url) return;

    console.log("Callback received URL:", url);

    const parsed = Linking.parse(url);
    console.log("Parsed:", JSON.stringify(parsed));

    // For exp:// tunnel URLs, params are in queryParams directly
    const code = parsed.queryParams?.code as string | undefined;

    if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
        console.error("Token exchange error:", error.message);
        router.replace("/(auth)/login");
        return;
        }
    }

    const { data } = await supabase.auth.getSession();

    if (!data.session) {
        router.replace("/(auth)/login");
        return;
    }

    const user = data.session.user;
    const createdAt = new Date(user.created_at).getTime();
    const lastSignIn = new Date(user.last_sign_in_at ?? 0).getTime();
    const isNewUser = Math.abs(createdAt - lastSignIn) < 5000;

    router.replace(isNewUser ? "/(auth)/register" : "/(main)/(tabs)");
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleDeepLink(url);
    });

    return () => subscription.remove();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}