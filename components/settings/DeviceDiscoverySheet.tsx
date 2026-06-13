/**
 * DeviceDiscoverySheet
 * Bottom sheet for BLE device discovery.
 * Mirrors HTML bottom sheet exactly:
 *   - Drag handle
 *   - Previously connected device(s)
 *   - Available nearby devices (scanning shimmer row)
 *   - Radar scanning empty state
 *   - Footer hint text
 *
 * Uses react-native Animated for the slide-up spring.
 * TODO: Replace mock devices with real BLE scan results from useKodaBLE() hook.
 * TODO: Wire connect/reconnect to real BLE pairing flow.
 * TODO: Replace Modal with @gorhom/bottom-sheet for production swipe-to-dismiss.
 */

import React, { useEffect, useRef, useState, useCallback  } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { listDevice, GetNearbyDevices, pairDevice } from '@/services/devices';

import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography } from '@/constants/theme';

import { formatDate } from '@/helper/utils';
import { getApiErrorMessage, isNetworkError } from '@/lib/apiErrors';
import { useToast } from '@/contexts/ToastContext';

// ── Types ─────────────────────────────────────────────────────────────────

export type NearbyDevice = {
  id: string;
  name: string;
  signal: 'strong' | 'medium' | 'weak';
  distance: string;
};

export type PreviousDevice = {
  id: string;
  name: string;
  lastSeen: string;
};

type ConnectionState = 'idle' | 'connecting' | 'connected';

// ── Mock data ─────────────────────────────────────────────────────────────
// TODO: Replace with real BLE scan results

const MOCK_PREVIOUS: PreviousDevice[] = [
  { id: 'prev-1', name: 'KODA Pro - Office', lastSeen: '2 days ago' },
];

const MOCK_NEARBY: NearbyDevice[] = [
  { id: 'near-1', name: 'KODA Studio 4',  signal: 'strong', distance: '2m away'  },
  { id: 'near-2', name: 'KODA 2024_A',    signal: 'medium', distance: '8m away'  },
];

// ── Helpers ───────────────────────────────────────────────────────────────

const SIGNAL_COLORS: Record<NearbyDevice['signal'], string> = {
  strong: colors.teal,
  medium: '#eab308',
  weak:   colors.brandOrange,
};

const getSignalStrength = (distance: number) => {
  if (distance <= 2) return 'strong';
  if (distance <= 5) return 'medium';
  return 'weak';
};

const ORANGE = colors.brandOrange;
const TEAL   = colors.teal;
const C = {
  bg:           colors.card,
  surface:      colors.surface,
  border:       colors.border,
  onSurface:    colors.onSurface,
  onSurfaceVar: '#e3beb6',
};


// ── Ripple ring (radar animation) ────────────────────────────────────────

function RippleRing({ delay = 0 }: { delay?: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(anim, { toValue: 1, duration: 2400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const scale   = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2] });
  const opacity = anim.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 0.8, 0] });

  return (
    <Animated.View style={[styles.rippleRing, { transform: [{ scale }], opacity }]} />
  );
}

// ── Scanning shimmer row ──────────────────────────────────────────────────

function ScanShimmer() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();
  }, []);

  const bg = shimmer.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [
      'rgba(255,92,58,0)',
      'rgba(255,92,58,0.06)',
      'rgba(255,92,58,0)',
    ],
  });

  return bg;
}



function batteryIcon(level: number): React.ComponentProps<typeof MaterialIcons>['name'] {
  if (level > 90) return 'battery-full';
  if (level > 70) return 'battery-6-bar';
  if (level > 50) return 'battery-5-bar' as any; // MUI name shim
  if (level > 30) return 'battery-3-bar' as any;
  if (level > 10) return 'battery-2-bar' as any;
  return 'battery-alert';
}

// ── Device row ───────────────────────────────────────────────────────────

