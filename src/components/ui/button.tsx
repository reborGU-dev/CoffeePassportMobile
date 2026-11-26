import type { StyleProp, ViewStyle } from 'react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { Icon, type IconName } from './icon';

import { Radius, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'primary' | 'secondary' | 'accent' | 'guest' | 'outline' | 'ghost' | 'danger';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: 'sm' | 'md';
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'right',
  fullWidth = true,
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const theme = useTheme();

  // Sober hierarchy: espresso = main action, farm green = secondary action,
  // sage = quiet/alternative action, ghost = inline link.
  const palette: Record<Variant, { background: string; text: string; border: string }> = {
    primary: {
      background: theme.primary,
      text: theme.onPrimary,
      border: theme.primary,
    },
    secondary: {
      background: theme.accent,
      text: theme.onAccent,
      border: theme.accent,
    },
    accent: {
      background: theme.accent,
      text: theme.onAccent,
      border: theme.accent,
    },
    guest: {
      background: theme.accentSoft,
      text: theme.accentStrong,
      border: theme.accentBorder,
    },
    outline: {
      background: theme.accentSoft,
      text: theme.accentStrong,
      border: theme.accentBorder,
    },
    ghost: {
      background: 'transparent',
      text: theme.primary,
      border: 'transparent',
    },
    danger: {
      background: 'transparent',
      text: theme.danger,
      border: theme.border,
    },
  };

  const colors = palette[variant];
  const iconColor = colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' ? styles.small : styles.medium,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : (
        <>
          {icon && iconPosition === 'left' && <Icon name={icon} size={18} color={iconColor} />}
          <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
          {icon && iconPosition === 'right' && <Icon name={icon} size={18} color={iconColor} />}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  medium: {
    paddingVertical: Spacing.three - 2,
    paddingHorizontal: Spacing.four,
    minHeight: 50,
  },
  small: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    minHeight: 40,
  },
  label: {
    ...Type.label,
  },
});
