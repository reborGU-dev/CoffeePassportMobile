import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CafeteriaMap, type MapaHandle } from '@/components/cafeteria-map';
import { CafeteriaSheet } from '@/components/cafeteria-sheet';
import { ThemedView } from '@/components/themed-view';
import { Avatar } from '@/components/ui/avatar';
import { Icon, type IconName } from '@/components/ui/icon';
import { Radius, Spacing, Type } from '@/constants/theme';
import { demoUser } from '@/data/demo';
import { useCafeterias, type CafeteriaMapa } from '@/hooks/use-cafeterias';
import { useUbicacion } from '@/hooks/use-location';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { initialsFor } from '@/lib/format';
import { DISTANCIA_FUERA_DE_ZONA_KM, formatoDistancia } from '@/lib/geo';

const ALTO_MINIMO_HOJA = 320;
const ALTO_MAXIMO_HOJA = 560;

type FiltroMapa = 'todas' | 'abiertas' | 'especialidad' | 'nuevas';

export default function MapScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { user, status } = useAuth();

  const { estado, coords, mensaje, puedePreguntar, solicitar, abrirAjustes } = useUbicacion();
  const { items, loading, error, reload, sinCoordenadas, ciudad } = useCafeterias(coords);
  const [seleccionadaId, setSeleccionadaId] = useState<number | null>(null);
  const [filtro, setFiltro] = useState<FiltroMapa>('todas');
  const mapa = useRef<MapaHandle>(null);

  // Pedir la ubicación al entrar al tab (no al arrancar la app).
  useFocusEffect(
    useCallback(() => {
      void solicitar();
    }, [solicitar]),
  );

  // Filtrado reactivo de cafeterías
  const cafeteriasFiltradas = useMemo(() => {
    if (filtro === 'abiertas') {
      return items.filter((c) => c.activa);
    }
    if (filtro === 'especialidad') {
      return items.filter((c) =>
        Boolean(
          c.descripcion?.toLowerCase().includes('especialidad') ||
            c.descripcion?.toLowerCase().includes('origen') ||
            c.rating >= 4.5,
        ),
      );
    }
    if (filtro === 'nuevas') {
      return items.slice(0, Math.max(3, Math.ceil(items.length / 2)));
    }
    return items;
  }, [filtro, items]);

  const seleccionada = cafeteriasFiltradas.find((c) => c.id === seleccionadaId) ?? null;
  const masCercanaKm =
    cafeteriasFiltradas.find((c) => c.distanciaKm != null)?.distanciaKm ?? null;
  const lugarLejano = masCercanaKm != null && masCercanaKm > DISTANCIA_FUERA_DE_ZONA_KM;
  const altoHoja = Math.round(
    Math.min(ALTO_MAXIMO_HOJA, Math.max(ALTO_MINIMO_HOJA, height * 0.46)),
  );

  const nombre = user?.nombre ?? demoUser.name;
  const primerNombre = nombre.trim().split(/\s+/)[0];
  const iniciales = user ? initialsFor(nombre) : demoUser.initials;

  const avisoUbicacion = useMemo<{
    texto: string;
    icono: IconName;
    accion: () => void;
    etiquetaAccion: string;
  } | null>(() => {
    if (estado === 'denegado' || estado === 'sin_gps' || estado === 'error') {
      return {
        texto: mensaje ?? 'Activa tu ubicación para ordenar las cafeterías por cercanía.',
        icono: estado === 'sin_gps' ? 'navigate' : 'alert-circle',
        accion: puedePreguntar ? () => void solicitar() : abrirAjustes,
        etiquetaAccion: puedePreguntar ? 'Reintentar' : 'Ajustes',
      };
    }
    return null;
  }, [abrirAjustes, estado, mensaje, puedePreguntar, solicitar]);

  const seleccionar = useCallback((cafeteria: CafeteriaMapa | null) => {
    setSeleccionadaId(cafeteria?.id ?? null);
  }, []);

  const irAEscanear = () => {
    router.push('/escanear');
  };

  const centrarEnMi = () => {
    if (coords) {
      mapa.current?.centrarEnUsuario();
      return;
    }
    if (puedePreguntar) {
      void solicitar();
      return;
    }
    abrirAjustes();
  };

  const textoUbicacion = (() => {
    if (estado === 'cargando') {
      return 'Ubicando…';
    }
    if (estado === 'concedido') {
      if (masCercanaKm == null) {
        return 'Ubicación activa';
      }
      return ciudad
        ? `A ${formatoDistancia(masCercanaKm)} de ${ciudad}`
        : `A ${formatoDistancia(masCercanaKm)}`;
    }
    return estado === 'sin_gps' ? 'GPS apagado' : 'Sin ubicación';
  })();

  const toggleFiltro = (f: FiltroMapa) => {
    setFiltro((actual) => (actual === f ? 'todas' : f));
  };

  return (
    <ThemedView style={styles.pantalla}>
      <View style={styles.mapa}>
        <CafeteriaMap
          ref={mapa}
          cafeterias={cafeteriasFiltradas}
          seleccionada={seleccionada}
          onSeleccionar={seleccionar}
          ubicacion={coords}
          mostrarUbicacion={estado === 'concedido'}
          lugarLejano={lugarLejano}
        />

        {/* Superposición superior con barra de búsqueda y filtros rápidos */}
        <View
          pointerEvents="box-none"
          style={[styles.superposicion, { paddingTop: insets.top + Spacing.two }]}>
          {/* Tarjeta flotante de búsqueda y saludo editorial */}
          <View
            style={[
              styles.tarjetaSuperior,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Abrir perfil"
              hitSlop={6}
              onPress={() => router.push('/perfil')}
              style={styles.avatarBoton}>
              <Avatar initials={iniciales} size={42} ring />
            </Pressable>

            <View style={styles.saludoTexto}>
              <Text
                style={[styles.hola, { color: theme.textSecondary }, Type.caption]}
                numberOfLines={1}>
                Hola, {primerNombre}
                {status === 'guest' ? ' · invitado' : ` · Nivel ${user?.nivel ?? 3}`}
              </Text>
              <Text
                style={[styles.pregunta, { color: theme.text }, Type.heading]}
                numberOfLines={1}>
                ¿Qué café visitamos hoy?
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Filtrar cafeterías"
              onPress={() => toggleFiltro('abiertas')}
              style={[
                styles.iconoFiltro,
                {
                  backgroundColor:
                    filtro === 'abiertas' ? theme.accent : theme.backgroundSecondary,
                  borderColor: theme.border,
                },
              ]}>
              <Icon
                name="options-outline"
                size={16}
                color={filtro === 'abiertas' ? theme.onAccent : theme.text}
              />
            </Pressable>
          </View>

          {/* Fila de chips de filtrado rápido */}
          <View style={styles.filaChips}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={textoUbicacion}
              onPress={
                estado === 'concedido' ? () => mapa.current?.verCercanas() : centrarEnMi
              }
              style={[
                styles.chip,
                {
                  backgroundColor:
                    estado === 'concedido' ? theme.backgroundElement : theme.accentSoft,
                  borderColor: estado === 'concedido' ? theme.border : theme.accent,
                },
              ]}>
              {estado === 'cargando' ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <Icon
                  name={estado === 'concedido' ? 'navigate' : 'locate'}
                  size={13}
                  color={theme.primary}
                />
              )}
              <Text style={[styles.chipTexto, { color: theme.primary }]} numberOfLines={1}>
                {textoUbicacion}
              </Text>
            </Pressable>

            {/* Chip: Abiertas ahora */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Filtrar por cafeterías abiertas"
              onPress={() => toggleFiltro('abiertas')}
              style={[
                styles.chip,
                {
                  backgroundColor:
                    filtro === 'abiertas' ? theme.accent : theme.backgroundElement,
                  borderColor: filtro === 'abiertas' ? theme.accent : theme.border,
                },
              ]}>
              <Text
                style={[
                  styles.chipTexto,
                  { color: filtro === 'abiertas' ? theme.onAccent : theme.text },
                ]}>
                • Abiertas ahora
              </Text>
            </Pressable>

            {/* Chip: Especialidad */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Filtrar por barras de especialidad"
              onPress={() => toggleFiltro('especialidad')}
              style={[
                styles.chip,
                {
                  backgroundColor:
                    filtro === 'especialidad' ? theme.accent : theme.backgroundElement,
                  borderColor: filtro === 'especialidad' ? theme.accent : theme.border,
                },
              ]}>
              <Text
                style={[
                  styles.chipTexto,
                  { color: filtro === 'especialidad' ? theme.onAccent : theme.text },
                ]}>
                Especialidad
              </Text>
            </Pressable>

            {/* Chip: Sello nuevo */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Filtrar cafeterías con sellos por descubrir"
              onPress={() => toggleFiltro('nuevas')}
              style={[
                styles.chip,
                {
                  backgroundColor:
                    filtro === 'nuevas' ? theme.stampAccent : theme.backgroundElement,
                  borderColor: filtro === 'nuevas' ? theme.stampAccent : theme.border,
                },
              ]}>
              <Text
                style={[
                  styles.chipTexto,
                  { color: filtro === 'nuevas' ? '#FFF8F0' : theme.stampAccent },
                ]}>
                Sello nuevo
              </Text>
            </Pressable>

            {error && items.length === 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sin conexión con la API. Reintentar"
                onPress={reload}
                style={[
                  styles.chip,
                  { backgroundColor: theme.backgroundSelected, borderColor: theme.border },
                ]}>
                <Icon name="cloud-offline" size={13} color={theme.danger} />
                <Text style={[styles.chipTexto, { color: theme.danger }]}>Sin conexión</Text>
              </Pressable>
            ) : null}
          </View>

          {avisoUbicacion ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${avisoUbicacion.texto} ${avisoUbicacion.etiquetaAccion}`}
              onPress={avisoUbicacion.accion}
              style={[
                styles.aviso,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}>
              <Icon name={avisoUbicacion.icono} size={16} color={theme.accent} />
              <Text
                style={[styles.avisoTexto, { color: theme.textSecondary }]}
                numberOfLines={2}>
                {avisoUbicacion.texto}
              </Text>
              <Text style={[styles.avisoAccion, { color: theme.primary }]}>
                {avisoUbicacion.etiquetaAccion}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {/* Botones de acción flotantes (FABs) */}
        <View style={styles.controles} pointerEvents="box-none">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Centrar el mapa en mi ubicación"
            onPress={centrarEnMi}
            style={[
              styles.fab,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}>
            <Icon
              name={estado === 'cargando' ? 'ellipsis-horizontal' : 'locate'}
              size={19}
              color={theme.primary}
            />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Escanear QR y sellar visita"
            onPress={irAEscanear}
            style={[styles.fab, styles.fabPrimario, { backgroundColor: theme.primary }]}>
            <Icon name="scan" size={20} color={theme.onPrimary} />
          </Pressable>
        </View>
      </View>

      {/* Hoja inferior deslizable editorial */}
      <CafeteriaSheet
        cafeterias={cafeteriasFiltradas}
        seleccionada={seleccionada}
        onSeleccionar={seleccionar}
        onVolver={() => setSeleccionadaId(null)}
        height={altoHoja}
        loading={loading}
        error={items.length > 0 ? null : error}
        onReintentar={reload}
        ciudad={ciudad}
        sinCoordenadas={sinCoordenadas}
        hayUbicacion={estado === 'concedido'}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
  },
  mapa: {
    flex: 1,
    overflow: 'hidden',
  },
  superposicion: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  tarjetaSuperior: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
    gap: Spacing.three - 2,
    shadowColor: '#1C130D',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  avatarBoton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  saludoTexto: {
    flex: 1,
    gap: 1,
  },
  hola: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  pregunta: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  iconoFiltro: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filaChips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two - 1,
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    shadowColor: '#1C130D',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  chipTexto: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    shadowColor: '#1C130D',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  avisoTexto: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
  },
  avisoAccion: {
    fontSize: 11,
    fontWeight: '800',
  },
  controles: {
    position: 'absolute',
    right: Spacing.three,
    bottom: Spacing.three,
    gap: Spacing.two + 2,
  },
  fab: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1C130D',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  fabPrimario: {
    borderColor: 'transparent',
  },
});
