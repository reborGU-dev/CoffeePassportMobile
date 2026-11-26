import { StyleSheet, Text, View } from 'react-native';

import { Icon } from './icon';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type RatingProps = {
  value: number;
  size?: number;
  showValue?: boolean;
  reviews?: number;
};

export function Rating({ value, size = 14, showValue = false, reviews }: RatingProps) {
  const theme = useTheme();
  const filled = Math.round(value);

  return (
    <View style={styles.container}>
      <View style={styles.stars}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Icon
            key={index}
            name={index < filled ? 'star' : 'star-outline'}
            size={size}
            color={index < filled ? theme.accent : theme.border}
          />
        ))}
      </View>
      {showValue ? (
        <Text style={[styles.value, { color: theme.text }]}>
          {value.toFixed(1)}
          {reviews !== undefined ? (
            <Text style={{ color: theme.textSecondary }}> ({reviews})</Text>
          ) : null}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  stars: {
    flexDirection: 'row',
    gap: 1,
  },
  value: {
    fontSize: 12,
    fontWeight: '700',
  },
});
