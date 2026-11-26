import { StyleSheet, Text, View } from 'react-native';

import { CafeteriaThumb } from './cafeteria-card';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Rating } from './ui/rating';

import { Spacing } from '@/constants/theme';
import type { Visit } from '@/data/demo';
import { useTheme } from '@/hooks/use-theme';

export function VisitCard({ visit }: { visit: Visit }) {
  const theme = useTheme();

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <CafeteriaThumb initials={visit.initials} size={44} />

        <View style={styles.info}>
          <Text style={[styles.name, { color: theme.text }]}>{visit.cafeteria}</Text>
          <Text style={[styles.meta, { color: theme.textSecondary }]}>
            {visit.area} · {visit.date}
          </Text>
          <Rating value={visit.rating} size={12} />
        </View>

        <Badge tone="success" icon="checkmark">
          Sello
        </Badge>
      </View>

      <Text style={[styles.note, { color: theme.textSecondary }]}>“{visit.note}”</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
  },
  meta: {
    fontSize: 12,
  },
  note: {
    fontSize: 13,
    lineHeight: 20,
  },
});
