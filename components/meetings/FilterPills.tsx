/**
 * FilterPills
 * Horizontal scrollable filter tabs: All · Team · Personal
 * Mirrors: rounded-full pills with active-glow on selected
 */

import { colors, typography } from "@/constants/theme";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

export type MeetingFilter = "all" | "team" | "personal";

const PILLS: { label: string; value: MeetingFilter }[] = [
  { label: "All", value: "all" },
  { label: "Team", value: "team" },
  { label: "Personal", value: "personal" },
];

type Props = {
  active: MeetingFilter;
  onChange: (filter: MeetingFilter) => void;
};

export default function FilterPills({ active, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {PILLS.map((pill) => {
        const isActive = pill.value === active;
        return (
          <Pressable
            key={pill.value}
            onPress={() => onChange(pill.value)}
            style={({ hovered, pressed }) => [
              styles.pill,
              isActive ? styles.pillActive : styles.pillInactive,
              !isActive && hovered && styles.pillHovered,
              pressed && styles.pillPressed,
            ]}
          >
            <Text
              style={[
                styles.pillText,
                isActive ? styles.pillTextActive : styles.pillTextInactive,
              ]}
            >
              {pill.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const BRAND_ORANGE = colors.brandOrange;
const ON_PRIMARY = colors.orangeDark;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 999,
  },
  pillActive: {
    backgroundColor: BRAND_ORANGE,
  },
  pillInactive: {
    backgroundColor: colors.surfaceHigh, // surface-container-high
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.8,
    fontFamily: typography.fontFamily.medium,
  },
  pillTextActive: {
    color: ON_PRIMARY,
    fontFamily: typography.fontFamily.medium,
  },
  pillTextInactive: {
    color: colors.onSurface,
    fontFamily: typography.fontFamily.medium,
  },

  pillPressed: {
    opacity: 0.75,
  },

  pillHovered: {
    backgroundColor: colors.surfaceHighest,
  },
});
