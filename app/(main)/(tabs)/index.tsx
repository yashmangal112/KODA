/**
 * (tabs)/index.tsx  —  Meetings Home Screen
 *
 * Matches the HTML design 1:1:
 *   • Top app bar (logo + overflow menu + avatar)
 *   • Greeting + meeting count subline
 *   • Device status strip (connected / offline)
 *   • Filter pills (All / Team / Personal)
 *   • Meeting cards list
 *
 * TODO markers indicate where real APIs / hooks will plug in.
 */

import { MaterialIcons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import { useMeetingInvalidation } from '@/contexts/MeetingInvalidationContext';
import { useFocusEffect } from '@react-navigation/native';

import {
  Image,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { KodaWordmark } from '@/components/KodaWordmark';
import Screen from '@/components/layout/Screen';
import DeviceStatusStrip, { DeviceStatus } from '@/components/meetings/DeviceStatusStrip';
import FilterPills, { MeetingFilter } from '@/components/meetings/FilterPills';
import MeetingCard, { Meeting } from '@/components/meetings/MeetingCard';
import { colors, typography } from '@/constants/theme';
import { useGreeting } from '@/hooks/useGreeting';
import { useMeetings } from '@/hooks/useMeetings';
import { KodaGeometricLoader } from '@/components/KodaGeometricLoader';
import { useRouter } from 'expo-router';
import { useToast } from '@/contexts/ToastContext';

// ── Mock data ──────────────────────────────────────────────────────────────
// TODO: Replace with useUser() hook for real name + avatar.

const MOCK_USER = {
  name: 'Rahul',
  avatarUrl: null as string | null,   // TODO: real avatar URL from auth
};

const MOCK_DEVICE: DeviceStatus = {
  connected: true,
  batteryLevel: 84,
  // TODO: Replace with useBLEDevice() / useKodaDevice() hook
};

// ── Top App Bar ────────────────────────────────────────────────────────────

function TopBar({
  avatarUrl,
  onMenuPress,
}: {
  avatarUrl: string | null;
  onMenuPress: () => void;
}) {
  return (
    <View style={styles.topBar}>
      {/* KODA wordmark/logo */}
      <Text style={styles.topBarLogo}>
        <KodaWordmark kodColor={colors.onSurface} letterSpacing={2.2} />
      </Text>

      <View style={styles.topBarRight}>
        <TouchableOpacity onPress={onMenuPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialIcons name="more-vert" size={22} color="rgba(227,190,182,0.7)" />
        </TouchableOpacity>

        {/* Avatar */}
        <View style={styles.avatar}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
          ) : (
            // Fallback initials
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>
                {MOCK_USER.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────

function EmptyState({ filter }: { filter: MeetingFilter }) {
  const msg =
    filter === 'team'     ? 'No team meetings yet.' :
    filter === 'personal' ? 'No personal meetings yet.' :
                            'No meetings yet. Start recording!';
  return (
    <View style={styles.empty}>
      <MaterialIcons name="event-busy" size={40} color="rgba(227,190,182,0.2)" />
      <Text style={styles.emptyText}>{msg}</Text>
    </View>
  );
}


// ── Screen ─────────────────────────────────────────────────────────────────

export default function MeetingsScreen() {
  const [filter, setFilter] = useState<MeetingFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const { consumeDirty } = useMeetingInvalidation();

  const router = useRouter();
  const toast = useToast();
  const { meetings, loading, error, refetch } = useMeetings({ 
    filter,
    autoFetch: true 
  });

  console.log("Calling now")

useFocusEffect(
  useCallback(() => {
    console.log('Focus triggered');

    if (consumeDirty()) {
      console.log('Dirty found, refetching');
      refetch();
    }
  }, [consumeDirty, refetch])
);
  
  const device = MOCK_DEVICE;
  const user = MOCK_USER;

  const weeklyCount = meetings.filter(m => m.status !== 'archived').length;

  const { salutation, subline } = useGreeting({
    name: user.name,
    weeklyMeetingCount: weeklyCount,
    deviceConnected: device.connected,
  });

  // Filter logic
  const filtered = useMemo(() => {
    if (filter === 'all') return meetings;
    return meetings.filter((m) => m.type === filter);
  }, [meetings, filter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleCardPress = useCallback((meeting: Meeting) => {
    if(meeting.status === 'archived'){
      toast.showInfo('Archive the meeting first !')
      return;
    }
    router.push(`/meeting/${meeting.id}`);
  }, [router]);

  const handleMenuPress = useCallback(() => {
    // TODO: show action sheet / bottom sheet
    console.log('Open overflow menu');
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#131313" />

      <TopBar avatarUrl={user.avatarUrl} onMenuPress={handleMenuPress} />

      <Screen
        scroll
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.brandOrange}
            colors={[colors.brandOrange]}
          />
        }
      >
        {/* ── Greeting ── */}
        <View style={styles.greeting}>
          <Text style={styles.greetingSalutation}>{salutation}</Text>
          <Text style={styles.greetingSubline}>{subline}</Text>
        </View>

        {/* ── Device strip ── */}
        {/* TODO: Wire to real BLE device state */}
        <DeviceStatusStrip
          connected={device.connected}
          batteryLevel={device.batteryLevel}
        />

        {/* ── Filter pills ── */}
        <FilterPills active={filter} onChange={setFilter} />

        {/* ── Meeting cards ── */}
        <View style={styles.cardList}>
          {loading && filtered.length === 0 ? (
            <View style={styles.loaderContainer}>
              <KodaGeometricLoader />
            </View>
          ) : error && meetings.length === 0 ? (
            <View style={styles.empty}>
              <MaterialIcons name="error-outline" size={40} color="rgba(227,190,182,0.2)" />
              <Text style={styles.emptyText}>Failed to load meetings.</Text>
              <TouchableOpacity onPress={refetch}>
                <Text style={{ color: colors.brandOrange, marginTop: 8, fontFamily: typography.fontFamily.medium }}>
                  Retry
                </Text>
              </TouchableOpacity>
            </View>
          ) : filtered.length === 0 ? (
            <EmptyState filter={filter} />
          ) : (
            filtered.map((m) => (
              <MeetingCard key={m.id} meeting={m} onPress={handleCardPress} />
            ))
          )}
        </View>
      </Screen>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const BRAND_ORANGE = colors.brandOrange;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#131313',
  },

  /* Top bar */
  topBar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    backgroundColor: '#131313',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  topBarLogo: {
    // container for the two-tone wordmark
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: typography.fontFamily.medium,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor:  colors.surfaceHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onSurface,
    fontFamily: typography.fontFamily.semiBold,
  },

  /* Scroll */
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 16,
  },

  /* Greeting */
  greeting: {
    gap: 4,
  },
  greetingSalutation: {
    fontSize: 20,
    fontWeight: '500',
    color: colors.onSurface,
    letterSpacing: -0.4,
    fontFamily: typography.fontFamily.medium,
  },
  greetingSubline: {
    fontSize: 14,
    color: 'rgba(227,190,182,0.7)',
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
  },

  /* Cards */
  cardList: {
    gap: 14,
  },

  /* Empty */
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(227,190,182,0.4)',
    textAlign: 'center',
    fontFamily: typography.fontFamily.medium,
  },

  /* Loader */
  loaderContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
});