import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, spacing, radii, typography } from '@/constants/theme';
import KodaDotsLoader from '@/components/KodaDotsLoader';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { getApiErrorMessage, isNetworkError } from '@/lib/apiErrors';
import { resolvePostVerifyRoute } from '@/lib/navigation';
import { verifyToken, resendVerificationCode } from '@/services/auth';
import { getUserEmail } from '@/services/storage';

const OTP_LENGTH = 6;
const RESEND_COUNTDOWN_S = 59;

// ─── Single OTP box ───────────────────────────────────────────────────────────
function OtpBox({
  value,
  isFocused,
  hasError,
}: {
  value: string;
  isFocused: boolean;
  hasError: boolean;
}) {
  const borderAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(borderAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [isFocused, borderAnim]);

  useEffect(() => {
    if (value) {
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.08,
          useNativeDriver: true,
          speed: 40,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 30,
        }),
      ]).start();
    }
  }, [value, scaleAnim]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      hasError ? colors.danger : colors.border,
      colors.brandOrange,
    ],
  });

  const glowOpacity = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.25],
  });

  return (
    <Animated.View
      style={[
        styles.otpBox,
        {
          borderColor,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Glow overlay */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          {
            borderRadius: radii.card,
            backgroundColor: colors.brandOrange,
            opacity: glowOpacity,
          },
        ]}
      />
      <Text style={[styles.otpDigit, hasError && styles.otpDigitError]}>
        {value ? '•' : ''}
      </Text>
    </Animated.View>
  );
}

