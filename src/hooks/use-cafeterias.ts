import { useCallback, useEffect, useMemo, useState } from 'react';

import { getCafeterias, type Cafeteria as CafeteriaApi } from '@/lib/api';
import { ciudadPrincipal, distanciaKm, tieneCoordenadas } from '@/lib/geo';
import { initialsFor } from '@/lib/format';

/** Cafetería lista para pintar: coordenadas de la API + distancia calculada aquí. */
export type CafeteriaMapa = {
  id: number;
  nombre: string;
  ciudad: string;
  direccion: string;
  descripcion: string | null;
  fotoUrl: string | null;
  latitud: number | null;
  longitud: number | null;
  rating: number;
  reviews: number;
  activa: boolean;
  initials: string;
  /** `null` si falta tu ubicación o la cafetería no está geolocalizada. */
  distanciaKm: number | null;
};

export type CafeteriasState = {
  items: CafeteriaMapa[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  /** Cuántas cafeterías del catálogo no tienen coordenadas. */
  sinCoordenadas: number;
  ciudad: string | null;
};

type Catalogo = {
  key: number;
  data: CafeteriaApi[];
  error: string | null;
};

function ordenar(a: CafeteriaMapa, b: CafeteriaMapa): number {
  if (a.distanciaKm != null && b.distanciaKm != null) {
    return a.distanciaKm - b.distanciaKm;
  }
  if (a.distanciaKm != null) {
    return -1;
  }
  if (b.distanciaKm != null) {
    return 1;
  }
  // Sin distancia utilizable: se conserva un orden estable por id.
  return a.id - b.id;
}

/**
 * Catálogo público de cafeterías. La API no calcula cercanía: pedimos todo el
 * catálogo y ordenamos en el dispositivo (Haversine). Nunca inventamos pines:
 * si la API falla se expone el error y la pantalla ofrece reintentar.
 */
export function useCafeterias(
  ubicacion: { latitude: number; longitude: number } | null,
): CafeteriasState {
  const [refreshKey, setRefreshKey] = useState(0);
  const [catalogo, setCatalogo] = useState<Catalogo | null>(null);

  const reload = useCallback(() => {
    setRefreshKey((actual) => actual + 1);
  }, []);

  useEffect(() => {
    let activo = true;

    async function cargar() {
      try {
        const data = await getCafeterias();
        if (!activo) {
          return;
        }
        setCatalogo({ key: refreshKey, data, error: null });
      } catch (caught) {
        if (!activo) {
          return;
        }
        setCatalogo((previo) => ({
          key: refreshKey,
          data: previo?.data ?? [],
          error:
            caught instanceof Error
              ? caught.message
              : 'No se pudo cargar el catálogo de cafeterías.',
        }));
      }
    }

    void cargar();

    return () => {
      activo = false;
    };
  }, [refreshKey]);

  const lat = ubicacion?.latitude ?? null;
  const lon = ubicacion?.longitude ?? null;

  const items = useMemo<CafeteriaMapa[]>(() => {
    const data = catalogo?.data ?? [];

    return data
      .map((cafeteria) => ({
        id: cafeteria.id,
        nombre: cafeteria.nombre,
        ciudad: cafeteria.ciudad?.trim() || 'Sin ciudad',
        direccion: cafeteria.direccion?.trim() || '',
        descripcion: cafeteria.descripcion?.trim() || null,
        fotoUrl: cafeteria.fotoUrl?.trim() || null,
        latitud: cafeteria.latitud,
        longitud: cafeteria.longitud,
        rating: cafeteria.promedioCalificacion ?? 0,
        reviews: cafeteria.totalResenas ?? 0,
        activa: cafeteria.activa,
        initials: initialsFor(cafeteria.nombre),
        distanciaKm:
          lat == null || lon == null || !tieneCoordenadas(cafeteria)
            ? null
            : distanciaKm(lat, lon, cafeteria.latitud, cafeteria.longitud),
      }))
      .sort(ordenar);
  }, [catalogo, lat, lon]);

  return {
    items,
    loading: !catalogo || catalogo.key !== refreshKey,
    error: catalogo?.error ?? null,
    reload,
    sinCoordenadas: items.filter((item) => !tieneCoordenadas(item)).length,
    ciudad: ciudadPrincipal(items.map((item) => item.ciudad)),
  };
}
