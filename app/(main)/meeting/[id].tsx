/**
 * app/(main)/meeting/[id].tsx  —  Meeting Detail / Transcript Screen
 *
 * Sections (matching HTML exactly):
 *   1. Top app bar  — back + title + overflow
 *   2. Meta bar     — scrollable chips (duration, date, voices, integrations)
 *   3. KODA Intelligence banner
 *   4. Transcript   — speaker blocks with inline action-item highlights
 *   5. Ask KODA     — floating pill (fixed bottom)
 *
 * TODO markers show where real API data plugs in.
 */

import { KodaGeometricLoader } from '@/components/KodaGeometricLoader';
import { TranscriptPollingIndicator } from '@/components/TranscriptPollingIndicator';
import { colors, typography } from '@/constants/theme.js';
import { useMeeting, useMeetingTranscript } from '@/hooks/useMeetings';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import KodaChatDrawer, { KodaChatDrawerHandle } from '@/components/meetings/KodaChatDrawer';
import MeetingOptionsMenu from '@/components/meetings/MeetingOptionsMenu';
import { getApiErrorMessage, isNetworkError } from "@/lib/apiErrors";
import { useToast } from '@/contexts/ToastContext';
import { useMeetingInvalidation } from '@/contexts/MeetingInvalidationContext';
import { useFocusEffect } from '@react-navigation/native';