// ─── Success overlay ──────────────────────────────────────────────────────────
function SuccessOverlay({ visible }: { visible: boolean }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(checkScale, {
          toValue: 1,
          useNativeDriver: true,
          bounciness: 14,
        }),
      ]).start();
    }
  }, [visible, opacity, checkScale]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.successOverlay, { opacity }]}>
      <Animated.View
        style={[styles.successCircle, { transform: [{ scale: checkScale }] }]}
      >
        <Text style={styles.checkmark}>✓</Text>
      </Animated.View>
      <Text style={styles.successTitle}>Verified</Text>
      <Text style={styles.successSubtitle}>
        Your identity has been confirmed.
      </Text>
    </Animated.View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function VerifyTokenScreen() {
  const router = useRouter();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const { refreshAuthState } = useAuth();
  const toast = useToast();

  const [resolvedEmail, setResolvedEmail] = useState<string | null>(null);
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COUNTDOWN_S);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<Array<TextInput | null>>(
    Array(OTP_LENGTH).fill(null),
  );
  const buttonScale = useRef(new Animated.Value(1)).current;
  const shakeX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const paramEmail =
      typeof emailParam === 'string' ? emailParam : emailParam?.[0];
    if (paramEmail) {
      setResolvedEmail(paramEmail);
      return;
    }
    getUserEmail().then((stored) => {
      if (stored) setResolvedEmail(stored);
    });
  }, [emailParam]);

  const triggerShake = useCallback(() => {
    shakeX.setValue(0);
    Animated.sequence([
      Animated.timing(shakeX, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeX]);

  // ── Countdown timer ──
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const formattedCountdown = `00:${String(countdown).padStart(2, '0')}`;
  const isComplete = otp.every(d => d !== '');

  // ── OTP input handling ──
  const handleInput = useCallback(
    (text: string, index: number) => {
      // Allow paste of full code
      if (text.length === OTP_LENGTH && index === 0) {
        const digits = text.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
        if (digits.length === OTP_LENGTH) {
          setOtp(digits);
          inputRefs.current[OTP_LENGTH - 1]?.focus();
          setFocusedIndex(OTP_LENGTH - 1);
          setHasError(false);
          return;
        }
      }

      const digit = text.replace(/\D/g, '').slice(-1);
      const updated = [...otp];
      updated[index] = digit;
      setOtp(updated);
      setHasError(false);
      setErrorMsg(null);

      if (digit && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
        setFocusedIndex(index + 1);
      }
    },
    [otp],
  );

  const handleKeyPress = useCallback(
    (key: string, index: number) => {
      if (key === 'Backspace' && !otp[index] && index > 0) {
        const updated = [...otp];
        updated[index - 1] = '';
        setOtp(updated);
        inputRefs.current[index - 1]?.focus();
        setFocusedIndex(index - 1);
      }
    },
    [otp],
  );

  // ── Verify ──
  const handleVerify = async () => {
    if (!isComplete || isLoading) return;
    setIsLoading(true);
    setHasError(false);
    setErrorMsg(null);

    try {
      if (!resolvedEmail) {
        const msg = 'Email not found. Please register or sign in again.';
        setErrorMsg(msg);
        toast.showError(msg);
        return;
      }

      const token = otp.join('');
      await verifyToken({ token, email: resolvedEmail });
      await refreshAuthState();

      setShowSuccess(true);
      toast.showSuccess('Email verified');

      setTimeout(() => {
        router.replace(resolvePostVerifyRoute() as never);
      }, 2000);
    } catch (e: unknown) {
      if (isNetworkError(e)) {
        return;
      }

      setHasError(true);
      triggerShake();
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
      setFocusedIndex(0);
      const msg = getApiErrorMessage(e, 'Invalid code. Please try again.');
      setErrorMsg(msg);
      toast.showError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Resend ──
  const handleResend = async () => {
    if (!canResend) return;
    setCanResend(false);
    setCountdown(RESEND_COUNTDOWN_S);
    setOtp(Array(OTP_LENGTH).fill(''));
    setHasError(false);
    setErrorMsg(null);
    inputRefs.current[0]?.focus();
    setFocusedIndex(0);

    try {
      if (!resolvedEmail) {
        toast.showError('Email not found. Please register or sign in again.');
        return;
      }

      await resendVerificationCode(resolvedEmail);
      toast.showSuccess('Verification code sent');
    } catch (e: unknown) {
      if (isNetworkError(e)) {
        return;
      }
      const msg = getApiErrorMessage(e, 'Could not resend code. Please try again.');
      toast.showError(msg);
      setErrorMsg(msg);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Verify Email</Text>
        <View style={styles.topBarSpacer} />
      </View>

      <View style={styles.content}>
        {/* Title */}
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Enter Code</Text>
          <Text style={styles.subtitle}>
            {`We've sent a 6-digit code to `}
            <Text style={styles.emailHighlight}>
              {resolvedEmail ?? 'your email'}
            </Text>
            {`. Enter it below to verify your account.`}
          </Text>
        </View>

        {/* OTP boxes — hidden text inputs behind visual boxes */}
        <View style={styles.otpSection}>
          <Animated.View
            style={[styles.otpRow, { transform: [{ translateX: shakeX }] }]}
          >
            {otp.map((digit, i) => (
              <TouchableOpacity
                key={i}
                activeOpacity={1}
                onPress={() => {
                  inputRefs.current[i]?.focus();
                  setFocusedIndex(i);
                }}
              >
                <OtpBox
                  value={digit}
                  isFocused={focusedIndex === i}
                  hasError={hasError}
                />
              </TouchableOpacity>
            ))}
          </Animated.View>

          {/* Hidden real inputs */}
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={ref => { inputRefs.current[i] = ref; }}
              value={digit}
              onChangeText={text => handleInput(text, i)}
              onKeyPress={({ nativeEvent }) =>
                handleKeyPress(nativeEvent.key, i)
              }
              onFocus={() => setFocusedIndex(i)}
              keyboardType="number-pad"
              maxLength={i === 0 ? OTP_LENGTH : 1}
              textContentType="oneTimeCode"
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              style={styles.hiddenInput}
              caretHidden
              selectionColor="transparent"
            />
          ))}

          {/* Error message */}
          {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

          {/* Resend */}
          <View style={styles.resendBlock}>
            <Text style={styles.resendHint}>Didn't receive the code?</Text>
            <TouchableOpacity onPress={handleResend} disabled={!canResend}>
              <Text
                style={[
                  styles.resendButton,
                  !canResend && styles.resendButtonDisabled,
                ]}
              >
                {canResend
                  ? 'Resend code'
                  : `Resend code in ${formattedCountdown}`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Verify CTA */}
        <View style={styles.ctaWrapper}>
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[
                styles.verifyButton,
                isComplete && !isLoading
                  ? styles.verifyButtonActive
                  : styles.verifyButtonInactive,
              ]}
              onPress={handleVerify}
              onPressIn={() =>
                isComplete &&
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
              disabled={!isComplete || isLoading}
              activeOpacity={1}
            >
              {isLoading ? (
                <KodaDotsLoader
                  size={7}
                  spacing={8}
                  activeColor={
                    isComplete ? colors.buttonTextDark : colors.orangeLight
                  }
                  inactiveColor={
                    isComplete ? 'rgba(92,12,0,0.35)' : 'rgba(227,190,182,0.25)'
                  }
                />
              ) : (
                <Text
                  style={[
                    styles.verifyButtonText,
                    !isComplete && styles.verifyButtonTextInactive,
                  ]}
                >
                  Verify
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      {/* Success overlay */}
      <SuccessOverlay visible={showSuccess} />
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const OTP_BOX_SIZE = 48;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // ── Top bar ──
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.marginPage,
    height: 64,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  backButton: {
    width: 40,
    alignItems: 'flex-start',
  },
  backArrow: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 22,
    color: colors.white,
  },
  topBarTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 17,
    color: colors.orangeLight,
    letterSpacing: -0.2,
  },
  topBarSpacer: { width: 40 },

  // ── Content ──
  content: {
    flex: 1,
    paddingHorizontal: spacing.marginPage,
    paddingTop: spacing.xxl,
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
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 16,
    lineHeight: 26,
    color: colors.muted,
  },
  emailHighlight: {
    fontFamily: typography.fontFamily.medium,
    color: 'rgba(255,180,164,0.85)',
  },

  // ── OTP ──
  otpSection: {
    alignItems: 'center',
  },
  otpRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.lg,
  },
  otpBox: {
    width: OTP_BOX_SIZE,
    height: OTP_BOX_SIZE + 8,
    borderRadius: radii.card,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  otpDigit: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 24,
    color: colors.white,
    lineHeight: 28,
  },
  otpDigitError: {
    color: colors.danger,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  errorText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 13,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: spacing.md,
  },

  // ── Resend ──
  resendBlock: {
    alignItems: 'center',
    gap: 6,
  },
  resendHint: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
    color: 'rgba(227,190,182,0.5)',
    letterSpacing: 0.3,
  },
  resendButton: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 12,
    color: 'rgba(255,180,164,0.85)',
    letterSpacing: 0.3,
  },
  resendButtonDisabled: {
    color: 'rgba(227,190,182,0.3)',
  },

  // ── CTA ──
  ctaWrapper: {
    position: 'absolute',
    bottom: spacing.xl + 8,
    left: spacing.marginPage,
    right: spacing.marginPage,
  },
  verifyButton: {
    height: 56,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButtonActive: {
    backgroundColor: colors.brandOrange,
    shadowColor: colors.brandOrange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 8,
  },
  verifyButtonInactive: {
    backgroundColor: colors.surfaceHigh,
  },
  verifyButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 17,
    color: colors.buttonTextDark,
    letterSpacing: -0.2,
  },
  verifyButtonTextInactive: {
    color: 'rgba(227,190,182,0.3)',
  },

  // ── Success overlay ──
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13,13,13,0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.brandOrange,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brandOrange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 12,
    marginBottom: spacing.sm,
  },
  checkmark: {
    fontSize: 42,
    color: colors.white,
    lineHeight: 50,
  },
  successTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 32,
    color: colors.white,
    letterSpacing: -0.5,
  },
  successSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 16,
    color: colors.muted,
    textAlign: 'center',
  },
});