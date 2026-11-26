import { StyleSheet, Switch, Text, View } from 'react-native';

import { Icon, type IconName } from './icon';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SwitchRowProps = {
  icon: IconName;
  label: string;
  caption?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  last?: boolean;
};

export function SwitchRow({
  icon,
  label,
  caption,
  value,
  onValueChange,
  last = false,
}: SwitchRowProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.row,
        !last && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth },
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

      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.backgroundSelected, true: theme.primary }}
        thumbColor={theme.backgroundElement}
      />
    </View>
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
});
