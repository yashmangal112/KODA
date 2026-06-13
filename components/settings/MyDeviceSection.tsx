/**
 * MyDeviceSection
 * Renders the "No device linked" empty state card.
 * Mirrors HTML:
 *   - Dashed border with breathing-border animation
 *   - Floating developer_board icon
 *   - "Find a device" shimmer CTA button
 *
 * TODO: Replace empty state with DeviceConnectedCard when device is paired.
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Alert,
  Modal,
  Pressable
} from 'react-native';
import { resetDevice } from '@/services/devices';
import { ActivityIndicator } from "react-native";
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography } from '@/constants/theme';
import { useToast } from '@/contexts/ToastContext';
import WarningModal from '@/helper/WarningModal';

import { LinearGradient } from 'expo-linear-gradient';
import { getApiErrorMessage, isNetworkError } from '@/lib/apiErrors';

type Props = {
  onFindDevice: () => void;
  loadingDevice?: boolean;
  onDeviceReset?: () => void;
  connectedDevice?: null | any;
};

const ORANGE = colors.brandOrange;


export default function MyDeviceSection({ onFindDevice, connectedDevice, loadingDevice, onDeviceReset }: Props) {
  // ── Breathing border animation ───────────────────────────────────────
  // Mirrors: @keyframes breathing-border { 0%,100% opacity 0.25, 50% opacity 0.6 }

  
  const breatheAnim = useRef(new Animated.Value(0)).current;
  
  // ── Float animation ──────────────────────────────────────────────────
  const floatAnim = useRef(new Animated.Value(0)).current;
  
  // ── Shimmer sweep animation ──────────────────────────────────────────
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const [resetVisible, setResetVisible] = useState(false);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(breatheAnim, { toValue: 0, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const borderOpacity = breatheAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 0.65],
  });


  
    const handleReset = useCallback(async () => {
      if (!connectedDevice?.id) return;
      try{
        await resetDevice(connectedDevice.device_id);
        onDeviceReset?.();
      }catch(e){
        if (isNetworkError(e)) {
          return;
        }
        const msg = getApiErrorMessage(e, "Reset failed. Please try again.");
        throw new Error(msg);
      }
      onDeviceReset?.();
    }, [connectedDevice]);


    if (loadingDevice) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>My Device</Text>
        <View style={[styles.emptyCard, { justifyContent: 'center', paddingVertical: 40 }]}>
          <ActivityIndicator color={colors.brandOrange} />
        </View>
      </View>
    );
  }


  if (connectedDevice) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>My Device</Text>
      <View style={styles.connectedCard}>
        
        {/* Top row — icon + info */}
        <View style={styles.connectedTop}>
          <View style={styles.deviceIconBox}>
            <MaterialIcons name="developer-board" size={40} color={'#ffb4a4'} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.connectedName}>
              {connectedDevice.device_name ?? connectedDevice.device_label ?? 'KODA Device'}
            </Text>
            <View style={styles.batteryRow}>
              <View style={styles.activeDot} />
              <Text style={styles.batteryText}>
                Battery {connectedDevice.battery_level ?? '—'}%
              </Text>
            </View>
          </View>
        </View>

        {/* Reset button */}
        <TouchableOpacity onPress={() => setResetVisible(true)} activeOpacity={0.8} style={styles.resetBtn}>
          <Text style={styles.resetBtnText}>Reset device</Text>
        </TouchableOpacity>

        <WarningModal
          visible={resetVisible}
          onClose={() => setResetVisible(false)}
          onConfirm={handleReset}
          icon="link-off"
          iconColor='#fc5151ff'
          title="Reset device?"
          body="This will unpair your KODA device. You can pair it again anytime."
          confirmLabel="Reset"
        />

      </View>
    </View>
  );
}

  const floatY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

  // Shimmer translate — moves a white sheen left to right across the button
  const shimmerX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-220, 220],
  });

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>My Device</Text>

      {/* Breathing dashed border card */}
      <Animated.View
        style={[
          styles.emptyCard,
          {
            borderColor: breatheAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [`${ORANGE}40`, `${ORANGE}99`],
            }),
          },
        ]}
      >
        {/* Floating icon */}
        <Animated.View style={{ transform: [{ translateY: floatY }] }}>
          <MaterialIcons
            name="developer-board"
            size={52}
            color="rgba(255,180,164,0.3)"
          />
        </Animated.View>

        {/* Copy */}
        <View style={styles.emptyText}>
          <Text style={styles.emptyTitle}>No device linked</Text>
          <Text style={styles.emptySubtitle}>
            Sync a KODA device to start capturing meetings
          </Text>
        </View>

        {/* Shimmer CTA button */}
        <TouchableOpacity
          onPress={onFindDevice}
          activeOpacity={0.85}
          style={styles.findBtn}
        >
          {/* Shimmer sweep overlay */}
          <Animated.View
            style={[
              styles.shimmerSweep,
              { transform: [{ translateX: shimmerX }, { skewX: '-20deg' }] },
            ]}
            >
            <LinearGradient
              colors={[
                'transparent',
                'rgba(255,255,255,0.08)',
                'rgba(255,255,255,0.10)',
                'rgba(255,255,255,0.08)',
                'transparent',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          <Text style={styles.findBtnText}>Find a device</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: typography.fontFamily.semiBold,
    color: '#e3beb6',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },

  /* Empty state card */
  emptyCard: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 20,
    backgroundColor: 'rgba(25,25,25,0.5)',
  },
  emptyText: {
    alignItems: 'center',
    gap: 5,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
    color: '#ffffff',
  },
  emptySubtitle: {
    fontSize: 13,
    color: 'rgba(227,190,182,0.65)',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 16,
    fontFamily: typography.fontFamily.regular
  },

  connectedCard: {
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.08)',
  borderRadius: 12,
  padding: 24,
  backgroundColor: '#1A1A1A',
  gap: 24,
},
connectedTop: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 16,
},
deviceIconBox: {
  width: 80,
  height: 80,
  borderRadius: 8,
  backgroundColor: 'rgba(255,255,255,0.05)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.08)',
  alignItems: 'center',
  justifyContent: 'center',
},
connectedName: {
  fontSize: 18,
  fontFamily: typography.fontFamily.semiBold,
  color: '#ffffff',
},
batteryRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  marginTop: 2,
},
activeDot: {
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: colors.teal,
},
batteryText: {
  fontSize: 14,
  fontFamily: typography.fontFamily.regular,
  color: 'rgba(227,190,182,0.8)',
},
resetBtn: {
  width: '100%',
  paddingVertical: 12,
  paddingHorizontal: 16,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: 'rgba(255,90,90,0.3)',
  alignItems: 'center',
},
resetBtnText: {
  fontSize: 16,
  fontFamily: typography.fontFamily.semiBold,
  color: 'rgba(255,90,90,0.9)',
},

  /* Shimmer button */
  findBtn: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: ORANGE,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  shimmerSweep: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 80,
    // backgroundColor: 'rgba(255,255,255,0.08)',
    opacity: 1.2
  },
 
  findBtnText: {
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
    color: colors.orangeDark,
    zIndex: 1,
  },
});