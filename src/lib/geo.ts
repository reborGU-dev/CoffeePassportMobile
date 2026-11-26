/**
 * Utilidades geográficas del dispositivo.
 *
 * La API solo entrega coordenadas; la proximidad, el encuadre y el zoom se
 * calculan aquí. Nada de esto se envía al servidor.
 */

export type LatLng = {
  latitude: number;
  longitude: number;
};

export type Region = LatLng & {
  latitudeDelta: number;
  longitudeDelta: number;
};

/** Radio medio terrestre en km (IUGG). */
export const RADIO_TIERRA_KM = 6371.0088;

/** Vista de ciudad: ~9 km de alto, suficiente para ver todo Tijuana. */
export const DELTA_CIUDAD = 0.09;

/** Vista de calle: ~900 m de alto, para un solo local. */
export const DELTA_CALLE = 0.008;

/** Más lejos que esto, encuadrar usuario y cafeterías deja los pines en un pixel. */
export const DISTANCIA_FUERA_DE_ZONA_KM = 60;

export const REGION_TIJUANA: Region = {
  latitude: 32.5225,
  longitude: -117.02,
  latitudeDelta: DELTA_CIUDAD,
  longitudeDelta: DELTA_CIUDAD,
};

const aRadianes = (grados: number) => (grados * Math.PI) / 180;

/** Distancia en kilómetros entre dos puntos WGS84 (fórmula de Haversine). */
export function distanciaKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = aRadianes(lat2 - lat1);
  const dLon = aRadianes(lon2 - lon1);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aRadianes(lat1)) * Math.cos(aRadianes(lat2)) * Math.sin(dLon / 2) ** 2;

  // asin(min(1, √h)) evita NaN por redondeo cuando los puntos coinciden.
  return 2 * RADIO_TIERRA_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** "850 m" / "1,4 km" / "Sin ubicación". */
export function formatoDistancia(km: number | null | undefined): string {
  if (km == null || !Number.isFinite(km)) {
    return 'Sin ubicación';
  }
  if (km < 0.1) {
    return 'Aquí mismo';
  }
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  if (km < 10) {
    return `${km.toFixed(1).replace('.', ',')} km`;
  }
  return `${Math.round(km)} km`;
}

export function tieneCoordenadas<T extends { latitud: number | null; longitud: number | null }>(
  punto: T,
): punto is T & { latitud: number; longitud: number } {
  return Number.isFinite(punto.latitud) && Number.isFinite(punto.longitud);
}

/**
 * Región que contiene todos los puntos. Se usa cuando hay un solo local (o
 * ninguno): `fitToCoordinates` con un único punto hace zoom extremo.
 */
export function regionPara(puntos: LatLng[], deltaMinimo = DELTA_CALLE): Region {
  if (!puntos.length) {
    return REGION_TIJUANA;
  }

  const lats = puntos.map((punto) => punto.latitude);
  const lons = puntos.map((punto) => punto.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);

  const latitudeDelta = Math.max((maxLat - minLat) * 1.6, deltaMinimo);
  const longitudeDelta = Math.max((maxLon - minLon) * 1.6, deltaMinimo);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLon + maxLon) / 2,
    latitudeDelta,
    longitudeDelta,
  };
}

export type TamanoMapa = { width: number; height: number };

/** Espacio tapado por los overlays del mapa, en puntos (dp). */
export type MargenMapa = { top: number; right: number; bottom: number; left: number };

/** Aire alrededor de los pines para que no queden pegados al borde. */
const AIRE_ENCUADRE = 1.15;

/**
 * Región que deja todos los puntos dentro del área visible del mapa. Se calcula
 * aquí y no con `fitToCoordinates` porque en Android ese método ignora
 * `edgePadding` (aplica `setPadding` y lo revierte antes del movimiento de cámara).
 */
export function regionParaEncuadre(
  puntos: LatLng[],
  tamano: TamanoMapa | null,
  margen: MargenMapa,
): Region {
  if (!puntos.length) {
    return REGION_TIJUANA;
  }
  if (!tamano || tamano.width <= 0 || tamano.height <= 0 || puntos.length === 1) {
    return regionPara(puntos);
  }

  const lats = puntos.map((punto) => punto.latitude);
  const lons = puntos.map((punto) => punto.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const centroLat = (minLat + maxLat) / 2;
  const centroLon = (minLon + maxLon) / 2;

  // 1° de longitud es más corto que 1° de latitud fuera del ecuador.
  const cosLat = Math.max(0.2, Math.cos(aRadianes(centroLat)));
  const anchoUtil = Math.max(tamano.width - margen.left - margen.right, 48);
  const altoUtil = Math.max(tamano.height - margen.top - margen.bottom, 48);

  const spanLat = Math.max(maxLat - minLat, DELTA_CALLE * 0.35);
  const spanLon = Math.max((maxLon - minLon) * cosLat, DELTA_CALLE * 0.35);

  // Cuántos grados de latitud tiene que abarcar la vista completa para que los
  // puntos quepan en el área visible.
  const latitudeDelta = Math.min(
    REGION_MAXIMA_DELTA,
    Math.max(
      DELTA_CALLE,
      Math.max(
        (spanLat * tamano.height) / altoUtil,
        (spanLon * tamano.height) / anchoUtil,
      ) * AIRE_ENCUADRE,
    ),
  );
  const longitudeDelta = (latitudeDelta * (tamano.width / tamano.height)) / cosLat;

  // El área visible no está centrada en la vista: movemos la cámara para que el
  // centro de los puntos caiga en el centro de esa área.
  const desfaseY = (margen.top - margen.bottom) / 2;
  const desfaseX = (margen.left - margen.right) / 2;

  return {
    latitude: centroLat + (desfaseY / tamano.height) * latitudeDelta,
    longitude: centroLon - (desfaseX / tamano.width) * longitudeDelta,
    latitudeDelta,
    longitudeDelta,
  };
}

/** Tope de zoom-out para que un catálogo disperso no deje los pines en un pixel. */
const REGION_MAXIMA_DELTA = 0.6;

/** Ciudad que más se repite en el catálogo (para el chip del mapa). */
export function ciudadPrincipal(ciudades: (string | null | undefined)[]): string | null {
  const conteo = new Map<string, number>();

  for (const ciudad of ciudades) {
    const limpia = ciudad?.trim();
    if (!limpia) {
      continue;
    }
    conteo.set(limpia, (conteo.get(limpia) ?? 0) + 1);
  }

  let mejor: string | null = null;
  let maximo = 0;
  for (const [ciudad, veces] of conteo) {
    if (veces > maximo) {
      mejor = ciudad;
      maximo = veces;
    }
  }
  return mejor;
}

/** URL nativa para abrir la ruta al local en la app de mapas del sistema. */
export function urlComoLlegar(
  nombre: string,
  latitud: number,
  longitud: number,
  plataforma: string,
): string {
  const etiqueta = encodeURIComponent(nombre);
  const punto = `${latitud},${longitud}`;

  if (plataforma === 'android') {
    return `geo:${punto}?q=${punto}(${etiqueta})`;
  }
  if (plataforma === 'ios') {
    return `http://maps.apple.com/?ll=${punto}&q=${etiqueta}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${punto}`;
}