function DeviceRow({ name, subtitle, battery, signalColor, scanning, buttonLabel, buttonVariant, onPress, onConnected  }: {
  name: string; subtitle: string;  battery?: number; signalColor?: string; scanning?: boolean;
  buttonLabel: string; buttonVariant: 'orange' | 'outlined'; onPress: () => Promise<void>; onConnected?: () => void; 
}) {
  const [state, setState] = useState<ConnectionState>('idle');
  const spinAnim   = useRef(new Animated.Value(0)).current;
  const rippleScale   = useRef(new Animated.Value(0)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;
  const btnWidth   = useRef(new Animated.Value(0)).current; // 0=normal, 1=collapsed

  const shimmerBg = ScanShimmer();

  const handlePress = async () => {
    if (state !== 'idle') return;
    setState('connecting');

    // 1️⃣ Collapse button width to a small square
    Animated.timing(btnWidth, {
      toValue: 1, duration: 180, easing: Easing.out(Easing.ease), useNativeDriver: false,
    }).start();

    // 2️⃣ Spin the refresh icon
    const spin = Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 700, easing: Easing.linear, useNativeDriver: true })
    );
    spin.start();

    try {
      await onPress();

      spin.stop();
      spinAnim.setValue(0);

      // 3️⃣ Expand back to full width → connected state
      Animated.timing(btnWidth, {
        toValue: 0, duration: 220, easing: Easing.out(Easing.ease), useNativeDriver: false,
      }).start();

      setState('connected');

      // 4️⃣ White ripple burst — scale 0→1, opacity 0.45→0
      rippleScale.setValue(0);
      rippleOpacity.setValue(0.45);
      Animated.parallel([
        Animated.timing(rippleScale, {
          toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }),
        Animated.timing(rippleOpacity, {
          toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }),
      ]).start();
      setTimeout(() => {
        onConnected?.();
      }, 1000);

    } catch {
      // API failed — reset back to idle so user can retry
      spin.stop();
      spinAnim.setValue(0);
      Animated.timing(btnWidth, {
        toValue: 0, duration: 220, easing: Easing.out(Easing.ease), useNativeDriver: false,
      }).start();
      setState('idle');
  };
  };

  const spinDeg = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  // Width animates: normal (96) → collapsed (44) → back to normal
  const animatedWidth = btnWidth.interpolate({ inputRange: [0, 1], outputRange: [96, 44] });

  const btnStyle = state === 'connected' ? styles.btnConnected
    : buttonVariant === 'orange'         ? styles.btnOrange
    :                                      styles.btnOutlined;

  const textStyle = state === 'connected'  ? [styles.btnText, styles.btnTextConnected]
    : buttonVariant === 'outlined'         ? [styles.btnText, styles.btnTextOutlined]
    :                                        styles.btnText;

  return (
    <Animated.View style={[styles.deviceRow, scanning && { backgroundColor: shimmerBg as any }, { overflow: 'hidden' }]}>

      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: 200,
          backgroundColor: '#ffffff',
          alignSelf: 'center',
          top: '50%',
          marginTop: -200,
          opacity: rippleOpacity,
          transform: [{ scale: rippleScale }],
          zIndex: 10,
        }}
      />

      <View style={styles.deviceLeft}>
        {signalColor && <View style={[styles.signalDot, { backgroundColor: signalColor }]} />}
        <View>
  <Text style={styles.deviceName}>{name}</Text>

  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
    }}
  >
    <Text style={styles.deviceSub}>{subtitle}</Text>

    {battery !== undefined && (
      <>
        <Text
          style={{
            color: 'rgba(227,190,182,0.5)',
            marginHorizontal: 6,
          }}
        >
          •
        </Text>

        <MaterialIcons
          name={batteryIcon(battery) as any}
          size={14}
          color="rgba(227,190,182,0.7)"
        />

        <Text
          style={{
            marginLeft: 3,
            fontSize: 11,
            color: 'rgba(227,190,182,0.7)',
            fontFamily: typography.fontFamily.regular,
          }}
        >
          {battery}%
        </Text>
      </>
    )}
  </View>
