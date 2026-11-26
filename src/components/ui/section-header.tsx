import { StyleSheet, Text, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  action?: string;
  onActionPress?: () => void;
};

export function SectionHeader({ title, subtitle, action, onActionPress }: SectionHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.textBlock}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        {subtitle ? (
          <ThemedText type="small" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {action ? (
        <Text onPress={onActionPress} style={[styles.action, { color: theme.primary }]}>
          {action}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  textBlock: {
    flexShrink: 1,
    gap: Spacing.half,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
  },
  action: {
    fontSize: 13,
    fontWeight: '600',
    paddingBottom: Spacing.half,
  },
});