import {
  Animated,
  Easing,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { formatDate, formatDuration } from '@/helper/utils';
import { archiveMeeting, patchMeeting, getMeeting } from '@/services/meetings';
// ── Design tokens (matching your theme) ──────────────────────────────────
const C = {
  bg:              '#131313',
  surface:         '#131313',
  surfaceContainer: colors.surfaceContainer,
  surfaceHigh:     colors.surfaceHigh,
  surfaceHighest:  colors.surfaceHighest,
  surfaceLow:      colors.surfaceLow,
  onSurface:       colors.onSurface,
  onSurfaceVar:    'rgba(227,190,182,0.7)',
  onSurfaceVarDim: 'rgba(227,190,182,0.4)',
  orange:          colors.brandOrange,
  onOrange:        colors.orangeDark,
  teal:            colors.teal,
  blueVoice:       '#60a5fa',   // blue-400 equivalent
  border:          colors.border,
  borderSubtle:    'rgba(255,255,255,0.05)',
  primary:         '#ffb4a4'
};



// ── Types ─────────────────────────────────────────────────────────────────

type VoiceId = 'A' | 'B' | 'C' | 'D';

/** A run of text, optionally marked as an action item */
type TextRun = {
  text: string;
  isAction?: boolean;
};

type TranscriptBlock = {
  voice: VoiceId;
  time: string;
  runs: TextRun[];
};

type Participant = {
  initial: string;
  color: string;
  textColor: string;
};

// ── Mock data ─────────────────────────────────────────────────────────────
// TODO: Replace with useMeeting(id) API hook

const MOCK_META = {
  title: 'Untitled',
  integrationCount: 2,
};

const VOICE_COLORS: Record<VoiceId, string> = {
  A: C.orange,
  B: C.blueVoice,
  C: C.teal,
  D: '#c084fc',   // purple-400 for a 4th speaker
};

const PARTICIPANTS: Participant[] = [
  { initial: 'A', color: '#ffb4a4', textColor: '#000' },
  { initial: 'B', color: colors.teal, textColor: '#000' },
  { initial: 'C', color: '#60a5fa', textColor: '#000' },
  { initial: '+1', color: C.surfaceHighest, textColor: C.onSurface },
];

// TODO: Replace with transcript data from API
const TRANSCRIPT: TranscriptBlock[] = [
  {
    voice: 'A',
    time: '10:02 AM',
    runs: [
      {
        text: "Good morning everyone. Let's look at the Q4 roadmap. We need to prioritize the OLED display integration for the next prototype batch.",
      },
    ],
  },
  {
    voice: 'B',
    time: '10:04 AM',
    runs: [
      { text: "Agreed. However, we're still waiting on the thermal dissipation reports. Sarah, can you " },
      { text: 'reach out to the hardware engineering team', isAction: true },
      { text: ' by Friday?' },
    ],
  },
  {
    voice: 'A',
    time: '10:05 AM',
    runs: [
      { text: "I'll handle that. Also, Mark mentioned we should " },
      { text: 'update the firmware documentation', isAction: true },
      { text: ' to reflect the new API endpoints before the beta launch.' },
    ],
  },
  {
    voice: 'C',
    time: '10:12 AM',
    runs: [
      {
        text: "The documentation is almost done. I just need the final specs for the low-power mode transition. Once that's in, we're good to go.",
      },
    ],
  },
  {
    voice: 'B',
    time: '10:15 AM',
    runs: [
      { text: "Excellent. Let's " },
      { text: 'schedule a follow-up for next Tuesday', isAction: true },
      { text: ' to review the thermal findings and documentation progress.' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────

/* ── Meta chip ── */
function MetaChip({ children }: { children: React.ReactNode }) {
  return <View style={styles.metaChip}>{children}</View>;
}

/* ── Participant avatar cluster ── */
function AvatarCluster({ participants }: { participants: Participant[] }) {
  return (
    <View style={styles.avatarCluster}>
      {participants.map((p, i) => (
        <View
          key={i}
          style={[
            styles.avatarBubble,
            { backgroundColor: p.color, marginLeft: i === 0 ? 0 : -6 },
          ]}
        >
          <Text style={[styles.avatarInitial, { color: p.textColor }]}>
            {p.initial}
          </Text>
        </View>
      ))}
    </View>
  );
}

/* ── KODA Intelligence banner ── */
function IntelligenceBanner({
  actionItemCount,
  onPress,
}: {
  actionItemCount: number;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
      }}
    >
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={styles.banner}
    >
      {/* Icon with glow */}
      <View style={styles.bannerIconWrapper}>
        <MaterialIcons name="auto-awesome" size={20} color={C.orange} />
      </View>

      <Text style={styles.bannerText}>
        KODA found{' '}
        <Text style={styles.bannerHighlight}>{actionItemCount} action items</Text>
        {' '}— tap to review
      </Text>

      <MaterialIcons
        name="chevron-right"
        size={20}
        color={C.onSurfaceVar}
        style={{ marginLeft: 'auto' }}
      />
    </Pressable>
    </Animated.View>
  );
}

/* ── Inline text run (normal or action-item highlighted) ── */
function InlineRun({ run }: { run: TextRun }) {
  if (!run.isAction) {
    return <Text style={styles.transcriptBody}>{run.text}</Text>;
  }
  return (
    <Text style={styles.transcriptActionRun}>
      {/* Orange dot */}
      <Text style={styles.actionDot}>● </Text>
      <Text style={styles.transcriptActionText}>{run.text}</Text>
    </Text>
  );
}

/* ── Single transcript speaker block ── */
function TranscriptBlock({ block }: { block: TranscriptBlock }) {
  const borderColor = VOICE_COLORS[block.voice];
  const labelColor  = VOICE_COLORS[block.voice];

  return (
    <View style={[styles.transcriptBlock, { borderLeftColor: borderColor }]}>
      {/* Speaker + timestamp row */}
      <View style={styles.transcriptMeta}>
        <Text style={[styles.voiceLabel, { color: labelColor }]}>
          Voice {block.voice}
        </Text>
        <Text style={styles.transcriptTime}>{block.time}</Text>
      </View>

      {/* Body — mix of normal + action runs */}
      <Text style={styles.transcriptBody}>
        {block.runs.map((run, i) =>
          run.isAction ? (
            // Inline action highlight — orange underline + dot
            <Text key={i} style={styles.transcriptActionRun}>
              <Text style={styles.actionDot}>● </Text>
              <Text style={styles.transcriptActionText}>{run.text}</Text>
            </Text>
          ) : (
            <Text key={i}>{run.text}</Text>
          )
        )}
      </Text>
    </View>
  );
}


/* ── Ask KODA floating pill ── */
function AskKodaPill({ onChatPress }: { onChatPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

  // Mic glow pulse
  const glowAnim = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.55] });
  const glowScale   = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });

  return (
    <Animated.View style={[styles.askPillWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={styles.askPill}
      >
        {/* Placeholder text */}
        <Text style={styles.askPlaceholder}>Ask KODA...</Text>

        {/* Mic button with glow */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onChatPress}
          style={styles.chatButton}
        >
          {/* Glow halo */}
          <Animated.View
            style={[
              styles.chatGlow,
              { opacity: glowOpacity, transform: [{ scale: glowScale }] },
            ]}
          />
          <MaterialIcons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </Pressable>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────

export default function MeetingDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { consumeDirty , markDirty } = useMeetingInvalidation();

  const toast = useToast();

  const [menuVisible, setMenuVisible] = useState(false);

  const { meeting, loading: meetingLoading, error: meetingError, refetch } = useMeeting(id);
  const { transcript, loading: transcriptLoading, isPolling, lastUpdated } = useMeetingTranscript({
    meetingId: id,
    meetingStatus: meeting?.status,
    enabled: !!id,
    pollInterval: 15000, // 15s for active meetings
  });

  const meetingData = meeting || MOCK_META;
  const transcriptData = transcript || TRANSCRIPT;

  useFocusEffect(
    useCallback(() => {
      if (consumeDirty(id)) {
        refetch();            // this is useMeeting's refetch
      }
    }, [id, consumeDirty, refetch])
  )

  const handleBack = useCallback(() => router.back(), []);

  const handleMore = useCallback(() => {
    setMenuVisible(true);
  }, [id]);


  const handleUpdate = useCallback(async (title: string, summary: string) => {
    try {
      await patchMeeting(id, { title, summary });
      await refetch();
      markDirty(id);
      toast.showSuccess('Meeting updated');
      
    } catch (error) {
      if (isNetworkError(error)) return;
      const msg = getApiErrorMessage(error, 'Something went wrong. Please try again.');
      toast.showError(msg);
    }
  }, [id, markDirty]);
  
  const handleArchive = useCallback(async () => {
    try {
      await archiveMeeting(id);
      markDirty(); 
      toast.showSuccess('Meeting archived');
      router.replace('/(main)/(tabs)');
    } catch (error) {
      if (isNetworkError(error)) return;
      const msg = getApiErrorMessage(error, 'Could not archive. Please try again.');
      toast.showError(msg);
    }
  }, [id, markDirty, router]);

  const handleIntelligenceBanner = useCallback(() => {
    // TODO: router.push(`/meeting/${id}/actions`) — action items screen
    console.log('open action items');
  }, [id]);

  const chatDrawerRef = useRef<KodaChatDrawerHandle>(null);
  
  // Replace your existing handleChatPress / handleMicPress with:
  const handleChatPress = useCallback((prefillText?: string) => {
    if (prefillText) {
      chatDrawerRef.current?.sendMessage(prefillText);
    } else {
      chatDrawerRef.current?.open();
    }
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* ── Fullscreen loader for initial meeting load ── */}
      {meetingLoading && !meeting && (
        <View style={styles.fullscreenLoader}>
          <KodaGeometricLoader />
        </View>
      )}

      {/* ── Top App Bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={handleBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.topBarBtn}
        >
          <MaterialIcons name="arrow-back" size={22} color={C.primary} />
        </TouchableOpacity>

        <Text style={styles.topBarTitle} numberOfLines={1}>
          {meetingData.title}
        </Text>

        <TouchableOpacity
          onPress={handleMore}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.topBarBtn}
        >
          <MaterialIcons name="more-vert" size={22} color={C.primary} />
        </TouchableOpacity>
      </View>

      {/* ── Scrollable content ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Meta bar ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.metaBar}
        >
          {/* Duration */}
          <MetaChip>
            <MaterialIcons name="schedule" size={15} color={C.onSurfaceVar} />
            <Text style={styles.metaChipText}>{formatDuration(meetingData?.duration_seconds)}</Text>
          </MetaChip>

          {/* Date */}
          <MetaChip>
            <MaterialIcons name="calendar-today" size={15} color={C.onSurfaceVar} />
            <Text style={styles.metaChipText}>{formatDate(meetingData?.started_at)}</Text>
          </MetaChip>

          {/* Voices / participants */}
          <MetaChip>
            <AvatarCluster participants={PARTICIPANTS} />
            <Text style={styles.metaChipText}>4 Voices</Text>
          </MetaChip>

          {/* Integrations hub */}
          <MetaChip>
            <MaterialIcons name="hub" size={15} color={C.onSurfaceVar} />
            {/* TODO: show active integrations count badge */}
          </MetaChip>
        </ScrollView>

        {/* ── Intelligence banner ── */}
        <IntelligenceBanner
          actionItemCount={meetingData?.action_items_count?.pending}
          onPress={handleIntelligenceBanner}
        />

        {/* ── Transcript polling indicator ── */}
        <TranscriptPollingIndicator isPolling={isPolling} lastUpdated={lastUpdated} />

        {/* ── Transcript ── */}
        {transcriptLoading && transcriptData.length === 0 ? (
          <View style={styles.loaderContainer}>
            <KodaGeometricLoader />
          </View>
        ) : (
          <View style={styles.transcriptList}>
            {transcriptData.map((block, i) => (
              <TranscriptBlock key={i} block={block} />
            ))}
          </View>
        )}

        {/* Bottom padding so last block clears the floating pill */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Gradient fade (mirrors HTML gradient overlay) ── */}
      <View style={styles.fadeOverlay} pointerEvents="none" />

      {/* ── Ask KODA floating pill ── */}
      <AskKodaPill onChatPress={handleChatPress} />

      <KodaChatDrawer
        ref={chatDrawerRef}
        meetingId={id}
      />

      <MeetingOptionsMenu
        menuVisible={menuVisible}
        onMenuClose={() => setMenuVisible(false)}
        meetingTitle={meetingData?.title ?? ''}
        meetingSummary={meetingData?.summary ?? ''}
        onUpdate={handleUpdate}
        onArchive={handleArchive}
      />

    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },

  /* ── Top bar ── */
  topBar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(19,19,19,0.92)',
    borderBottomWidth: 1,
    borderBottomColor: C.borderSubtle,
    gap: 4,
  },
  topBarBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    flex: 1,
    fontSize: 18,
    color: C.onSurface,
    letterSpacing: -0.3,
    textAlign: 'center',
    paddingHorizontal: 8,
    fontFamily: typography.fontFamily.semiBold
  },

  /* ── Scroll ── */
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },

  /* ── Meta bar ── */
  metaBar: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
    paddingBottom: 8,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: C.surfaceLow,
    borderWidth: 1,
    borderColor: C.border,
  },
  metaChipText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.medium,
    color: C.onSurfaceVar,
    letterSpacing: 0.3,
  },

  /* Participant avatars */
  avatarCluster: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBubble: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: C.bg,
  },
  avatarInitial: {
    fontSize: 7,
    fontWeight: '800',
    fontFamily: typography.fontFamily.bold,
  },

  /* ── Intelligence banner ── */
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    marginTop: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,92,58,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,92,58,0.2)',
  },
  bannerIconWrapper: {
    position: 'relative',
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  
  },
  bannerIconGlow: {
    position: 'absolute',
    inset: 0,
    borderRadius: 999,
    backgroundColor: C.orange,
    opacity: 0.30,
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
    color: C.onSurface,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
  },
  bannerHighlight: {
    color: C.orange,
    fontFamily: typography.fontFamily.semiBold,
  },

  /* ── Transcript ── */
  transcriptList: {
    marginTop: 32,
    gap: 28,
  },
  transcriptBlock: {
    paddingLeft: 16,
    borderLeftWidth: 2,
  },
  transcriptMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  voiceLabel: {
    fontSize: 11,
    fontFamily: typography.fontFamily.semiBold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  transcriptTime: {
    fontSize: 11,
    fontFamily: typography.fontFamily.medium,
    color: C.onSurfaceVarDim,
    letterSpacing: 0.2,
  },
  transcriptBody: {
    fontSize: 14,
    color: C.onSurface,
    lineHeight: 22,
    fontFamily: typography.fontFamily.regular,
  },

  /* Action item inline highlight */
  transcriptActionRun: {
    // inline span — no block layout
  },
  actionDot: {
    fontSize: 8,
    color: C.orange,
    lineHeight: 22,
    textAlignVertical: 'center'
  },
  transcriptActionText: {
    fontSize: 14,
    color: C.onSurface,
    lineHeight: 22,
    textDecorationLine: 'underline',
    textDecorationColor: C.orange,
    textDecorationStyle: 'solid',
    fontFamily: typography.fontFamily.medium,
  },

  /* ── Gradient fade overlay ── */
  fadeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    // React Native doesn't have CSS linear-gradient natively.
    // Use expo-linear-gradient for a real gradient — see note below.
    // This approximation fades with a semi-transparent dark block.
    backgroundColor: 'transparent',
    // TODO: Replace with:
    // <LinearGradient colors={['transparent', C.bg]} style={styles.fadeOverlay} />
    // from expo-linear-gradient
  },

  /* ── Ask KODA pill ── */
  askPillWrapper: {
    position: 'absolute',
    bottom: 28,
    left: 24,
    right: 24,
    alignSelf: 'center',
    maxWidth: 320,
    alignItems: 'center',
  },
  askPill: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingLeft: 20,
    paddingRight: 10,
    backgroundColor: C.surfaceHigh,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.borderSubtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  askPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: C.onSurfaceVarDim,
    fontFamily: typography.fontFamily.regular,
  },
  chatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.orange,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  chatGlow: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.orange,
  },

  /* Loader styles */
  fullscreenLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: C.bg,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loaderContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
});