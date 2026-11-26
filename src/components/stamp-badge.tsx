import { useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Image, StyleSheet, Text, View } from 'react-native';

import { Icon } from './ui/icon';

import { Radius, Spacing, Type } from '@/constants/theme';
import type { Stamp } from '@/data/demo';
import { useTheme } from '@/hooks/use-theme';

type StampBadgeProps = {
  stamp: Stamp;
  style?: StyleProp<ViewStyle>;
};

/** Vintage stamp inks: toasted coffee, farm green and terracotta amber. */
const INKS = ['#7C583F', '#2F4538', '#B96B36'] as const;

function inkFor(stamp: Stamp) {
  let hash = 0;
  for (let index = 0; index < stamp.id.length; index += 1) {
    hash = (hash + stamp.id.charCodeAt(index) * (index + 3)) % 997;
  }
  return INKS[hash % INKS.length];
}

/**
 * Rubber-stamp collectible: two concentric ink rings, the shop monogram in
 * the center, its city above and the brewing method below. Ink tone varies
 * per stamp so a grid of them reads like a used passport page.
 */
export function StampBadge({ stamp, style }: StampBadgeProps) {
  const theme = useTheme();
  const locked = Boolean(stamp.locked);
  // El `imagenUrl` del sello es la copia que guardó la API al sellar: si la
  // cafetería cambia su imagen, la ruta vieja puede dejar de existir. En ese
  // caso se cae al sello dibujado con las iniciales.
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const imageUri = stamp.imageUrl ?? null;
  const showImage = Boolean(imageUri) && failedImage !== imageUri;
  const ink = locked ? theme.textMuted : inkFor(stamp);
  const method = stamp.method ?? stamp.date;

  return (
    <View style={[styles.item, style]}>
      <View
        style={[
          styles.outerRing,
          {
            borderColor: locked ? theme.border : ink,
            backgroundColor: locked ? 'transparent' : theme.stampAccentSoft,
            borderStyle: locked ? 'dashed' : 'solid',
            opacity: locked ? 1 : 0.94,
          },
        ]}>
        <View
          style={[
            styles.innerRing,
            { borderColor: locked ? theme.border : ink },
          ]}>
          {locked ? (
            <Icon name="lock-closed" size={18} color={theme.textMuted} />
          ) : showImage && imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              resizeMode="contain"
              onError={() => setFailedImage(imageUri)}
            />
          ) : (
            <View style={styles.inkBlock}>
              <Text numberOfLines={1} style={[styles.arc, { color: ink }]}>
                {(stamp.city || 'CP').toUpperCase()}
              </Text>
              <Text style={[styles.initials, { color: ink }]}>{stamp.initials}</Text>
              <Text numberOfLines={1} style={[styles.arc, { color: ink }]}>
                {(method || 'MÉXICO').toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      </View>
      <Text
        numberOfLines={1}
        style={[styles.name, { color: locked ? theme.textMuted : theme.text }]}>
        {locked ? 'Por sellar' : stamp.name}
      </Text>
      <Text numberOfLines={1} style={[styles.date, { color: theme.textSecondary }]}>
        {locked ? 'Próxima visita' : stamp.date}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    alignItems: 'center',
    gap: 1,
  },
  outerRing: {
    width: 78,
    height: 78,
    borderRadius: Radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
    transform: [{ rotate: '-4deg' }],
  },
  innerRing: {
    width: 64,
    height: 64,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  inkBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
  arc: {
    fontSize: 6,
    lineHeight: 8,
    fontWeight: '700',
    letterSpacing: 0.8,
    maxWidth: 54,
    textAlign: 'center',
  },
  initials: {
    fontSize: 16,
    lineHeight: 19,
    fontWeight: '800',
    letterSpacing: 1,
  },
  image: {
    width: 54,
    height: 54,
    borderRadius: Radius.pill,
  },
  name: {
    ...Type.caption,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  date: {
    ...Type.caption,
    fontSize: 9.5,
    textAlign: 'center',
  },
});
