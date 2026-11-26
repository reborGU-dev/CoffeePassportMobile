import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Icon } from './ui/icon';
import { Rating } from './ui/rating';
import { SearchBar } from './ui/search-bar';

import { Radius, Spacing, Type } from '@/constants/theme';
import type { CafeteriaMapa } from '@/hooks/use-cafeterias';
import { useTheme } from '@/hooks/use-theme';
import { imageUrl } from '@/lib/api';
import { formatoDistancia, tieneCoordenadas, urlComoLlegar } from '@/lib/geo';

type CafeteriaSheetProps = {
  cafeterias: CafeteriaMapa[];
  seleccionada: CafeteriaMapa | null;
  onSeleccionar: (cafeteria: CafeteriaMapa) => void;
  onVolver: () => void;
  height: number;
  loading: boolean;
  error: string | null;
  onReintentar: () => void;
  ciudad: string | null;
  /** Cafeterías del catálogo que la API devuelve sin latitud/longitud. */
  sinCoordenadas: number;
  hayUbicacion: boolean;
};

const PADDING = Spacing.four;

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

async function abrirRuta(cafeteria: CafeteriaMapa) {
  if (!tieneCoordenadas(cafeteria)) {
    return;
  }
  const url = urlComoLlegar(
    cafeteria.nombre,
    cafeteria.latitud,
    cafeteria.longitud,
    Platform.OS,
  );
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert(
      'No se pudo abrir el mapa',
      'Instala una aplicación de mapas o busca la dirección manualmente.',
    );
  }
}

function Miniatura({ cafeteria, size = 46 }: { cafeteria: CafeteriaMapa; size?: number }) {
  const theme = useTheme();
  const foto = imageUrl(cafeteria.fotoUrl);
  const radio = Radius.md - 4;

  if (foto) {
    return (
      <Image
        source={{ uri: foto }}
        style={{ width: size, height: size, borderRadius: radio, backgroundColor: theme.backgroundSelected }}
        contentFit="cover"
        transition={150}
      />
    );
  }

  return (
    <LinearGradient
      colors={[theme.accentSoft, theme.backgroundSelected]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: size,
        height: size,
        borderRadius: radio,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text style={{ color: theme.primary, fontSize: size * 0.3, fontWeight: '800' }}>
        {cafeteria.initials}
      </Text>
    </LinearGradient>
  );
}

function Fila({
  cafeteria,
  onPress,
  primera,
}: {
  cafeteria: CafeteriaMapa;
  onPress: () => void;
  primera: boolean;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${cafeteria.nombre}, ${formatoDistancia(cafeteria.distanciaKm)}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.fila,
        {
          borderTopColor: theme.border,
          borderTopWidth: primera ? 0 : StyleSheet.hairlineWidth,
          opacity: pressed ? 0.7 : 1,
        },
      ]}>
      <Miniatura cafeteria={cafeteria} />
      <View style={styles.filaTexto}>
        <Text style={[styles.filaNombre, { color: theme.text }]} numberOfLines={1}>
          {cafeteria.nombre}
        </Text>
        <Text style={[styles.filaMeta, { color: theme.textSecondary }]} numberOfLines={1}>
          {cafeteria.direccion || cafeteria.ciudad}
        </Text>
      </View>
      <View style={styles.filaDerecha}>
        <Text style={[styles.filaDistancia, { color: theme.primary }]}>
          {formatoDistancia(cafeteria.distanciaKm)}
        </Text>
        <Icon name="chevron-forward" size={14} color={theme.textSecondary} />
      </View>
    </Pressable>
  );
}

