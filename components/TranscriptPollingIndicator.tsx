import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography } from '@/constants/theme';

type Props = {
  isPolling: boolean;
  lastUpdated?: Date | null;
};

export function TranscriptPollingIndicator({ isPolling, lastUpdated }: Props) {
  if (!isPolling && !lastUpdated) return null;

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      {isPolling && (
        <View style={styles.pollingRow}>
          <MaterialIcons name="sync" size={14} color={colors.brandOrange} />
          <Text style={styles.pollingText}>Live updating...</Text>
        </View>
      )}
      {!isPolling && lastUpdated && (
        <View style={styles.updatedRow}>
          <MaterialIcons name="check-circle" size={14} color={colors.teal} />
          <Text style={styles.updatedText}>Updated {formatTime(lastUpdated)}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 146, 118, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 146, 118, 0.2)',
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  pollingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  updatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pollingText: {
    fontSize: 12,
    color: colors.brandOrange,
    fontFamily: typography.fontFamily.medium,
  },
  updatedText: {
    fontSize: 12,
    color: colors.teal,
    fontFamily: typography.fontFamily.medium,
  },
});
