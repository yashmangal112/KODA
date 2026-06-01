import { Tabs } from 'expo-router';

import { BottomTabBar } from '@/components/navigation/BottomTabBar';
import { colors } from '@/constants/theme';

export default function MainTabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Meetings' }} />
      <Tabs.Screen name="record" options={{ title: 'Record' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
