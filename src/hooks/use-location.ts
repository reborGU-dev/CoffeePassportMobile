import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking } from 'react-native';

export type EstadoUbicacion = 'cargando' | 'concedido' | 'denegado' | 'sin_gps' | 'error';

export type Ubicacion = {
  latitude: number;
  longitude: number;
  /** Radio de incertidumbre en metros. */
  accuracy: number | null;
};

/** `getCurrentPositionAsync` puede quedarse colgado sin GPS; no bloqueamos la pantalla. */
const TIEMPO_LIMITE_MS = 12_000;

function conTiempoLimite<T>(promesa: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    let resuelto = false;
    const cerrar = (valor: T | null) => {
      if (resuelto) {
        return;
      }
      resuelto = true;
      clearTimeout(timer);
      resolve(valor);
    };
    const timer = setTimeout(() => cerrar(null), ms);
    promesa.then((valor) => cerrar(valor)).catch(() => cerrar(null));
  });
}

/**
 * Pide el permiso de ubicación ("mientras se usa la app") y resuelve una
 * posición. La ubicación se queda en memoria: no se guarda ni se envía a la API.
 * Se llama a `solicitar()` desde un efecto de la pantalla que la necesita.
 */
export function useUbicacion() {
  const [estado, setEstado] = useState<EstadoUbicacion>('cargando');
  const [coords, setCoords] = useState<Ubicacion | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [puedePreguntar, setPuedePreguntar] = useState(true);

  const vivo = useRef(true);
  const enCurso = useRef(false);

  useEffect(() => {
    vivo.current = true;
    return () => {
      vivo.current = false;
    };
  }, []);

  const solicitar = useCallback(async () => {
    if (enCurso.current) {
      return;
    }
    enCurso.current = true;
    setEstado('cargando');
    setMensaje(null);

    try {
      const serviciosActivos = await Location.hasServicesEnabledAsync();
      if (!vivo.current) {
        return;
      }
      if (!serviciosActivos) {
        setEstado('sin_gps');
        setCoords(null);
        setMensaje('El GPS del teléfono está apagado. Actívalo para ver qué cafeterías tienes cerca.');
        return;
      }

      let permiso = await Location.getForegroundPermissionsAsync();
      if (!permiso.granted && permiso.canAskAgain) {
        permiso = await Location.requestForegroundPermissionsAsync();
      }
      if (!vivo.current) {
        return;
      }

      setPuedePreguntar(permiso.canAskAgain);

      if (!permiso.granted) {
        setEstado('denegado');
        setCoords(null);
        setMensaje(
          permiso.canAskAgain
            ? 'Sin ubicación podemos mostrarte el mapa, pero no ordenar las cafeterías por cercanía.'
            : 'La ubicación está desactivada para Coffee Passport. Actívala en los ajustes del sistema.',
        );
        return;
      }

      const actual = await conTiempoLimite(
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        TIEMPO_LIMITE_MS,
      );
      const posicion =
        actual ??
        (await Location.getLastKnownPositionAsync({
          maxAge: 10 * 60_000,
          requiredAccuracy: 1_000,
        }));

      if (!vivo.current) {
        return;
      }

      if (!posicion) {
        setEstado('error');
        setMensaje('No pudimos obtener tu ubicación. Inténtalo de nuevo, mejor al aire libre.');
        return;
      }

      setCoords({
        latitude: posicion.coords.latitude,
        longitude: posicion.coords.longitude,
        accuracy: posicion.coords.accuracy,
      });
      setEstado('concedido');
    } catch {
      if (vivo.current) {
        setEstado('error');
        setMensaje('No pudimos leer tu ubicación. Revisa los permisos del sistema.');
      }
    } finally {
      enCurso.current = false;
    }
  }, []);

  const abrirAjustes = useCallback(() => {
    void Linking.openSettings();
  }, []);

  return { estado, coords, mensaje, puedePreguntar, solicitar, abrirAjustes };
}
