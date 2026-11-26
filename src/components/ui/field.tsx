import { useState } from 'react';
import type { TextInputProps } from 'react-native';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Icon, type IconName } from './icon';

import { Radius, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type FieldProps = TextInputProps & {
  label: string;
  icon?: IconName;
  error?: string;
};

/**
 * Editorial field: tracked uppercase label, cream input surface and an
 * espresso focus border.
 */
export function Field({ label, icon, error, style, onFocus, onBlur, ...rest }: FieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error ? theme.danger : focused ? theme.borderFocus : theme.border;
  const iconColor = error ? theme.danger : focused ? theme.text : theme.textMuted;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: theme.inputBackground,
            borderColor,
          },
        ]}>
        {icon ? <Icon name={icon} size={18} color={iconColor} /> : null}
        <TextInput
          placeholderTextColor={theme.textMuted}
          style={[styles.input, { color: theme.text }, style]}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...rest}
        />
      </View>
      {error ? (
        <Text accessibilityLiveRegion="polite" style={[styles.error, { color: theme.danger }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one + 2,
  },
  label: {
    ...Type.overline,
    letterSpacing: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.three - 2,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
  },
  error: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
  },
});
