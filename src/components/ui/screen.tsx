import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}>;

export function Screen({ children, scroll = true, contentStyle }: ScreenProps) {
  const insets = useSafeAreaInsets();

  const content = [
    styles.content,
    {
      paddingTop: insets.top + Spacing.three,
      paddingLeft: insets.left + Spacing.four,
      paddingRight: insets.right + Spacing.four,
      paddingBottom: insets.bottom + BottomTabInset + Spacing.five,
    },
    contentStyle,
  ];

  if (!scroll) {
    return (
      <ThemedView style={styles.fill}>
        <View style={content}>{children}</View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.fill}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={content}>{children}</View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flexGrow: 1,
  },
});
