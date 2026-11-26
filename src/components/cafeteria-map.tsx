import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, type MapStyleElement, type Region } from 'react-native-maps';

import { useTheme } from '@/hooks/use-theme';
import type { CafeteriaMapa } from '@/hooks/use-cafeterias';
import type { Ubicacion } from '@/hooks/use-location';
import {
  DELTA_CALLE,
  REGION_TIJUANA,
  regionPara,
  regionParaEncuadre,
  tieneCoordenadas,
  type LatLng,
  type TamanoMapa,
} from '@/lib/geo';

export type MapaHandle = {
  centrarEnUsuario: () => void;
  /** Encuadra la cafetería más cercana y el usuario (vista de barrio). */
  verCercanas: () => void;
};

type CafeteriaMapProps = {
  cafeterias: CafeteriaMapa[];
  seleccionada: CafeteriaMapa | null;
  onSeleccionar: (cafeteria: CafeteriaMapa | null) => void;
  ubicacion: Ubicacion | null;
  mostrarUbicacion: boolean;
  /** Si estás lejos del cluster, encuadrar solo las cafeterías. */
  lugarLejano: boolean;
};

/** Estilo cálido para que Google Maps no rompa la paleta de la app. */
const MAPA_ESTILO: MapStyleElement[] = [
  { elementType: 'geometry', stylers: [{ color: '#F1E9DC' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#7C6A5B' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#FBF6EF' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#DDE5D0' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#FCF8F1' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9C8A79' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#F3E1C6' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#E8D3B4' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#CADAD7' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#6E8C88' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#E4D8C7' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
];

const PADDING_MAPA = { top: 176, right: 72, bottom: 48, left: 56 } as const;

/** Cuántas cafeterías cercanas entran en el encuadre inicial. */
const CAFETERIAS_ENCUADRE = 12;

/** Pin dibujado con Views (sin fuentes ni imágenes): se captura bien en el mapa. */
function Pin({ activo }: { activo: boolean }) {
  const theme = useTheme();
  const fondo = activo ? theme.primary : theme.backgroundElement;
  const tinta = activo ? theme.onPrimary : theme.primary;

  return (
    <View style={styles.pin}>
      <View
        style={[
          styles.pinBurbuja,
          {
            backgroundColor: fondo,
            borderColor: activo ? theme.primary : theme.border,
            transform: [{ scale: activo ? 1.12 : 1 }],
          },
        ]}>
        <View style={styles.taza}>
          <View style={[styles.tazaCuerpo, { borderColor: tinta }]} />
          <View style={[styles.tazaAsa, { borderColor: tinta }]} />
        </View>
      </View>
      <View style={[styles.pinPunta, { borderTopColor: fondo }]} />
    </View>
  );
}

export const CafeteriaMap = forwardRef<MapaHandle, CafeteriaMapProps>(function CafeteriaMap(
  { cafeterias, seleccionada, onSeleccionar, ubicacion, mostrarUbicacion, lugarLejano },
  ref,
) {
  const mapa = useRef<MapView | null>(null);
  const [listo, setListo] = useState(false);
  const [tamano, setTamano] = useState<TamanoMapa | null>(null);
  const ultimoEncuadre = useRef<string | null>(null);

  const puntos = useMemo<(LatLng & { id: number })[]>(
    () =>
      cafeterias
        .filter(tieneCoordenadas)
        .map((cafeteria) => ({
          id: cafeteria.id,
          latitude: cafeteria.latitud,
          longitude: cafeteria.longitud,
        })),
    [cafeterias],
  );

  const encuadrar = useCallback(
    (destinos: LatLng[], animado: boolean) => {
      const actual = mapa.current;
      if (!actual) {
        return;
      }

      if (!destinos.length) {
        actual.animateToRegion(REGION_TIJUANA, animado ? 400 : 0);
        return;
      }
      if (destinos.length === 1) {
        actual.animateToRegion(regionPara(destinos), animado ? 650 : 0);
        return;
      }
      actual.animateToRegion(
        regionParaEncuadre(destinos, tamano, PADDING_MAPA),
        animado ? 450 : 0,
      );
    },
    [tamano],
  );

  const encuadrarTodo = useCallback(
    (animado = true) => {
      const destinos: LatLng[] = puntos.map(({ latitude, longitude }) => ({ latitude, longitude }));
      if (ubicacion && !lugarLejano) {
        destinos.push({ latitude: ubicacion.latitude, longitude: ubicacion.longitude });
      }
      encuadrar(destinos, animado);
    },
    [encuadrar, lugarLejano, puntos, ubicacion],
  );

  /**
   * Encuadre inicial: cerca de ti solo entran las cafeterías más próximas; si
   * entraran las 69 de Tijuana el mapa quedaría a escala metropolitana.
   */
  const encuadrarInicial = useCallback(
    (animado = true) => {
      if (!puntos.length || !ubicacion || lugarLejano) {
        encuadrarTodo(animado);
        return;
      }

      const destinos: LatLng[] = puntos
        .slice(0, CAFETERIAS_ENCUADRE)
        .map(({ latitude, longitude }) => ({ latitude, longitude }));
      destinos.push({ latitude: ubicacion.latitude, longitude: ubicacion.longitude });
      encuadrar(destinos, animado);
    },
    [encuadrar, encuadrarTodo, lugarLejano, puntos, ubicacion],
  );

  useImperativeHandle(
    ref,
    () => ({
      centrarEnUsuario: () => {
        if (!ubicacion) {
          encuadrarTodo(true);
          return;
        }
        const region: Region = {
          latitude: ubicacion.latitude,
          longitude: ubicacion.longitude,
          latitudeDelta: DELTA_CALLE * 1.6,
          longitudeDelta: DELTA_CALLE * 1.6,
        };
        mapa.current?.animateToRegion(region, 600);
      },
      verCercanas: () => encuadrarInicial(true),
    }),
    [encuadrarInicial, encuadrarTodo, ubicacion],
  );

  // El primer encuadre depende de que el mapa nativo ya tenga tamaño.
  useEffect(() => {
    const timer = setTimeout(() => setListo(true), 700);
    return () => clearTimeout(timer);
  }, []);

  const firma = `${puntos.map((punto) => punto.id).join(',')}|${
    ubicacion ? `${ubicacion.latitude.toFixed(5)},${ubicacion.longitude.toFixed(5)}` : 'sin'
  }|${lugarLejano ? 'lejos' : 'cerca'}|${tamano ? `${Math.round(tamano.width)}x${Math.round(tamano.height)}` : 'sin-tamano'}`;

  useEffect(() => {
    if (!listo || !tamano || ultimoEncuadre.current === firma) {
      return;
    }
    ultimoEncuadre.current = firma;
    encuadrarInicial(true);
  }, [encuadrarInicial, firma, listo, tamano]);

  const seleccionadaLat = seleccionada && tieneCoordenadas(seleccionada) ? seleccionada.latitud : null;
  const seleccionadaLon = seleccionada && tieneCoordenadas(seleccionada) ? seleccionada.longitud : null;

  useEffect(() => {
    if (!listo || seleccionadaLat == null || seleccionadaLon == null) {
      return;
    }
    const delta = DELTA_CALLE * 1.7;
    mapa.current?.animateToRegion(
      {
        // Ligero desplazamiento al sur: el pin queda bajo el saludo y los chips.
        latitude: seleccionadaLat - delta * 0.06,
        longitude: seleccionadaLon,
        latitudeDelta: delta,
        longitudeDelta: delta,
      },
      550,
    );
  }, [listo, seleccionadaLat, seleccionadaLon]);

  return (
    <MapView
      ref={mapa}
      style={StyleSheet.absoluteFill}
      initialRegion={REGION_TIJUANA}
      onLayout={(evento) => {
        const { width, height } = evento.nativeEvent.layout;
        setTamano((previo) =>
          previo && Math.abs(previo.width - width) < 1 && Math.abs(previo.height - height) < 1
            ? previo
            : { width, height },
        );
      }}
      customMapStyle={MAPA_ESTILO}
      showsUserLocation={mostrarUbicacion}
      showsMyLocationButton={false}
      showsCompass={false}
      showsBuildings={false}
      showsTraffic={false}
      showsIndoors={false}
      toolbarEnabled={false}
      rotateEnabled={false}
      pitchEnabled={false}
      moveOnMarkerPress={false}
      loadingEnabled
      loadingBackgroundColor="#F1E9DC"
      loadingIndicatorColor="#6F4428"
      onMapReady={() => setListo(true)}
      onPress={(evento) => {
        // Android dispara el press del mapa también al tocar un pin.
        if (evento.nativeEvent.action === 'marker-press') {
          return;
        }
        onSeleccionar(null);
      }}>
      {cafeterias.map((cafeteria) => {
        if (!tieneCoordenadas(cafeteria)) {
          return null;
        }
        const activa = cafeteria.id === seleccionada?.id;
        return (
          <Marker
            key={cafeteria.id}
            coordinate={{ latitude: cafeteria.latitud, longitude: cafeteria.longitud }}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={activa}
            zIndex={activa ? 10 : 1}
            onPress={() => onSeleccionar(cafeteria)}>
            <Pin activo={activa} />
          </Marker>
        );
      })}
    </MapView>
  );
});

const styles = StyleSheet.create({
  pin: {
    alignItems: 'center',
    width: 44,
    paddingBottom: 1,
  },
  pinBurbuja: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taza: {
    width: 20,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tazaCuerpo: {
    width: 13,
    height: 11,
    borderWidth: 2,
    borderRadius: 3,
  },
  tazaAsa: {
    position: 'absolute',
    right: 0,
    top: 4,
    width: 7,
    height: 7,
    borderWidth: 2,
    borderRadius: 4,
  },
  pinPunta: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
});
