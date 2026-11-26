import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from './icon';

import { Radius, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type BadgeTone = 'neutral' | 'muted' | 'accent' | 'stamp' | 'success' | 'danger';

type BadgeProps = PropsWithChildren<{
  tone?: BadgeTone;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}>;

/**
 * Small tracked label. Tones cover the sober palette: sage for farm/botanical
 * highlights, toasted amber for stamps and rewards, muted sand for metadata.
 */
export function Badge({ children, tone = 'neutral', icon, style }: BadgeProps) {
  const theme = useTheme();

  const palette: Record<BadgeTone, { background: string; text: string; border: string }> = {
    neutral: {
      background: theme.backgroundSecondary,
      text: theme.textSecondary,
      border: theme.border,
    },
    muted: {
      background: theme.backgroundSelected,
      text: theme.textMuted,
      border: theme.border,
    },
    accent: {
      background: theme.accentSoft,
      text: theme.accentStrong,
      border: theme.accentBorder,
    },
    stamp: {
      background: theme.stampAccentSoft,
      text: theme.stampAccent,
      border: theme.stampAccent,
    },
    success: {
      background: theme.accentSoft,
      text: theme.success,
      border: theme.accentBorder,
    },
    danger: {
      background: theme.stampAccentSoft,
      text: theme.danger,
      border: theme.border,
    },
  };

  const colors = palette[tone];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors.background, borderColor: colors.border },
        style,
      ]}>
      {icon ? <Icon name={icon} size={12} color={colors.text} /> : null}
      <Text style={[styles.label, { color: colors.text }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.two + 1,
    paddingVertical: Spacing.half + 1,
    alignSelf: 'flex-start',
  },
  label: {
    ...Type.overline,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.7,
  },
});
