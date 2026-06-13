/**
 * WarningModal
 * Reusable confirmation modal for destructive actions.
 * Usage: archive meeting, reset device, delete item, sign out, etc.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography } from '@/constants/theme';

const ERROR      = '#ffb4ab';
const SURFACE    = colors.surface;
const SURFACE_HIGH = colors.surfaceHigh;
const ON_SURFACE = colors.onSurface;
const ON_VAR     = 'rgba(227,190,182,0.6)';
const BORDER     = colors.border;

// ── Spinner ───────────────────────────────────────────────────────────────

function Spinner({ color }) {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 700, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, []);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <MaterialIcons name="refresh" size={20} color={color} />
    </Animated.View>
  );
}



// ── Component ─────────────────────────────────────────────────────────────

export default function WarningModal({
  visible,
  onClose,
  onConfirm,
  icon          = 'warning',
  iconColor     = ERROR,
  title,
  body,
  highlight,
  confirmLabel  = 'Confirm',
  cancelLabel   = 'Cancel',
  errorMessage,
}) {
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scrimAnim = useRef(new Animated.Value(0)).current;

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  // Reset error when reopened
  useEffect(() => {
    if (visible) setError(null);
  }, [visible]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1,    bounciness: 6, speed: 20, useNativeDriver: true }),
        Animated.timing(fadeAnim,  { toValue: 1,    duration: 200, useNativeDriver: true }),
        Animated.timing(scrimAnim, { toValue: 1,    duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 0.88, duration: 160, useNativeDriver: true }),
        Animated.timing(fadeAnim,  { toValue: 0,    duration: 160, useNativeDriver: true }),
        Animated.timing(scrimAnim, { toValue: 0,    duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      setError(errorMessage ?? e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return; // prevent close while loading
    onClose();
  };

  if (!visible) return null;

  // Render body with optional highlighted segment
  const renderBody = () => {
    if (!highlight) {
      return <Text style={styles.body}>{body}</Text>;
    }
    const parts = body.split(highlight);
    return (
      <Text style={styles.body}>
        {parts[0]}
        <Text style={styles.bodyBold}>"{highlight}"</Text>
        {parts[1]}
      </Text>
    );
  };

  return (
    <Modal transparent animationType="none" onRequestClose={handleClose} statusBarTranslucent>
      {/* Scrim */}
      <Animated.View style={[styles.scrim, { opacity: scrimAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      {/* Card */}
      <View style={styles.center}>
        <Animated.View
          style={[
            styles.card,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Icon */}
          <View style={[styles.iconRing, { backgroundColor: `${iconColor}14`, borderColor: `${iconColor}30` }]}>
            <MaterialIcons name={icon} size={28} color={iconColor} />
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Body */}
          {renderBody()}

          {/* Error banner */}
          {error && (
            <View style={styles.errorBanner}>
              <MaterialIcons name="error-outline" size={15} color={ERROR} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={handleClose}
              activeOpacity={0.75}
              disabled={loading}
              style={[styles.cancelBtn, loading && { opacity: 0.5 }]}
            >
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleConfirm}
              activeOpacity={0.8}
              disabled={loading}
              style={[styles.confirmBtn, { backgroundColor: `${iconColor}18`, borderColor: `${iconColor}40` }, loading && { opacity: 0.7 }]}
            >
              {loading
                ? <Spinner color={iconColor} />
                : <Text style={[styles.confirmText, { color: iconColor }]}>{confirmLabel}</Text>
              }
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    zIndex: 10,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    zIndex: 20,
  },
  card: {
    width: '100%',
    backgroundColor: SURFACE,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 28,
    elevation: 18,
  },
  iconRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
    color: ON_SURFACE,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    color: ON_VAR,
    textAlign: 'center',
    lineHeight: 21,
    fontFamily: typography.fontFamily.regular,
  },
  bodyBold: {
    color: ON_SURFACE,
    fontFamily: typography.fontFamily.semiBold,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${ERROR}14`,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: `${ERROR}30`,
    width: '100%',
  },
  errorText: {
    fontSize: 13,
    color: ERROR,
    fontFamily: typography.fontFamily.regular,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    backgroundColor: SURFACE_HIGH,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.semiBold,
    color: ON_SURFACE,
  },
  confirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
  },
});