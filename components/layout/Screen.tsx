import React from 'react';
import {
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  View,
  ViewProps,
} from 'react-native';

import { layout } from '@/constants/theme';

type Props = {
  scroll?: boolean;
  children: React.ReactNode;
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
} & ViewProps;

export default function Screen({
  scroll = false,
  children,
  contentContainerStyle,
  style,
  ...rest
}: Props) {
  if (scroll) {
    return (
      <ScrollView
        {...rest}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          contentContainerStyle,
        ]}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View style={[styles.container, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: layout.tabBarHeight + 40,
  },
});