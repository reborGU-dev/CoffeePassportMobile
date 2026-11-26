import { StyleSheet, Text, View } from 'react-native';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Monograma cuadrado usado en listas de cafeterías y visitas. */
export function CafeteriaThumb({ initials, size = 52 }: { initials: string; size?: number }) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.thumb,
        {
          width: size,
          height: size,
          borderRadius: Radius.md,
          backgroundColor: theme.backgroundSelected,
        },
      ]}>
      <Text style={{ color: theme.primary, fontSize: size * 0.32, fontWeight: '800' }}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  thumb: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