function Detalle({
  cafeteria,
  onVolver,
}: {
  cafeteria: CafeteriaMapa;
  onVolver: () => void;
}) {
  const theme = useTheme();
  const router = useRouter();
  const foto = imageUrl(cafeteria.fotoUrl);
  const conUbicacion = tieneCoordenadas(cafeteria);
  const direccion = [cafeteria.direccion, cafeteria.ciudad].filter(Boolean).join(' · ');

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.detalleContenido}>
      <View style={styles.detalleBarra}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver a la lista de cafeterías"
          hitSlop={8}
          onPress={onVolver}
          style={styles.volver}>
          <Icon name="chevron-back" size={16} color={theme.primary} />
          <Text style={[styles.volverTexto, { color: theme.primary }]}>Todas las cafeterías</Text>
        </Pressable>
        <Badge tone={cafeteria.activa ? 'accent' : 'neutral'}>
          {cafeteria.activa ? 'Sello activo' : 'Catálogo'}
        </Badge>
      </View>

      {foto ? (
        <Image
          source={{ uri: foto }}
          style={styles.hero}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <LinearGradient
          colors={[theme.accentSoft, theme.backgroundSecondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, styles.heroVacio]}>
          <Text style={[styles.heroIniciales, { color: theme.primary }, Type.heading]}>
            {cafeteria.initials}
          </Text>
          <Text style={[styles.heroCiudad, { color: theme.textSecondary }, Type.overline]}>
            {cafeteria.ciudad}
          </Text>
        </LinearGradient>
      )}

      <View style={styles.detalleTitulo}>
        <Text style={[styles.nombre, { color: theme.text }, Type.title]} numberOfLines={2}>
          {cafeteria.nombre}
        </Text>
        <Rating
          value={cafeteria.rating}
          size={13}
          showValue
          reviews={cafeteria.reviews}
        />
      </View>

      <View style={styles.metaFila}>
        <Icon name="location" size={13} color={theme.textSecondary} />
        <Text style={[styles.meta, { color: theme.textSecondary }]} numberOfLines={2}>
          {direccion || 'Sin dirección registrada'}
        </Text>
      </View>

      <View style={styles.chips}>
        <Badge tone="accent" icon="walk">
          {formatoDistancia(cafeteria.distanciaKm)}
        </Badge>
        <Badge icon="cafe">{cafeteria.ciudad || 'Sin ciudad'}</Badge>
        <Badge tone="neutral">Tueste de especialidad</Badge>
      </View>

      {/* Caja de aviso de sello disponible */}
      <View
        style={[
          styles.recompensaBox,
          { backgroundColor: theme.stampAccentSoft, borderColor: theme.border },
        ]}>
        <Icon name="gift-outline" size={15} color={theme.stampAccent} />
        <Text style={[styles.recompensaTexto, { color: theme.stampAccent }]}>
          Sello oficial y puntos de catador disponibles al escanear en caja.
        </Text>
      </View>

      {cafeteria.descripcion ? (
        <Text style={[styles.descripcion, { color: theme.textSecondary }]}>
          {cafeteria.descripcion}
        </Text>
      ) : null}

      {/* Botones de acción duales: Cómo llegar + Sellar visita */}
      <View style={styles.botonesAccion}>
        <View style={styles.botonMitad}>
          <Button
            label={conUbicacion ? 'Cómo llegar' : 'Sin GPS'}
            icon="navigate"
            iconPosition="left"
            disabled={!conUbicacion}
            onPress={() => {
              void abrirRuta(cafeteria);
            }}
          />
        </View>
        <View style={styles.botonMitad}>
          <Button
            label="Sellar visita"
            icon="scan"
            iconPosition="left"
            variant="accent"
            onPress={() => {
              router.push('/escanear');
            }}
          />
        </View>
      </View>
    </ScrollView>
  );
}

