/**
 * MeetingCard
 * Renders a single meeting entry.
 * Left border color:  orange = team,  teal/green = personal
 * Mirrors the HTML card structure exactly.
 *
 * TODO: Replace mock data type with real API response shape.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography } from '@/constants/theme';
import StatusDot from '@/constants/StatusDot';

// ── Data types ─────────────────────────────────────────────────────────────

export type MeetingType = 'team' | 'personal';

export type MeetingStatus = 'recording' | 'processing' | 'done' | 'archived';

export type Integration = 'jira' | 'slack' | 'notes';

export type ActionItem = {
  count: number;
  pending: number;
};

export type Meeting = {
  id: string;
  title: string;
  type: MeetingType;
  status: MeetingStatus;
  dateLabel: string;      // e.g. "Today 3:00 PM · 42 min"
  participantCount: number;
  integrations: Integration[];
  actionItemPendings?: number;  // number of pending action items, if any
};

// ── Integration icon map ───────────────────────────────────────────────────

function IntegrationBadge({ type }: { type: Integration }) {
  const iconMap: Record<Integration, { name: string; color: string; lib: 'mi' | 'mc' }> = {
    jira:  { name: 'data-object',   color: '#ffb4a4', lib: 'mi' },
    slack: { name: 'chat-bubble',   color: colors.teal, lib: 'mi' },
    notes: { name: 'sticky-note-2', color: colors.onSurface, lib: 'mi' },
  };
  const cfg = iconMap[type];
  return (
    <View style={styles.badge}>
      <MaterialIcons name={cfg.name as any} size={12} color={cfg.color} />
    </View>
  );
}

// ── Component ─────────────────────────────────────────────────────────────

type Props = {
  meeting: Meeting;
  onPress?: (meeting: Meeting) => void;
};

type StatusDotProps = {
  size?: number;
  color: string;
  pulse?: boolean;
  opacity?: number;
};


export default function MeetingCard({ meeting, onPress }: Props) {
  const isTeam     = meeting?.participantCount > 1;
  const MeetingStatus = meeting.status;
  const isArchived = MeetingStatus === 'archived';
  const isLive     = MeetingStatus === 'recording';

  const accentColor = isTeam ? ORANGE : TEAL;

  return (
    <Pressable
    onPress={() => onPress?.(meeting)}
    style={({ hovered, pressed }) => [
        styles.card,
        { borderLeftColor: accentColor },

        isArchived && styles.cardArchived,
        isLive && styles.cardLive,
        hovered && styles.cardHovered,
        pressed && styles.cardPressed,
    ]}
    >
      {/* ── Live badge ── */}
      {isLive && (
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      )}

      {/* ── Header row ── */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.title} numberOfLines={1}>{meeting.title}</Text>
          <Text style={styles.meta}>{meeting.dateLabel}</Text>
        </View>

        {/* Type dots — mirrors the two tiny circles top-right on team cards */}
        
          <View style={styles.typeDots}>
              {meeting.status === 'recording' && (
                <>
                  <StatusDot color="#008357ff" pulse />
                  <StatusDot active={false} inactiveColor={'#822e1431'} />
                </>
              )}

              {meeting.status === 'processing' && (
                <>
                  <StatusDot color="#008357ff" />
                  <StatusDot color="#822d14" pulse />
                </>
              )}

              {meeting.status === 'done' && (
                <>
                  <StatusDot color="#008357ff" />
                  <StatusDot color="#822d14" />
                </>
              )}
            </View>
          </View>

      {/* ── Footer row ── */}
      <View style={styles.footerRow}>
        {/* Integration badges */}
        {!isArchived ? (
          <View style={styles.badges}>
            {meeting.integrations.map((i) => (
              <IntegrationBadge key={i} type={i} />
            ))}
          </View>
        ) : (
          <View style={styles.archivedTag}>
            <Text style={styles.archivedText}>ARCHIVED</Text>
          </View>
        )}

        {/* Participant count */}
        <View style={styles.participants}>
          <MaterialIcons
            name={meeting.participantCount > 2 ? 'group' : 'person'}
            size={15}
            color="rgba(227,190,182,0.6)"
          />
          <Text style={styles.participantCount}>{meeting.participantCount}</Text>
        </View>
      </View>

      {/* ── Action items banner ── */}
      {meeting?.actionItemPendings > 0 && !isArchived && (
          <View style={styles.actionBanner}>
              <MaterialIcons name="error-outline" size={16} color={ORANGE} />
              <Text style={styles.actionText}>
                  {meeting?.actionItemPendings} action item{meeting?.actionItemPendings > 1 ? 's' : ''} pending
              </Text>
          </View>
      )}
    </Pressable>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const ORANGE = colors.brandOrange;
const TEAL   = colors.teal;


const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainer,           // surface-container
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    overflow: 'hidden',
    transform: [{ scale: 1 }],
  },
  cardPressed: {
    opacity: 0.8
},

    cardHovered: {
    backgroundColor:  colors.surfaceHighest,
    transform: [{ translateY: -1 }],
    },
  cardArchived: {
    opacity: 0.6,
  },
  cardLive: {
    borderColor: `${ORANGE}44`,
  },

  /* Live badge */
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ORANGE,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: ORANGE,
    letterSpacing: 1.5,
    fontFamily: typography.fontFamily.medium,
  },

  /* Header */
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.onSurface,
    letterSpacing: -0.3,
    fontFamily: typography.fontFamily.medium,
  },
  meta: {
    fontSize: 13,
    color: 'rgba(227,190,182,0.7)',
    marginTop: 3,
    fontFamily: typography.fontFamily.regular,
  },
  typeDots: {
    flexDirection: 'row',
    gap: 4,
    paddingTop: 4,
  },
  typeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  /* Footer */
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    fontFamily: typography.fontFamily.regular,
  },
  badges: {
    flexDirection: 'row',
    gap: -6,          // overlapping (negative marginLeft per badge)
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor:  colors.surfaceHighest,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#131313',
    marginLeft: -6,
  },
  archivedTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor:  colors.surfaceHighest,
    borderRadius: 4,
  },
  archivedText: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(227,190,182,0.6)',
    letterSpacing: 1,
    fontFamily: typography.fontFamily.medium,
  },
  participants: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  participantCount: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(227,190,182,0.6)',
    fontFamily: typography.fontFamily.semiBold,
  },

  /* Action items banner */
  actionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: 'rgba(255,92,58,0.08)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    color: ORANGE,
    letterSpacing: 0.2,
    fontFamily: typography.fontFamily.regular,
  },
});