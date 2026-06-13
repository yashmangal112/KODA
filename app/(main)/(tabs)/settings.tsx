/**
 * app/(main)/(tabs)/settings.tsx  —  Settings Screen
 *
 * Sections (matching HTML exactly):
 *   1. Top app bar     — avatar + KODA title + overflow
 *   2. My Device       — empty state card (breathing border, shimmer CTA)
 *   3. Connected Apps  — Jira, Slack, Notion rows in glass card
 *   4. Preferences     — animated toggle rows
 *   5. Account         — avatar + name + email + sign out
 *   6. DeviceDiscoverySheet — bottom sheet (modal)
 *
 * TODO markers show where real data / API / auth plugs in.
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useDeviceStatus } from '@/hooks/useDeviceStatus';


import MyDeviceSection                        from '@/components/settings/MyDeviceSection';
import ConnectedAppRow, { AppConnection }     from '@/components/settings/ConnectedAppRow';
import SettingsToggleRow                      from '@/components/settings/SettingsToggleRow';
import DeviceDiscoverySheet                   from '@/components/settings/DeviceDiscoverySheet';
import { colors, typography } from '@/constants/theme';
import Screen from '@/components/layout/Screen';


// ── Design tokens ─────────────────────────────────────────────────────────

const C = {
  bg:           colors.background,
  surface:      colors.surface,
  border:       colors.border,
  divider:      colors.navBorder,
  onSurface:    colors.onSurface,
  onSurfaceVar: 'rgba(227,190,182,0.6)',
  orange:       colors.brandOrange,
  error:        '#ffb4ab',
};

// ── Mock data ─────────────────────────────────────────────────────────────
// TODO: Replace with useUser() hook from auth context
const MOCK_USER = {
  name: 'Marcus Thorne',
  email: 'marcus@koda.ai',
  avatarUrl: null as string | null,   // TODO: real avatar URL
};

// TODO: Replace with useConnectedApps() hook
const INITIAL_APPS: AppConnection[] = [
  { id: 'jira',   label: 'Jira',   icon: 'view-kanban', connected: true  },
  { id: 'slack',  label: 'Slack',  icon: 'chat',        connected: true  },
  { id: 'notion', label: 'Notion', icon: 'description', connected: false },
];

// ─────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────

/* ── Section wrapper ── */
function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {children}
    </View>
  );
}

/* ── Glass card container ── */
function GlassCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.glassCard}>{children}</View>;
}

/* ── Divider ── */
function Divider() {
  return <View style={styles.divider} />;
}

