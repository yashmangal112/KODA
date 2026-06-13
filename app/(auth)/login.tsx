import KodaDotsLoader from "@/components/KodaDotsLoader";
import { KodaWordmark } from "@/components/KodaWordmark";
import { colors, radii, spacing, typography } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { getApiErrorMessage, isNetworkError } from "@/lib/apiErrors";
import { resolvePostLoginRoute } from "@/lib/navigation";
import { login } from "@/services/auth";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import * as WebBrowser from "expo-web-browser";
import { signInWithGoogle, signInWithMicrosoft } from "@/services/socialAuth";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Google & Microsoft SVG paths as React Native SVG ─────────────────────────
// We use simple text icons as fallback; replace with react-native-svg icons
// if you add that dependency.

// ─── Subtle glow orb ─────────────────────────────────────────────────────────
function GlowOrb({
  color,
  size,
  style,
}: {
  color: string;
  size: number;
  style?: object;
}) {
  return (
    <View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity: 0.04,
        },
        style,
      ]}
    />
  );
}

// ─── Divider with label ───────────────────────────────────────────────────────
function OrDivider() {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>OR</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

// ─── Social button ────────────────────────────────────────────────────────────
function SocialButton({
  label,
  onPress,
  logo,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  logo: React.ReactNode;
  disabled?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  const onPressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();

  return (
    <Animated.View
      style={{ transform: [{ scale }], opacity: disabled ? 0.6 : 1 }}
    >
      <TouchableOpacity
        style={styles.socialButton}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        disabled={disabled}
      >
        {logo}
        <Text style={styles.socialButtonText}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Google logo placeholder ──────────────────────────────────────────────────
// TODO: swap with actual SVG/image component
function GoogleLogo() {
  return (
    <View style={styles.socialLogo}>
      <Text style={styles.googleG}>G</Text>
    </View>
  );
}

// ─── Microsoft logo placeholder ──────────────────────────────────────────────
function MicrosoftLogo() {
  return (
    <View style={styles.socialLogo}>
      <View style={styles.msGrid}>
        <View style={[styles.msSquare, { backgroundColor: "#f25022" }]} />
        <View style={[styles.msSquare, { backgroundColor: "#7fba00" }]} />
        <View style={[styles.msSquare, { backgroundColor: "#00a4ef" }]} />
        <View style={[styles.msSquare, { backgroundColor: "#ffb900" }]} />
      </View>
    </View>
  );
}

// ─── Input field ─────────────────────────────────────────────────────────────
function FormInput({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  rightElement,
  editable = true,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: "email-address" | "default";
  autoCapitalize?: "none" | "sentences";
  rightElement?: React.ReactNode;
  editable?: boolean;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View
        style={[
          styles.inputContainer,
          focused && styles.inputContainerFocused,
          !editable && { opacity: 0.6 },
        ]}
      >
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(227,190,182,0.25)"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType ?? "default"}
          autoCapitalize={autoCapitalize ?? "none"}
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          selectionColor={colors.brandOrange}
          editable={editable}
        />
        {rightElement}
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const router = useRouter();
  const { refreshAuthState } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buttonScale = useRef(new Animated.Value(1)).current;

  const animatePressIn = () =>
    Animated.spring(buttonScale, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  const animatePressOut = () =>
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();

  const handleSignIn = async () => {
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      await login({ email: email.trim(), password });
      await refreshAuthState();

      const nextRoute = await resolvePostLoginRoute();

      if (nextRoute === "/(auth)/verify-token") {
        router.replace({
          pathname: "/(auth)/verify-token",
          params: { email: email.trim() },
        });
      } else {
        router.replace(nextRoute as never);
        toast.showSuccess("Signed in successfully");
      }
    } catch (e: unknown) {
      if (isNetworkError(e)) {
        return;
      }
      const msg = getApiErrorMessage(e, "Sign in failed. Please try again.");
      setError(msg);
      toast.showError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth =  async () => {
    try {
      const url = await signInWithGoogle();
      console.log("Opening auth session with URL:", url);

      const redirectUrl = __DEV__
        ? "exp+koda://auth/callback"
        : "koda://auth/callback";


      const result = await WebBrowser.openAuthSessionAsync(
        url,
        redirectUrl
      );

      console.log("Auth session result:", JSON.stringify(result, null, 2));

      if (result.type === "success") {
        // The deep link fired — auth/callback.tsx will handle the rest
        // Nothing else needed here; the callback route takes over
      } else if (result.type === "cancel") {
        console.log("User cancelled Google sign-in");
      } else {
        console.warn("Unexpected result type:", result.type);
      }
    } catch (e) {
      console.error("Google auth error:", e);
    }
  };

  const handleOutlookAuth = async () => {
    try{
      const url = await signInWithMicrosoft();
      const redirectUrl = __DEV__
        ? "exp+koda://auth/callback"
        : "koda://auth/callback";
        
      const result = await WebBrowser.openAuthSessionAsync(
        url,
        redirectUrl
      );
      console.log("Microsoft auth session result:", JSON.stringify(result, null, 2));

      if (result.type === "success") {
        // The deep link fired — auth/callback.tsx will handle the rest
      } else if (result.type === "cancel") {
        console.log("User cancelled Microsoft sign-in");
      } else {
        console.warn("Unexpected result type:", result.type);
      }
    }catch(e){
      console.error("Microsoft auth error:", e);
    } 
  };

  const handleForgotPassword = () => {
    // TODO: navigate to forgot password screen
    console.log("Forgot password pressed");
  };

  const handleRegister = () => {
    router.push("/(auth)/register");
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.screenContainer}>
        <StatusBar barStyle="light-content" />

        {/* Background glows */}
        <GlowOrb
          color={colors.brandOrange}
          size={500}
          style={{ top: -120, left: -80 }}
        />
        <GlowOrb
          color={colors.success}
          size={400}
          style={{ bottom: -100, right: -80 }}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Logo / branding ── */}
          <View style={styles.logoSection}>
            {/* TODO: replace with actual logo image */}
            {/* <Image source={require('@/assets/images/logo.png')} style={styles.logo} /> */}
            <KodaWordmark kodColor={colors.onSurface} />
            <Text style={styles.logoTagline}>
              YOUR MEETINGS, FINALLY USEFUL.
            </Text>
          </View>

          {/* ── Credentials form ── */}
          <View style={styles.form}>
            <FormInput
              label="Email Address"
              placeholder="name@company.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />

            <FormInput
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!isLoading}
              rightElement={
                <TouchableOpacity
                  onPress={() => setShowPassword((p) => !p)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.eyeIcon}>
                    {showPassword ? "🙈" : "👁"}
                  </Text>
                </TouchableOpacity>
              }
            />

            {/* Forgot password — right aligned */}
            <TouchableOpacity
              style={styles.forgotWrapper}
              disabled={isLoading}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Error message */}
            {error && <Text style={styles.errorText}>{error}</Text>}

            {/* Sign in button */}
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  isLoading && styles.primaryButtonLoading,
                ]}
                onPress={handleSignIn}
                onPressIn={animatePressIn}
                onPressOut={animatePressOut}
                disabled={isLoading}
                activeOpacity={1}
              >
                {isLoading ? (
                  <KodaDotsLoader
                    size={7}
                    spacing={8}
                    activeColor={colors.buttonTextDark}
                    inactiveColor="rgba(92,12,0,0.35)"
                  />
                ) : (
                  <Text style={styles.primaryButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* ── OR divider ── */}
          <OrDivider />

          {/* ── Social auth ── */}
          <View style={styles.socialGroup}>
            <SocialButton
              label="Continue with Google"
              onPress={handleGoogleAuth}
              logo={<GoogleLogo />}
              disabled={isLoading}
            />
            <SocialButton
              label="Continue with Outlook"
              onPress={handleOutlookAuth}
              logo={<MicrosoftLogo />}
              disabled={isLoading}
            />
          </View>

          {/* ── Register link ── */}
          <View style={styles.registerRow}>
            <Text style={styles.registerHint}>Don't have an account? </Text>
            <TouchableOpacity onPress={handleRegister}>
              <Text style={styles.registerLink}>Register</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenContainer: {
    flex: 1,
    overflow: "hidden",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.marginPage,
    paddingTop: spacing.xl + 24,
    paddingBottom: spacing.xl + 16,
  },

  // ── Logo ──
  logoSection: {
    alignItems: "center",
    marginBottom: spacing.xxl + 8,
  },
  logoText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 32,
    color: colors.white,
    letterSpacing: 6,
    marginBottom: 6,
  },
  logoTagline: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
    color: "rgba(227,190,182,0.45)",
    letterSpacing: 2.5,
  },

  // ── Form ──
  form: {
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  fieldWrapper: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
    color: "rgba(227,190,182,0.65)",
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceLow,
    borderRadius: radii.input,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    minHeight: 52,
  },
  inputContainerFocused: {
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: colors.surfaceContainer,
  },
  textInput: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: 15,
    color: colors.white,
    paddingVertical: 0,
    outlineStyle: "none",
  },
  eyeIcon: {
    fontSize: 17,
    marginLeft: 8,
  },
  forgotWrapper: {
    alignSelf: "flex-end",
    marginTop: -4,
  },
  forgotText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 13,
    color: "rgba(255,180,164,0.75)",
  },
  errorText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 13,
    color: colors.danger,
    textAlign: "center",
    marginTop: -4,
  },

  // Primary button
  primaryButton: {
    height: 56,
    backgroundColor: colors.brandOrange,
    borderRadius: radii.button,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    shadowColor: colors.brandOrange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryButtonLoading: {
    opacity: 0.8,
  },
  primaryButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 17,
    color: colors.buttonTextDark,
    letterSpacing: -0.2,
  },

  // ── Divider ──
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.lg,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  dividerText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
    color: "rgba(227,190,182,0.3)",
    letterSpacing: 2,
  },

  // ── Social buttons ──
  socialGroup: {
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 52,
    backgroundColor: colors.surfaceLow,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  socialButtonText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 15,
    color: colors.white,
  },
  socialLogo: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  googleG: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 15,
    color: "#4285F4",
  },
  msGrid: {
    width: 18,
    height: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 1.5,
  },
  msSquare: {
    width: 7.5,
    height: 7.5,
  },

  // ── Register link ──
  registerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  registerHint: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 14,
    color: "rgba(227,190,182,0.55)",
  },
  registerLink: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 14,
    color: "rgba(255,180,164,0.9)",
  },
});
