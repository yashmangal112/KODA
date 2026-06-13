/**
 * useGreeting
 * Computes a contextual greeting based on time-of-day, day-of-week,
 * meeting count, and a small pool of personality variants.
 *
 * TODO: Accept real user name + meeting count from API/auth context.
 */

import { useMemo } from 'react';

type GreetingContext = {
  /** Display name of the signed-in user */
  name: string;
  /** How many meetings are scheduled this week */
  weeklyMeetingCount: number;
  /** Is the KODA device currently connected? */
  deviceConnected: boolean;
};

type GreetingResult = {
  salutation: string;   // e.g. "Good morning, Rahul"
  subline: string;      // e.g. "3 meetings this week · Let's make them count."
};

// ── Pools ──────────────────────────────────────────────────────────────────

const MORNING_GREETINGS   = ['Good morning', 'Rise and shine', 'Morning'];
const AFTERNOON_GREETINGS = ['Good afternoon', 'Hey there', 'Good day'];
const EVENING_GREETINGS   = ['Good evening', 'Evening', 'Hey'];
const NIGHT_GREETINGS     = ['Working late?', 'Burning the midnight oil', 'Night owl mode'];

const MOTIVATIONAL_SUFFIXES = [
  'Let\'s make them count.',
  'You\'re all set.',
  'Ready when you are.',
  'Make every word matter.',
  'KODA has your back.',
];

const ZERO_MEETING_SUBLINES = [
  'No meetings today. Enjoy the quiet.',
  'Clear schedule ahead.',
  'Free day — no recordings needed.',
];

const ONE_MEETING_SUBLINES = [
  'Just one meeting. Focus up.',
  '1 meeting on the books.',
];

const WEEKEND_SUBLINES = [
  'It\'s the weekend — rest up.',
  'Weekend mode. KODA is on standby.',
];

// ── Helpers ────────────────────────────────────────────────────────────────

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

function isWeekend(): boolean {
  const d = new Date().getDay();
  return d === 0 || d === 6;
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useGreeting({
  name,
  weeklyMeetingCount,
  deviceConnected,
}: GreetingContext): GreetingResult {
  return useMemo(() => {
    const tod = getTimeOfDay();

    // Salutation
    const greetPool =
      tod === 'morning'   ? MORNING_GREETINGS   :
      tod === 'afternoon' ? AFTERNOON_GREETINGS :
      tod === 'evening'   ? EVENING_GREETINGS   :
                            NIGHT_GREETINGS;

    const salutation = `${pickRandom(greetPool)}, ${name}`;

    // Subline
    let subline: string;

    if (isWeekend()) {
      subline = pickRandom(WEEKEND_SUBLINES);
    } else if (weeklyMeetingCount === 0) {
      subline = pickRandom(ZERO_MEETING_SUBLINES);
    } else if (weeklyMeetingCount === 1) {
      subline = pickRandom(ONE_MEETING_SUBLINES);
    } else {
      const suffix = pickRandom(MOTIVATIONAL_SUFFIXES);
      const deviceHint = !deviceConnected ? ' · Connect your device.' : '';
      subline = `${weeklyMeetingCount} meetings this week · ${suffix}${deviceHint}`;
    }

    return { salutation, subline };

    // Re-compute only when inputs change (not on every render)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, weeklyMeetingCount, deviceConnected]);
}