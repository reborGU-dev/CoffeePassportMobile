import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  getCafeterias,
  getFavoritos,
  getResenasPorUsuario,
  getSellos,
  getVisitas,
  imageUrl,
  isUnauthorized,
  type Cafeteria,
  type Resena,
  type Sello,
  type Visita,
} from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

import { recentVisits, stamps as demoStamps, type Stamp, type Visit } from '@/data/demo';
import { formatStampDate, formatVisitDate, initialsFor, parseApiDate } from '@/lib/format';

const MAX_STAMPS = 10;
const MAX_VISITS = 5;

export type PassportCounts = {
  sellos: number;
  cafeterias: number;
  ciudades: number;
  visitas: number;
  resenas: number;
  favoritas: number;
};

export type PassportData = {
  source: 'api' | 'demo';
  stamps: Stamp[];
  visits: Visit[];
  sellos: Sello[];
  counts: PassportCounts;
  loading: boolean;
  error: string | null;
  reload: () => void;
};

const demoCounts: PassportCounts = {
  sellos: demoStamps.filter((stamp) => !stamp.locked).length,
  cafeterias: 8,
  ciudades: 3,
  visitas: recentVisits.length,
  resenas: 9,
  favoritas: 6,
};

const demoData: PassportData = {
  source: 'demo',
  stamps: demoStamps,
  visits: recentVisits,
  sellos: [],
  counts: demoCounts,
  loading: false,
  error: null,
  reload: () => {},
};

function buildStamps(sellos: Sello[], cafeterias: Cafeteria[]): Stamp[] {
  const cafeteriasById = new Map(cafeterias.map((cafeteria) => [cafeteria.id, cafeteria]));

  const collected: Stamp[] = [...sellos]
    .sort(
      (a, b) =>
        (parseApiDate(b.fechaObtenido)?.getTime() ?? 0) -
        (parseApiDate(a.fechaObtenido)?.getTime() ?? 0),
    )
    .slice(0, MAX_STAMPS)
    .map((sello) => {
      const cafeteria = cafeteriasById.get(sello.cafeteriaId);
      return {
        id: `s${sello.id}`,
        name: cafeteria?.nombre ?? `Cafetería #${sello.cafeteriaId}`,
        city: cafeteria?.ciudad ?? '—',
        date: formatStampDate(sello.fechaObtenido),
        initials: initialsFor(cafeteria?.nombre ?? 'CP'),
        imageUrl: imageUrl(sello.imagenUrl),
      };
    });

  const placeholders: Stamp[] = [];
  for (let index = collected.length; index < MAX_STAMPS; index += 1) {
    placeholders.push({
      id: `locked-${index}`,
      name: 'Próxima visita',
      city: '',
      date: '',
      initials: '',
      locked: true,
    });
  }

  return [...collected, ...placeholders];
}

function buildVisits(
  visitas: Visita[],
  cafeterias: Cafeteria[],
  resenas: Resena[],
): Visit[] {
  const cafeteriasById = new Map(cafeterias.map((cafeteria) => [cafeteria.id, cafeteria]));
  const resenasByVisita = new Map(resenas.map((resena) => [resena.visitaId, resena]));

  return [...visitas]
    .sort(
      (a, b) =>
        (parseApiDate(b.fechaVisita)?.getTime() ?? 0) -
        (parseApiDate(a.fechaVisita)?.getTime() ?? 0),
    )
    .slice(0, MAX_VISITS)
    .map((visita) => {
      const cafeteria = cafeteriasById.get(visita.cafeteriaId);
      const resena = resenasByVisita.get(visita.id);
      return {
        id: `v${visita.id}`,
        cafeteria: cafeteria?.nombre ?? `Cafetería #${visita.cafeteriaId}`,
        area: cafeteria?.ciudad ?? '—',
        date: formatVisitDate(visita.fechaVisita),
        rating: resena?.calificacion ?? 0,
        note: visita.nota?.trim() || 'Visita validada con el código QR del local.',
        initials: initialsFor(cafeteria?.nombre ?? 'CP'),
      };
    });
}

type RemoteState = {
  key: string;
  stamps: Stamp[];
  visits: Visit[];
  sellos: Sello[];
  counts: PassportCounts;
  error: string | null;
};

const emptyCounts: PassportCounts = {
  sellos: 0,
  cafeterias: 0,
  ciudades: 0,
  visitas: 0,
  resenas: 0,
  favoritas: 0,
};

export function usePassportData(): PassportData {
  const { status, token, user, signOut } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [remote, setRemote] = useState<RemoteState | null>(null);

  const reload = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  // Al volver a la pestaña (por ejemplo tras sellar) se refresca el pasaporte.
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      setRefreshKey((current) => current + 1);
    }, []),
  );

  const signedIn = status === 'signedIn' && Boolean(token);
  const key = signedIn && token ? `${token}:${refreshKey}` : '';
  const current = remote && remote.key === key ? remote : null;

  useEffect(() => {
    if (!token) {
      return;
    }

    let active = true;

    async function load() {
      try {
        const [sellos, visitas, cafeterias, resenas, favoritos] = await Promise.all([
          getSellos(token as string),
          getVisitas(token as string),
          getCafeterias(),
          user?.id ? getResenasPorUsuario(user.id) : Promise.resolve<Resena[]>([]),
          getFavoritos(token as string),
        ]);

        if (!active) {
          return;
        }

        const cafeteriasById = new Map(cafeterias.map((cafeteria) => [cafeteria.id, cafeteria]));
        const stampCafeterias = sellos
          .map((sello) => cafeteriasById.get(sello.cafeteriaId))
          .filter((cafeteria): cafeteria is Cafeteria => Boolean(cafeteria));

        const counts: PassportCounts = {
          sellos: sellos.length,
          cafeterias: new Set(sellos.map((sello) => sello.cafeteriaId)).size,
          ciudades: new Set(stampCafeterias.map((cafeteria) => cafeteria.ciudad)).size,
          visitas: visitas.length,
          resenas: resenas.length,
          favoritas: favoritos.length,
        };

        setRemote({
          key,
          stamps: buildStamps(sellos, cafeterias),
          visits: buildVisits(visitas, cafeterias, resenas),
          sellos,
          counts,
          error: null,
        });
      } catch (caught) {
        if (!active) {
          return;
        }
        if (isUnauthorized(caught)) {
          await signOut();
          return;
        }
        setRemote({
          key,
          stamps: buildStamps([], []),
          visits: [],
          sellos: [],
          counts: emptyCounts,
          error:
            caught instanceof Error ? caught.message : 'No se pudo cargar tu pasaporte.',
        });
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [key, token, user?.id, signOut]);

  if (!signedIn) {
    return { ...demoData, reload };
  }

  return {
    source: 'api',
    stamps: current?.stamps ?? buildStamps([], []),
    visits: current?.visits ?? [],
    sellos: current?.sellos ?? [],
    counts: current?.counts ?? emptyCounts,
    loading: !current,
    error: current?.error ?? null,
    reload,
  };
}