</View>
      </View>

      <Animated.View
        style={[
          styles.deviceBtn,
          btnStyle,
          {
            width: animatedWidth,
            minWidth: undefined,          // let animated width take over
            overflow: 'hidden',
            flexDirection: 'row',   // ← add this
            alignItems: 'center',   // ← add this
            justifyContent: 'center'
          },
        ]}
      >
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.75}
          disabled={state !== 'idle'}
          style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}
        >
          {state === 'connecting' ? (
            <Animated.View style={{ transform: [{ rotate: spinDeg }] }}>
              <MaterialIcons
                name="refresh"
                size={16}
                color={buttonVariant === 'outlined' ? ORANGE : '#3e0500'}
              />
            </Animated.View>
          ) : (
            <Text style={textStyle}>
              {state === 'connected' ? 'Connected ✓' : buttonLabel}
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

// ── Main component ────────────────────────────────────────────────────────

type Props = {
  visible: boolean;
  onClose: () => void;
};



export default function DeviceDiscoverySheet({ visible, onClose }: Props) {
  const slideAnim  = useRef(new Animated.Value(0)).current;
  const scrimAnim  = useRef(new Animated.Value(0)).current;
  const floatAnim  = useRef(new Animated.Value(0)).current;
  const spinAnim   = useRef(new Animated.Value(0)).current;

  const [devices, setDevices] = useState([]);
  const [nearby, setNearby] = useState([]);

  const [loadingDevices, setLoadingDevices] = useState(false);

  const toast = useToast()


  const connectDevice = useCallback(async (device_token: string, device_label: string) => {
    try {
      const data = await pairDevice({ device_token, device_label });
      console.log("paired device", data);
      toast.showSuccess('Device Paired')
    } catch (e) {
      if (isNetworkError(e)) return;
      const msg = getApiErrorMessage(e, "Failed to pair device. Please try again.");
      toast.showError(msg)

    }
  }, [toast]);


  // Float animation for radar icon
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const floatY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

  // Slide up/down when visible changes
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 1, bounciness: 4, speed: 14, useNativeDriver: true }),
        Animated.timing(scrimAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 280, easing: Easing.in(Easing.ease), useNativeDriver: true }),
        Animated.timing(scrimAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

const fetchDevices = useCallback(async () => {
  try {
    const res = await listDevice();
    console.log('paired devices', res);
    setDevices(res?.devices ?? []);
  } catch (error) {
    console.error(error);
    setDevices([]);
  }
}, []);

const fetchNearbyDevices = useCallback(async () => {
  try {
    const res = await GetNearbyDevices();
    console.log('nearby devices', res);
    setNearby(res?.devices ?? []);
  } catch (error) {
    console.error(error);
    setNearby([]);
  }
}, []);


  useEffect(() => {
    if (visible) fetchDevices();
  }, [visible]);


    useEffect(() => {
    if (visible) fetchNearbyDevices();
  }, [visible]);

  const handleRefresh = () => {
    Animated.sequence([
      Animated.timing(spinAnim, { toValue: 1, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start(() => spinAnim.setValue(0));
    fetchDevices();
    fetchNearbyDevices();
  };


  const previousDevices = devices.filter(d => !d.is_currently_paired);
  const previousIds = new Set(previousDevices.map(d => d.id));
  const nearbyDevices = nearby.filter(d => !previousIds.has(d.id));

  const spinDeg = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Scrim */}
      <Animated.View style={[styles.scrim, { opacity: scrimAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        {/* Drag handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Connect a Device</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshBtn} activeOpacity={0.75}>
            <Animated.View style={{ transform: [{ rotate: spinDeg }] }}>
              <MaterialIcons name="refresh" size={20} color={C.onSurface} />
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Scrollable content */}
        <ScrollView
          style={styles.sheetScroll}
          contentContainerStyle={styles.sheetScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Previously connected */}
          <View style={styles.sheetSection}>
  <Text style={styles.sheetSectionLabel}>Previously Connected</Text>
  {loadingDevices ? (
    <ActivityIndicator color={ORANGE} style={{ marginTop: 12 }} />
  ) : previousDevices.length === 0 ? (
    <Text style={styles.emptyHint}>No previously connected devices</Text>
  ) : (
    <View style={styles.deviceList}>
      {previousDevices.map((d) => (
        <DeviceRow
          key={d.id}
          name={d.device_name ?? 'KODA Device'}
          subtitle={`Last paired ${d.last_seen ? formatDate(d.last_seen) : '—'}`}
          battery={d.battery_level}
          buttonLabel="Reconnect"
          buttonVariant="outlined"
          onPress={() => connectDevice(d.device_token, d.device_name)}
          onConnected={onClose}
        />
      ))}
    </View>
  )}
          </View>

          {/* Available nearby */}
          <View style={styles.sheetSection}>
  <Text style={styles.sheetSectionLabel}>Available Nearby</Text>
  {loadingDevices ? (
    <ActivityIndicator color={ORANGE} style={{ marginTop: 12 }} />
  ) : nearbyDevices.length === 0 ? (
    <Text style={styles.emptyHint}>No devices found nearby</Text>
  ) : (
    <View style={styles.deviceList}>
      {nearbyDevices.map((d) => (
        <DeviceRow
          key={d.id}
          name={d.device_name ?? 'KODA Device'}
          subtitle={`Near ${d.distance ?? '—'}m away`}
          buttonLabel="Connect"
          signalColor={SIGNAL_COLORS[getSignalStrength(d.distance)]}
          buttonVariant="orange"
          onPress={() => connectDevice(d.device_token, d.device_name)}
          onConnected={onClose}
        />
      ))}
    </View>
  )}
</View>

          {/* Radar scanning visual */}
          <View style={styles.radarWrapper}>
            <View style={styles.radar}>
              <RippleRing delay={0}    />
              <RippleRing delay={800}  />
              <RippleRing delay={1600} />
              <Animated.View style={{ transform: [{ translateY: floatY }] }}>
                <MaterialIcons name="radar" size={40} color={ORANGE} />
              </Animated.View>
            </View>
          </View>

          {/* Footer hint */}
          <Text style={styles.sheetFooter}>
            Make sure your KODA device is powered on and within 10 metres
          </Text>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 60,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '88%',
    zIndex: 70,
    overflow: 'hidden',
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },

  /* Sheet header */
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 12,
    paddingTop: 4,
  },
  sheetTitle: {
    fontSize: 20,
    fontFamily: typography.fontFamily.bold,
    color: C.onSurface,
    letterSpacing: -0.3,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${ORANGE}30`,
  },

  /* Scroll */
  sheetScroll: {
    flex: 1,
  },
  sheetScrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 28,
  },

  /* Section */
  sheetSection: {
    gap: 12,
  },
  sheetSectionLabel: {
    fontSize: 11,
    fontFamily: typography.fontFamily.semiBold,
    color: '#e3beb6',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  deviceList: {
    gap: 10,
  },

  /* Device row */
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  deviceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  signalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  deviceName: {
    fontSize: 15,
    fontFamily: typography.fontFamily.bold,
    color: C.onSurface,
  },
  emptyHint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    paddingVertical: 16,
    fontFamily: typography.fontFamily.regular,
  },
  deviceSub: {
    fontSize: 12,
    color: C.onSurfaceVar,
    marginTop: 2,
    fontFamily: typography.fontFamily.regular
  },

  /* Buttons */
  deviceBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 96,
  },
  btnOrange: {
    backgroundColor: '#ffb4a4',
  },
  btnOutlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: ORANGE,
  },
  btnConnected: {
    backgroundColor: `${TEAL}20`,
    borderWidth: 1,
    borderColor: TEAL,
  },
  btnLoading: {
    paddingHorizontal: 10,
    minWidth: 44,
  },
  btnText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.bold,
    color: '#3e0500',
  },
  btnTextOutlined: {
    color: ORANGE,
  },

  btnTextConnected: {
    color: TEAL,
  },

  /* Radar */
  radarWrapper: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  radar: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rippleRing: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: `${ORANGE}60`,
    backgroundColor: 'transparent',
  },

  /* Footer */
  sheetFooter: {
    fontSize: 12,
    color: C.onSurfaceVar,
    textAlign: 'center',
    lineHeight: 18,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    fontFamily: typography.fontFamily.regular
  },
});