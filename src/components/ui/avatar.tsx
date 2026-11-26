import { StyleSheet, Text, View } from 'react-native';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AvatarProps = {
  initials: string;
  size?: number;
  ring?: boolean;
};

/** Monogram avatar: sage disc, farm-green ring and espresso initials. */
export function Avatar({ initials, size = 48, ring = false }: AvatarProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.accentSoft,
          borderColor: ring ? theme.accent : theme.accentBorder,
          borderWidth: ring ? 2 : 1,
        },
      ]}>
      <Text
        style={[
          styles.initials,
          { color: theme.accent, fontSize: size * 0.32, lineHeight: size * 0.4 },
        ]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
  },
  initials: {
    fontWeight: '800',
    letterSpacing: 0.6,
  },
});
