import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors, layout, radii, typography } from '@/constants/theme';

const TAB_CONFIG = {
  index: { label: 'MEETINGS', icon: 'chatbubble-outline' as const },
  record: { label: 'RECORD', icon: 'mic' as const },
  settings: { label: 'SETTINGS', icon: 'options-outline' as const },
};

export function BottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const config = TAB_CONFIG[route.name as keyof typeof TAB_CONFIG];
          const color = isFocused ? colors.brandOrange : colors.muted;

          if (route.name === 'record') {
            return (
              <View key={route.key} style={styles.centerSlot}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  onPress={() => navigation.navigate(route.name)}
                  style={styles.recordButton}
                >
                  <Ionicons name="mic" size={28} color={colors.white} />
                </Pressable>
                {isFocused ? <View style={styles.recordDot} /> : null}
              </View>
            );
          }

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={() => navigation.navigate(route.name)}
              style={styles.tab}
            >
              <Ionicons name={config.icon} size={22} color={color} />
              <Text style={[styles.tabLabel, { color }]}>{config.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.navBorder,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    minHeight: layout.tabBarHeight,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingBottom: 6,
  },
  tabLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 10,
    letterSpacing: 0.6,
  },
  centerSlot: {
    flex: 1,
    alignItems: 'center',
    marginTop: -28,
  },
  recordButton: {
    width: layout.recordButtonSize,
    height: layout.recordButtonSize,
    borderRadius: radii.pill,
    backgroundColor: colors.brandOrange,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brandOrange,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  recordDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brandOrange,
    marginTop: 6,
  },
});
