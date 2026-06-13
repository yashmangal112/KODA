/**
 * ConnectedAppRow
 * Single row inside Connected Apps glass card.
 * Shows icon + label + "Connected" badge or "Connect" button.
 *
 * TODO: Wire onConnect to real OAuth flow per app.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography } from '@/constants/theme';

export type AppConnection = {
  id: string;
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  connected: boolean;
};

type Props = {
  app: AppConnection;
  onConnect: (appId: string) => void;
  onDisconnect: (appId: string) => void;
};

const TEAL   = colors.teal;
const ORANGE = colors.brandOrange;

export default function ConnectedAppRow({ app, onConnect, onDisconnect }: Props) {
  return (
    <View style={styles.row}>
      {/* Icon + label */}
      <View style={styles.left}>
        <View style={styles.iconBox}>
          <MaterialIcons name={app.icon} size={20} color="rgba(229,226,225,0.8)" />
        </View>
        <Text style={styles.label}>{app.label}</Text>
      </View>

      {/* Status / action */}
      {app.connected ? (
        <TouchableOpacity
          onPress={() => onDisconnect(app.id)}
          style={styles.connectedBadge}
          activeOpacity={0.7}
        >
          <Text style={styles.connectedText}>Connected</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={() => onConnect(app.id)}
          style={styles.connectBtn}
          activeOpacity={0.75}
        >
          <Text style={styles.connectText}>Connect</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    fontFamily: typography.fontFamily.regular,
    color: colors.onSurface,
  },

  /* "Connected" teal pill */
  connectedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: `${TEAL}18`,
  },
  connectedText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.semiBold,
    color: TEAL,
    letterSpacing: 0.4,
  },

  /* "Connect" orange outlined pill */
  connectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ffb4a4',
  },
  connectText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.semiBold,
    color: '#ffb4a4',
    letterSpacing: 0.4,
  },
});