/* ── Top App Bar ── */
function TopBar({
  user,
  onOverflow,
}: {
  user: typeof MOCK_USER;
  onOverflow: () => void;
}) {
  return (
    <View style={styles.topBar}>
      <View style={styles.topBarLeft}>
        {/* Avatar */}
        <View style={styles.topBarAvatar}>
          {user.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.topBarAvatarImg} />
          ) : (
            <View style={styles.topBarAvatarFallback}>
              <Text style={styles.topBarAvatarInitial}>
                {user.name.charAt(0)}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.topBarTitle}>KODA</Text>
      </View>

      <TouchableOpacity
        onPress={onOverflow}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <MaterialIcons name="more-vert" size={22} color={'#ffb4a4'} />
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const router = useRouter();

  const { paired, loading, refresh } = useDeviceStatus();
  // ── State ──────────────────────────────────────────────────────────────
  const [sheetVisible, setSheetVisible] = useState(false);
  const [apps, setApps]                 = useState<AppConnection[]>(INITIAL_APPS);

  // TODO: Load from user preferences store (AsyncStorage / API)
  const [autoActionItems,   setAutoActionItems]   = useState(true);
  const [autoSpeakerNames,  setAutoSpeakerNames]  = useState(false);

  // ── Handlers ───────────────────────────────────────────────────────────

  const handleFindDevice = useCallback(() => {
    setSheetVisible(true);
  }, []);

  const handleConnect = useCallback((appId: string) => {
    // TODO: Launch OAuth flow for appId
    // e.g. Linking.openURL(OAUTH_URLS[appId])
    setApps((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, connected: true } : a))
    );
  }, []);

  const handleDisconnect = useCallback((appId: string) => {
    // TODO: Call disconnect API, revoke token
    Alert.alert(
      'Disconnect app',
      `Remove ${apps.find((a) => a.id === appId)?.label} integration?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () =>
            setApps((prev) =>
              prev.map((a) => (a.id === appId ? { ...a, connected: false } : a))
            ),
        },
      ]
    );
  }, [apps]);

  const handleSignOut = useCallback(() => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          // TODO: Clear auth token, reset state, navigate to login
          // authStore.signOut();
          // router.replace('/(auth)/login');
          console.log('Sign out');
        },
      },
    ]);
  }, []);

  const handleOverflow = useCallback(() => {
    // TODO: Show overflow action sheet (About, Help, Privacy Policy, etc.)
    console.log('overflow menu');
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <TopBar user={MOCK_USER} onOverflow={handleOverflow} />

      <Screen
        scroll
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── My Device ── */}
        <MyDeviceSection onFindDevice={handleFindDevice}  connectedDevice={paired} loadingDevice={loading} onDeviceReset={refresh} />

        {/* ── Connected Apps ── */}
        <Section label="Connected Apps">
          <GlassCard>
            {apps.map((app, i) => (
              <React.Fragment key={app.id}>
                {i > 0 && <Divider />}
                <ConnectedAppRow
                  app={app}
                  onConnect={handleConnect}
                  onDisconnect={handleDisconnect}
                />
              </React.Fragment>
            ))}
          </GlassCard>
        </Section>

        {/* ── Preferences ── */}
        <Section label="Preferences">
          <GlassCard>
            <SettingsToggleRow
              label="Auto-create action items"
              value={autoActionItems}
              onChange={(v) => {
                setAutoActionItems(v);
                // TODO: persist to user preferences API
              }}
            />
            <Divider />
            <SettingsToggleRow
              label="Auto-detect speaker names"
              value={autoSpeakerNames}
              onChange={(v) => {
                setAutoSpeakerNames(v);
                // TODO: persist to user preferences API
              }}
            />
          </GlassCard>
        </Section>

        {/* ── Account ── */}
        <Section label="Account">
          <GlassCard>
            <View style={styles.accountRow}>
              {/* Avatar */}
              <View style={styles.accountAvatar}>
                {MOCK_USER.avatarUrl ? (
                  <Image source={{ uri: MOCK_USER.avatarUrl }} style={styles.accountAvatarImg} />
                ) : (
                  <View style={styles.accountAvatarFallback}>
                    <Text style={styles.accountAvatarInitial}>
                      {MOCK_USER.name.charAt(0)}
                    </Text>
                  </View>
                )}
              </View>

              {/* User info */}
              <View style={styles.accountInfo}>
                <Text style={styles.accountName}>{MOCK_USER.name}</Text>
                <Text style={styles.accountEmail}>{MOCK_USER.email}</Text>
              </View>

              {/* Sign out */}
              <TouchableOpacity onPress={handleSignOut} activeOpacity={0.7}>
                <Text style={styles.signOutText}>Sign out</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </Section>

        {/* Bottom breathing room */}
        {/* <View style={{ height: 40 }} /> */}
      </Screen>

      {/* ── Device discovery bottom sheet ── */}
      <DeviceDiscoverySheet
        visible={sheetVisible}
        onClose={() => {setSheetVisible(false); refresh();}}
      />
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },

  /* Top bar */
  topBar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    backgroundColor: C.bg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  topBarAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
  },
  topBarAvatarImg: {
    width: '100%',
    height: '100%',
  },
  topBarAvatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#353534',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarAvatarInitial: {
    fontSize: 13,
    fontWeight: '700',
    color: C.onSurface,
  },
  topBarTitle: {
    fontSize: 20,
    color: '#ffb4a4',
    letterSpacing: 0.5,
    fontFamily: typography.fontFamily.bold,
  },

  /* Scroll */
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 28,
    gap: 28,
  },

  /* Section */
  section: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 11,
    color: '#e3beb6',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    fontFamily: typography.fontFamily.semiBold,
  },

  /* Glass card */
  glassCard: {
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  divider: {
    height: 0.08,
    backgroundColor: C.divider,
    marginHorizontal: 16,
  },

  /* Account row */
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  accountAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
  },
  accountAvatarImg: {
    width: '100%',
    height: '100%',
  },
  accountAvatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#353534',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountAvatarInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: C.onSurface,
  },
  accountInfo: {
    flex: 1,
    gap: 3,
  },
  accountName: {
    fontSize: 18,
    color: C.onSurface,
    letterSpacing: -0.3,
    fontFamily: typography.fontFamily.medium
  },
  accountEmail: {
    fontSize: 13,
    color: C.onSurfaceVar,
    fontFamily: typography.fontFamily.regular
  },
  signOutText: {
    fontSize: 11,
    color: C.error,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontFamily: typography.fontFamily.semiBold
  },
});