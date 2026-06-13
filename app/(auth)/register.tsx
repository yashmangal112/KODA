import KodaDotsLoader from "@/components/KodaDotsLoader";
import { KodaWordmark } from "@/components/KodaWordmark";
import { colors, radii, spacing, typography } from "@/constants/theme";
import { useToast } from "@/contexts/ToastContext";
import {
  getApiErrorMessage,
  getFieldErrors,
  isNetworkError,
} from "@/lib/apiErrors";
import { register } from "@/services/auth";
import { signInWithGoogle, signInWithMicrosoft } from "@/services/socialAuth";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useRef, useState } from "react";
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

// ─── Reusable form field ───────────────────────────────────────────────────────
function FormField({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  textContentType,
  rightElement,
  fieldError,
  editable = true,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: "email-address" | "default";
  autoCapitalize?: "none" | "words";
  textContentType?: "name" | "emailAddress" | "password" | "newPassword";
  rightElement?: React.ReactNode;
  fieldError?: string | null;
  editable?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const labelColor = useRef(new Animated.Value(0)).current;

  const onFocus = () => {
    setFocused(true);
    Animated.timing(labelColor, {
      toValue: 1,
      duration: 180,
      useNativeDriver: false,
    }).start();
  };
  const onBlur = () => {
    setFocused(false);
    Animated.timing(labelColor, {
      toValue: 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  };

  const interpolatedColor = labelColor.interpolate({
    inputRange: [0, 1],
    outputRange: ["#aa8982", colors.orangeLight],
  });

  return (
    <View style={styles.fieldWrapper}>
      <Animated.Text style={[styles.fieldLabel, { color: interpolatedColor }]}>
        {label}
      </Animated.Text>
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
          textContentType={textContentType}
          onFocus={onFocus}
          onBlur={onBlur}
          selectionColor={colors.brandOrange}
          editable={editable}
        />
        {rightElement}
      </View>
      {fieldError ? (
        <Text style={styles.fieldErrorText}>{fieldError}</Text>
      ) : null}
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
  return (
    <Animated.View
      style={{ transform: [{ scale }], opacity: disabled ? 0.6 : 1 }}
    >
      <TouchableOpacity
        style={styles.socialButton}
        onPress={onPress}
        onPressIn={() =>
          Animated.spring(scale, {
            toValue: 0.97,
            useNativeDriver: true,
          }).start()
        }
        onPressOut={() =>
          Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()
        }
        activeOpacity={1}
        disabled={disabled}
      >
        {logo}
        <Text style={styles.socialButtonText}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function GoogleLogo() {
  return (
    <View style={styles.socialLogo}>
      <Text style={[styles.socialLogoText, { color: "#EA4335" }]}>G</Text>
    </View>
  );
}

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

// ─── Divider ──────────────────────────────────────────────────────────────────
function OrDivider({ label }: { label: string }) {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>{label}</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function RegisterScreen() {
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});

  const buttonScale = useRef(new Animated.Value(1)).current;

  const validate = () => {
    if (!name.trim()) return "Please enter your name.";
    if (!email.trim() || !email.includes("@")) return "Enter a valid email.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    return null;
  };

  const handleCreateAccount = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setFieldErrors({});
    setIsLoading(true);

    try {
      const data  = await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      const message = data.already_registered ? "OTP resent to your email" : "Account created. Check your email for a code.";
      toast.showSuccess(message);
      router.push({
        pathname: "/(auth)/verify-token",
        params: { email: email.trim() },
      });
    } catch (e: unknown) {
      if (isNetworkError(e)) {
        return;
      }

      const apiFields = getFieldErrors(e);
      const mapped = {
        name: apiFields.name ?? apiFields.name,
        email: apiFields.email,
        password: apiFields.password ?? apiFields.security_key,
      };

      const hasFieldErrors = Object.values(mapped).some(Boolean);
      if (hasFieldErrors) {
        setFieldErrors(mapped);
      } else {
        const msg = getApiErrorMessage(
          e,
          "Registration failed. Please try again.",
        );
        setError(msg);
        toast.showError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      const url = await signInWithGoogle();
      console.log("Opening auth session with URL:", url);

      const redirectUrl = __DEV__
        ? "exp+koda://auth/callback"
        : "koda://auth/callback";

      const result = await WebBrowser.openAuthSessionAsync(url, redirectUrl);

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

  const handleOutlookSignUp = async () => {
    try {
      const url = await signInWithMicrosoft();
      const redirectUrl = __DEV__
        ? "exp+koda://auth/callback"
        : "koda://auth/callback";

      const result = await WebBrowser.openAuthSessionAsync(url, redirectUrl);
      console.log(
        "Microsoft auth session result:",
        JSON.stringify(result, null, 2),
      );

      if (result.type === "success") {
        // The deep link fired — auth/callback.tsx will handle the rest
      } else if (result.type === "cancel") {
        console.log("User cancelled Microsoft sign-in");
      } else {
        console.warn("Unexpected result type:", result.type);
      }
    } catch (e) {
      console.error("Microsoft auth error:", e);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.screenContainer}>
        <StatusBar barStyle="light-content" />

        {/* Ambient glow */}
        <View pointerEvents="none" style={styles.glowBottom} />

        {/* Header */}
        <View style={styles.header}>
          <KodaWordmark kodColor={colors.onSurface} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Initialize Account</Text>
            <Text style={styles.subtitle}>
              Set up your workspace for precision recording.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <FormField
              label="FULL NAME"
              placeholder="Enter your name"
              value={name}
              onChangeText={(v) => {
                setName(v);
                if (fieldErrors.name)
                  setFieldErrors((f) => ({ ...f, name: undefined }));
              }}
              autoCapitalize="words"
              textContentType="name"
              fieldError={fieldErrors.name}
              editable={!isLoading}
            />
            <FormField
              label="WORK EMAIL"
              placeholder="name@company.com"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                if (fieldErrors.email)
                  setFieldErrors((f) => ({ ...f, email: undefined }));
              }}
              keyboardType="email-address"
              textContentType="emailAddress"
              fieldError={fieldErrors.email}
              editable={!isLoading}
            />
            <FormField
              label="SECURITY KEY"
              placeholder="Min. 8 characters"
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                if (fieldErrors.password)
                  setFieldErrors((f) => ({ ...f, password: undefined }));
              }}
              secureTextEntry={!showPassword}
              textContentType="newPassword"
              fieldError={fieldErrors.password}
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

            {error && <Text style={styles.errorText}>{error}</Text>}

            {/* CTA */}
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  isLoading && styles.primaryButtonLoading,
                ]}
                onPress={handleCreateAccount}
                onPressIn={() =>
                  Animated.spring(buttonScale, {
                    toValue: 0.97,
                    useNativeDriver: true,
                  }).start()
                }
                onPressOut={() =>
                  Animated.spring(buttonScale, {
                    toValue: 1,
                    useNativeDriver: true,
                  }).start()
                }
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
                  <Text style={styles.primaryButtonText}>Create Account</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Divider */}
          <OrDivider label="OR CONTINUE WITH" />

          {/* Social */}
          <View style={styles.socialGroup}>
            <SocialButton
              label="Sign up with Google"
              onPress={handleGoogleSignUp}
              logo={<GoogleLogo />}
              disabled={isLoading}
            />
            <SocialButton
              label="Sign up with Outlook"
              onPress={handleOutlookSignUp}
              logo={<MicrosoftLogo />}
              disabled={isLoading}
            />
          </View>

          {/* Login link */}
          <View style={styles.loginRow}>
            <Text style={styles.loginHint}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
              <Text style={styles.loginLink}>Login</Text>
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
    overflow: "hidden", // 👈 THIS fixes horizontal scroll
  },
  glowBottom: {
    position: "absolute",
    bottom: -128,
    alignSelf: "center",
    width: 384,
    height: 384,
    borderRadius: 192,
    backgroundColor: colors.brandOrange,
    opacity: 0.03,
  },

  // ── Header ──
  header: {
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)",
  },
  logoText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 20,
    color: colors.white,
    letterSpacing: 5,
  },

  // ── Scroll content ──
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.marginPage,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl + 8,
  },

  // ── Title ──
  titleBlock: {
    marginBottom: spacing.xxl + 8,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 28,
    lineHeight: 34,
    color: colors.white,
    letterSpacing: -0.5,
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.muted,
    textAlign: "center",
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
    fontSize: 11,
    letterSpacing: 1.5,
    marginLeft: 2,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.input,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: spacing.md,
    height: 56,
  },
  inputContainerFocused: {
    borderColor: colors.brandOrange,
    shadowColor: colors.brandOrange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
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
  fieldErrorText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 12,
    color: colors.danger,
    marginLeft: 2,
    marginTop: 2,
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
    shadowRadius: 18,
    elevation: 8,
  },
  primaryButtonLoading: { opacity: 0.8 },
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
    gap: 12,
    marginBottom: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  dividerText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
    color: "rgba(227,190,182,0.3)",
    letterSpacing: 2,
  },

  // ── Social ──
  socialGroup: {
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 56,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.input,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  socialButtonText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 15,
    color: colors.white,
  },
  socialLogo: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  socialLogoText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 15,
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

  // ── Login link ──
  loginRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loginHint: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 14,
    color: "rgba(227,190,182,0.55)",
  },
  loginLink: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 14,
    color: colors.brandOrange,
  },
});
