import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Pressable, StyleSheet, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { colors, layout } from '@/constants/theme';

const ACTIVE_TAB = '#ffb4a4';
const FAB_COLOR = colors.brandOrange;

const INACTIVE = '#fadbd4ff';
const SURFACE = 'rgba(19,19,19,0.82)';

export function BottomTabBar({
  state,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const currentRoute = state.routes[state.index].name;
  const isRecordScreen = currentRoute === 'record';

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.outer
      ]}
    >
      <BlurView
        intensity={40}
        tint="dark"
        style={styles.blur}
      >
        <View style={styles.inner}>
          {/* Meetings */}
          <TabButton
            icon="chat-bubble"
            active={currentRoute === 'index'}
            onPress={() => navigation.navigate('index')}
          />

          {/* Center */}
          {isRecordScreen ? (
            <InlineMicButton />
          ) : (
            <FloatingMicButton
              onPress={() => navigation.navigate('record')}
            />
          )}

          {/* Settings */}
          <TabButton
            icon="tune"
            active={currentRoute === 'settings'}
            onPress={() => navigation.navigate('settings')}
          />
        </View>
      </BlurView>
    </View>
  );
}

/* ───────────────────────────────────────── */
/* Normal tabs */
/* ───────────────────────────────────────── */

function TabButton({
  icon,
  active,
  onPress,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ hovered, pressed }) => [
        styles.tabButton,
        hovered && styles.hovered,
        pressed && styles.pressed,
      ]}
    >
      <MaterialIcons
        name={icon}
        size={26}
        color={active ? ACTIVE_TAB : INACTIVE}
      />
    </Pressable>
  );
}

/* ───────────────────────────────────────── */
/* Floating mic */
/* ───────────────────────────────────────── */

function FloatingMicButton({
  onPress,
}: {
  onPress: () => void;
}) {
  return (
    <View style={styles.fabWrapper}>
      <Pressable
        onPress={onPress}
        style={({ hovered, pressed }) => [
          styles.fab,
          hovered && styles.fabHover,
          pressed && styles.fabPressed,
        ]}
      >
        <MaterialIcons
          name="mic"
          size={32}
          color= {colors.orangeDark}
        />
      </Pressable>
    </View>
  );
}

/* ───────────────────────────────────────── */
/* Inline active mic */
/* ───────────────────────────────────────── */

function InlineMicButton() {
  return (
    <View style={styles.inlineMic}>
      <MaterialIcons
        name="mic"
        size={30}
        color={FAB_COLOR}
      />

      <View style={styles.inlineDot} />
    </View>
  );
}

/* ───────────────────────────────────────── */
/* Styles */
/* ───────────────────────────────────────── */

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    overflow: 'visible',
  },

  blur: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(91,64,59,0.15)',
    backgroundColor: SURFACE,
    overflow: 'visible',
  },

  inner: {
    height: layout.tabBarHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
  },

  tabButton: {
    width: 52,
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',

    transitionDuration: '300ms' as any,
  },

  hovered: {
    transform: [{ scale: 1.1 }],
  },

  pressed: {
    transform: [{ scale: 0.95 }],
  },

  /* Floating FAB */

  fabWrapper: {
    marginTop: -48,
  },

  fab: {
    width: 64,
    height: 64,
    borderRadius: 999,

    backgroundColor: FAB_COLOR,

    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: ACTIVE_TAB,
    shadowOpacity: 0.28,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 8,
    },

    elevation: 12,

    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',

    transitionDuration: '300ms' as any,
  },

  fabHover: {
    transform: [{ scale: 1.05 }],
  },

  fabPressed: {
    transform: [{ scale: 0.94 }],
  },

  /* Inline mic */

  inlineMic: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  inlineDot: {
    position: 'absolute',
    bottom: -8,

    width: 4,
    height: 4,
    borderRadius: 999,

    backgroundColor: FAB_COLOR,
  },
});