export function CafeteriaSheet({
  cafeterias,
  seleccionada,
  onSeleccionar,
  onVolver,
  height,
  loading,
  error,
  onReintentar,
  ciudad,
  sinCoordenadas,
  hayUbicacion,
}: CafeteriaSheetProps) {
  const theme = useTheme();
  const [busqueda, setBusqueda] = useState('');

  const filtradas = useMemo(() => {
    const termino = normalizar(busqueda.trim());
    if (!termino) {
      return cafeterias;
    }
    return cafeterias.filter((cafeteria) =>
      normalizar(
        `${cafeteria.nombre} ${cafeteria.ciudad} ${cafeteria.direccion}`,
      ).includes(termino),
    );
  }, [busqueda, cafeterias]);

  return (
    <View
      style={[
        styles.hoja,
        {
          height,
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
        },
      ]}>
      <View style={[styles.asa, { backgroundColor: theme.border }]} />

      {seleccionada ? (
        <Detalle cafeteria={seleccionada} onVolver={onVolver} />
      ) : (
        <View style={styles.lista}>
          <View style={styles.listaCabecera}>
            <View style={styles.listaTitulos}>
              <Text style={[styles.listaTitulo, { color: theme.text }]}>
                {hayUbicacion ? 'Cerca de ti' : ciudad ? `Cafeterías en ${ciudad}` : 'Cafeterías'}
              </Text>
              <Text style={[styles.listaSub, { color: theme.textSecondary }]}>
                {cafeterias.length > 0
                  ? `${cafeterias.length} ${
                      cafeterias.length === 1 ? 'cafetería' : 'cafeterías'
                    }${sinCoordenadas > 0 ? ` · ${sinCoordenadas} sin ubicación` : ''}`
                  : 'Catálogo Coffee Passport'}
              </Text>
            </View>
            {loading ? <ActivityIndicator size="small" color={theme.primary} /> : null}
          </View>

          {cafeterias.length > 0 ? (
            <SearchBar
              placeholder="Busca por nombre o colonia"
              value={busqueda}
              onChangeText={setBusqueda}
            />
          ) : null}

          {error ? (
            <Pressable
              accessibilityRole="button"
              onPress={onReintentar}
              style={[styles.error, { backgroundColor: theme.backgroundSelected }]}>
              <Icon name="cloud-offline" size={16} color={theme.danger} />
              <Text style={[styles.errorTexto, { color: theme.danger }]} numberOfLines={2}>
                {error}
              </Text>
              <Text style={[styles.reintentar, { color: theme.primary }]}>Reintentar</Text>
            </Pressable>
          ) : null}

          {loading && cafeterias.length === 0 ? (
            <View style={styles.estadoVacio}>
              <ActivityIndicator color={theme.primary} />
              <Text style={[styles.estadoTexto, { color: theme.textSecondary }]}>
                Cargando cafeterías…
              </Text>
            </View>
          ) : filtradas.length === 0 ? (
            <View style={styles.estadoVacio}>
              <Icon name="search" size={22} color={theme.textSecondary} />
              <Text style={[styles.estadoTexto, { color: theme.textSecondary }]}>
                {cafeterias.length === 0
                  ? 'Todavía no hay cafeterías con ubicación.'
                  : `Sin resultados para “${busqueda.trim()}”.`}
              </Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.listaScroll}>
              {filtradas.map((cafeteria, indice) => (
                <Fila
                  key={cafeteria.id}
                  cafeteria={cafeteria}
                  primera={indice === 0}
                  onPress={() => onSeleccionar(cafeteria)}
                />
              ))}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hoja: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.two,
    shadowColor: '#2B1A11',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -6 },
    elevation: 16,
  },
  asa: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    marginBottom: Spacing.two,
  },
  lista: {
    flex: 1,
    paddingHorizontal: PADDING,
    paddingBottom: Spacing.two,
    gap: Spacing.two + 2,
  },
  listaCabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  listaTitulos: {
    flex: 1,
  },
  listaTitulo: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  listaSub: {
    fontSize: 12,
    fontWeight: '600',
  },
  listaScroll: {
    paddingBottom: Spacing.two,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
    paddingVertical: Spacing.two + 2,
  },
  filaTexto: {
    flex: 1,
    gap: 2,
  },
  filaNombre: {
    fontSize: 15,
    fontWeight: '700',
  },
  filaMeta: {
    fontSize: 12,
  },
  filaDerecha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  filaDistancia: {
    fontSize: 12,
    fontWeight: '800',
  },
  estadoVacio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  estadoTexto: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  error: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.md,
    padding: Spacing.two + 2,
  },
  errorTexto: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  reintentar: {
    fontSize: 12,
    fontWeight: '800',
  },
  detalleContenido: {
    paddingHorizontal: PADDING,
    paddingBottom: Spacing.four,
    gap: Spacing.two + 2,
  },
  detalleBarra: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  volver: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: Spacing.one,
  },
  volverTexto: {
    fontSize: 13,
    fontWeight: '700',
  },
  hero: {
    height: 128,
    borderRadius: Radius.md,
    backgroundColor: '#F1E5D6',
  },
  heroVacio: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  heroIniciales: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroCiudad: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  detalleTitulo: {
    gap: Spacing.one + 2,
  },
  nombre: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  metaFila: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.one + 2,
  },
  meta: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one + 2,
  },
  descripcion: {
    fontSize: 13,
    lineHeight: 19,
  },
  recompensaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  recompensaTexto: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
  },
  botonesAccion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  botonMitad: {
    flex: 1,
  },
  botonRuta: {
    marginTop: Spacing.one,
  },
});
