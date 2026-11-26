import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from './icon';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ListRowProps = {
  icon: IconName;
  label: string;
  caption?: string;
  badge?: string;
  onPress?: () => void;
  last?: boolean;
};

export function ListRow({ icon, label, caption, badge, onPress, last = false }: ListRowProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !last && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth },
        pressed && { opacity: 0.65 },
      ]}>
      <View style={[styles.iconTile, { backgroundColor: theme.accentSoft }]}>
        <Icon name={icon} size={18} color={theme.primary} />
      </View>

      <View style={styles.textBlock}>
        <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
        {caption ? (
          <Text style={[styles.caption, { color: theme.textSecondary }]}>{caption}</Text>
        ) : null}
      </View>

      {badge ? (
        <View style={[styles.badge, { backgroundColor: theme.primary }]}>
          <Text style={[styles.badgeText, { color: theme.onPrimary }]}>{badge}</Text>
        </View>
      ) : null}

      <Icon name="chevron-forward" size={14} color={theme.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  iconTile: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
    gap: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  caption: {
    fontSize: 12,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: Radius.pill,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
