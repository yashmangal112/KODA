/**
 * SettingsToggleRow
 * A single labeled toggle row inside a glass card section.
 * Mirrors HTML: label flex justify-between + custom CSS toggle.
 */

import { colors, typography } from '@/constants/theme';
import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';

type Props = {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
};

const ORANGE = colors.brandOrange;
const TRACK_OFF = '#353534';
const THUMB = '#ffffff';

export default function SettingsToggleRow({ label, value, onChange, disabled }: Props) {
  const translateX = useRef(new Animated.Value(value ? 1 : 0)).current;

  const toggle = () => {
    if (disabled) return;
    const next = !value;
    Animated.spring(translateX, {
      toValue: next ? 1 : 0,
      useNativeDriver: true,
      bounciness: 6,
    }).start();
    onChange(next);
  };

  const thumbTranslate = translateX.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  });

  const trackBg = translateX.interpolate({
    inputRange: [0, 1],
    outputRange: [TRACK_OFF, ORANGE],
  });

  return (
    <TouchableOpacity
      onPress={toggle}
      activeOpacity={0.75}
      style={[styles.row, disabled && styles.rowDisabled]}
    >
      <Text style={styles.label}>{label}</Text>

      {/* Custom animated toggle */}
      <Animated.View style={[styles.track, { backgroundColor: trackBg }]}>
        <Animated.View
          style={[styles.thumb, { transform: [{ translateX: thumbTranslate }] }]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  rowDisabled: {
    opacity: 0.45,
  },
  label: {
    fontSize: 16,
    fontFamily: typography.fontFamily.regular,
    color: colors.onSurface,
    flex: 1,
    paddingRight: 16,
  },
  track: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: THUMB,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
});