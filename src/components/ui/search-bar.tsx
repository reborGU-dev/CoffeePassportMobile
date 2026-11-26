import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Icon } from './icon';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SearchBarProps = {
  placeholder: string;
  value?: string;
  onChangeText?: (texto: string) => void;
};

export function SearchBar({ placeholder, value = '', onChangeText }: SearchBarProps) {
  const theme = useTheme();
  const conTexto = value.length > 0;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.backgroundSelected, borderColor: 'transparent' },
      ]}>
      <Icon name="search" size={17} color={theme.textSecondary} />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        value={value}
        onChangeText={onChangeText}
        returnKeyType="search"
        accessibilityLabel={placeholder}
        style={[styles.input, { color: theme.text }]}
      />
      {conTexto ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Limpiar búsqueda"
          hitSlop={8}
          onPress={() => onChangeText?.('')}
          style={[styles.clear, { backgroundColor: theme.backgroundElement }]}>
          <Icon name="close" size={14} color={theme.textSecondary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.one,
    paddingVertical: Spacing.one,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: Spacing.two,
  },
  clear: {
    width: 30,
    height: 30,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
