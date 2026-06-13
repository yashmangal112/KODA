/**
 * DeviceStatusStrip
 * Shows KODA device connection status + battery level.
 * Mirrors HTML: bg-surface-container-low rounded-xl hardware-border
 *
 * TODO: Wire `connected` and `batteryLevel` from a real BLE/device hook.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography } from '@/constants/theme';
import StatusDot from '@/constants/StatusDot';

// ── Types ──────────────────────────────────────────────────────────────────

export type DeviceStatus = {
  connected: boolean;
  batteryLevel: number; // 0–100
};

// ── Battery icon helper ────────────────────────────────────────────────────

function batteryIcon(level: number): React.ComponentProps<typeof MaterialIcons>['name'] {
  if (level > 90) return 'battery-full';
  if (level > 70) return 'battery-6-bar';
  if (level > 50) return 'battery-5-bar' as any; // MUI name shim
  if (level > 30) return 'battery-3-bar' as any;
  if (level > 10) return 'battery-2-bar' as any;
  return 'battery-alert';
}

// ── Component ─────────────────────────────────────────────────────────────

export default function DeviceStatusStrip({ connected, batteryLevel }: DeviceStatus) {
  return (
    <View style={[styles.strip, !connected && styles.stripDisconnected]}>
      {/* Left: indicator + label */}
      <View style={styles.left}>
        {connected ? (
          <StatusDot pulse color={BRAND_ORANGE} />
        ) : (
          <StatusDot active={false} />
        )}
        <Text style={[styles.label, !connected && styles.labelDim]}>
          {connected ? 'KODA DEVICE CONNECTED' : 'KODA DEVICE OFFLINE'}
        </Text>
      </View>

      {/* Right: battery */}
      {connected && (
        <View style={styles.right}>
          <Text style={styles.batteryText}>{batteryLevel}%</Text>
          <MaterialIcons
            name={batteryIcon(batteryLevel)}
            size={16}
            color="rgba(227,190,182,0.7)"
          />
        </View>
      )}

      {!connected && (
        <Text style={styles.tapHint}>Tap to connect</Text>
      )}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const BRAND_ORANGE = colors.brandOrange;


const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surfaceLow,       // surface-container-low
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stripDisconnected: {
    borderColor: 'rgba(255,255,255,0.04)',
    opacity: 0.7,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    fontSize: 11,
    letterSpacing: 1.6,
    color: colors.onSurface,
    fontFamily: typography.fontFamily.semiBold,
  },
  labelDim: {
    color: 'rgba(227,190,182,0.5)',
    fontFamily: typography.fontFamily.semiBold,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  batteryText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(227,190,182,0.7)',
    fontFamily: typography.fontFamily.medium,
    
  },
  tapHint: {
    fontSize: 11,
    color: BRAND_ORANGE,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});