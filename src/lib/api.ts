import { Platform } from 'react-native';

/**
 * Cliente HTTP de la API CoffeePassport (ASP.NET Core 8).
 *
 * La URL se toma de `EXPO_PUBLIC_API_URL` (ver `.env`). Si no está
 * definida se usa la API local:
 *   - Emulador Android: http://10.0.2.2:5018 (el host de la máquina anfitriona)
 *   - iOS Simulator / web: http://localhost:5018
 *
 * La API debe arrancar con el perfil `http` (`dotnet run --launch-profile http`).
 * Si arranca con el perfil `https`, ASP.NET redirige 5018 -> 7213 y en el
 * emulador Android esa redirección apunta a `localhost` (no al host), así que
 * hay que apuntar directo a `https://10.0.2.2:7213` y confiar en el certificado.
 */
const FALLBACK_API_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:5018' : 'http://localhost:5018';

export const API_URL = (process.env.EXPO_PUBLIC_API_URL?.trim() || FALLBACK_API_URL).replace(
  /\/+$/,
  '',
);

/** Origen sin `/api`, usado para resolver las rutas de imágenes (`/uploads/...`). */
export const API_ORIGIN = API_URL;

export const IS_HTTPS = API_URL.startsWith('https://');

/**
 * Si la API corre con el perfil `https`, ASP.NET responde `307` desde el puerto
 * HTTP hacia el TLS. Al seguir esa redirección el navegador elimina el header
 * `Authorization` (son orígenes distintos), así que los endpoints autenticados
 * fallan con 401. En web se resuelve una vez el origen final con una petición
 * anónima y se usa ese origen para todo lo demás. En nativo se debe arrancar la
 * API con `--launch-profile http`; si no, hay que apuntar al puerto TLS directo.
 */
let effectiveOrigin: string | null = null;
let originPromise: Promise<string> | null = null;

async function resolveOrigin(): Promise<string> {
  if (Platform.OS !== 'web') {
    return API_URL;
  }
  if (effectiveOrigin) {
    return effectiveOrigin;
  }
  if (!originPromise) {
    originPromise = (async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      try {
        const probe = await fetch(`${API_URL}/api/cafeterias`, {
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });
        if (probe.url) {
          const origin = new URL(probe.url).origin;
          if (origin && origin !== API_URL) {
            effectiveOrigin = origin;
          }
        }
      } catch {
        // Sin red: se conserva la URL configurada.
      } finally {
        clearTimeout(timer);
      }
      effectiveOrigin = effectiveOrigin ?? API_URL;
      return effectiveOrigin;
    })();
  }
  return originPromise;
}

export type Rol = 'Admin' | 'Usuario';

export type Usuario = {
  id: number;
  nombre: string;
  email: string;
  fechaRegistro: string;
  puntos: number;
  nivel: number;
  rol: Rol;
};

export type AuthResponse = {
  token: string;
  tokenType: string;
  expiresAtUtc: string;
  usuario: Usuario;
};

export type Cafeteria = {
  id: number;
  nombre: string;
  direccion: string;
  ciudad: string;
  /** WGS84. `null` cuando la cafetería no está geolocalizada (no usar 0,0). */
  latitud: number | null;
  longitud: number | null;
  descripcion: string | null;
  fotoUrl: string | null;
  selloUrl: string | null;
  promedioCalificacion: number;
  totalResenas: number;
  porcentajeAceptacion: number;
  activa: boolean;
  fechaCreacion: string;
};

export type Visita = {
  id: number;
  cafeteriaId: number;
  usuarioId: number;
  fechaVisita: string;
  nota: string | null;
  codigoVerificacion: string | null;
  puntosGanados: number;
};

export type Sello = {
  id: number;
  visitaId: number;
  usuarioId: number;
  cafeteriaId: number;
  fechaObtenido: string;
  imagenUrl: string | null;
};

/** Respuesta de `POST /api/sellos/qr`: ya trae la visita y el sello creados. */
export type SelloQr = {
  selloId: number;
  visitaId: number;
  cafeteriaId: number;
  cafeteriaNombre: string;
  imagenUrl: string | null;
  fechaObtenido: string;
  puntosGanados: number;
};

export type QrImpreso = {
  cafeteriaId: number;
  nombre: string;
  payload: string;
  emitidoEn: string;
  expiraEn: string;
  diasVigencia: number;
};

export type Resena = {
  id: number;
  cafeteriaId: number;
  usuarioId: number;
  visitaId: number;
  fecha: string;
  comentario: string | null;
  calificacion: number;
};

export type Favorito = {
  id: number;
  usuarioId: number;
  cafeteriaId: number;
  fechaAgregado: string;
};

export type ProblemDetails = {
  type?: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  traceId?: string;
  errors?: Record<string, string[]>;
};

export class ApiError extends Error {
  readonly status: number;
  /** `title` del ProblemDetails: sirve para distinguir el caso (p. ej. "Sello duplicado"). */
  readonly title: string;
  /** Errores de validación (`errors` del ProblemDetails), por campo. */
  readonly fields: Record<string, string[]> | null;
  /** Segundos indicados por `Retry-After` en un `429`. */
  readonly retryAfterSeconds: number | null;

  constructor(
    message: string,
    status: number,
    title = '',
    details: { fields?: Record<string, string[]> | null; retryAfterSeconds?: number | null } = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.title = title;
    this.fields = details.fields ?? null;
    this.retryAfterSeconds = details.retryAfterSeconds ?? null;
  }
}

export function isUnauthorized(error: unknown) {
  return error instanceof ApiError && error.status === 401;
}

/** Resuelve una ruta relativa de imagen (`/uploads/...`) contra el origen de la API. */
export function imageUrl(relative: string | null | undefined): string | null {
  if (!relative || !relative.trim()) {
    return null;
  }
  if (/^https?:\/\//i.test(relative)) {
    return relative;
  }
  return `${effectiveOrigin ?? API_ORIGIN}${relative.startsWith('/') ? '' : '/'}${relative}`;
}

function fallbackMessage(status: number, retryAfterSeconds: number | null = null): string {
  switch (status) {
    case 0:
      return `No se pudo conectar con la API en ${API_URL}. Verifica que esté corriendo con el perfil http.`;
    case 400:
      return 'Los datos enviados no son válidos.';
    case 401:
      return 'Debes iniciar sesión para continuar.';
    case 403:
      return 'No tienes permiso para esta acción.';
    case 404:
      return 'No se encontró el recurso.';
    case 409:
      return 'La operación entra en conflicto con el estado actual.';
    case 410:
      return 'Ese recurso ya no está disponible.';
    case 429:
      return retryAfterSeconds
        ? `Demasiados intentos. Espera ${retryAfterSeconds} segundos e inténtalo de nuevo.`
        : 'Demasiados intentos. Espera un minuto e inténtalo de nuevo.';
    default:
      return `La API respondió con un error ${status}.`;
  }
}

/** `Retry-After` puede venir en segundos o como fecha HTTP. */
function readRetryAfter(value: string | null): number | null {
  if (!value) {
    return null;
  }
  const seconds = Number(value.trim());
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.ceil(seconds);
  }
  const date = Date.parse(value);
  if (!Number.isNaN(date)) {
    return Math.max(0, Math.ceil((date - Date.now()) / 1000));
  }
  return null;
}

/**
 * Extrae el mensaje para el usuario y los datos estructurados del ProblemDetails.
 * En un `400`, `errors` es más específico que el `detail` genérico, así que gana.
 * `title` identifica el caso (por ejemplo, "Sello duplicado").
 */
function readProblem(data: unknown): {
  message: string | null;
  title: string;
  fields: Record<string, string[]> | null;
} {
  if (!data || typeof data !== 'object') {
    return { message: null, title: '', fields: null };
  }

  const record = data as Record<string, unknown>;
  const title = typeof record.title === 'string' ? record.title.trim() : '';
  const detail = typeof record.detail === 'string' ? record.detail.trim() : '';

  const fields: Record<string, string[]> = {};
  if (record.errors && typeof record.errors === 'object' && !Array.isArray(record.errors)) {
    for (const [key, value] of Object.entries(record.errors as Record<string, unknown>)) {
      if (Array.isArray(value)) {
        const messages = value.filter((item): item is string => typeof item === 'string' && !!item.trim());
        if (messages.length) {
          fields[key] = messages;
        }
      }
    }
  }

  const firstFieldMessage = Object.values(fields)[0]?.[0];
  const fallback = typeof record.error === 'string' ? record.error.trim() : '';
  const message = firstFieldMessage || detail || fallback || title || null;

  return { message: message || null, title, fields: Object.keys(fields).length ? fields : null };
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  token?: string | null;
  timeoutMs?: number;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, timeoutMs = 15000 } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const base = await resolveOrigin();
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${base}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });

    // 204 No Content (PUT/DELETE) llega sin cuerpo.
    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    let data: unknown = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      const { message, title, fields } = readProblem(data);
      const retryAfterSeconds =
        response.status === 429 ? readRetryAfter(response.headers.get('Retry-After')) : null;
      const fallback = fallbackMessage(response.status, retryAfterSeconds);
      throw new ApiError(
        response.status === 429 && retryAfterSeconds ? fallback : message ?? fallback,
        response.status,
        title,
        { fields, retryAfterSeconds },
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(`La API en ${API_URL} no respondió a tiempo.`, 0, 'Sin conexión');
    }
    throw new ApiError(fallbackMessage(0), 0, 'Sin conexión');
  } finally {
    clearTimeout(timeout);
  }
}

/* ---------------------------------- Auth ---------------------------------- */

export function login(email: string, password: string) {
  return request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: { email: email.trim().toLowerCase(), password },
  });
}

export function register(nombre: string, email: string, password: string) {
  return request<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: { nombre: nombre.trim(), email: email.trim().toLowerCase(), password },
  });
}

export function getMe(token: string) {
  return request<Usuario>('/api/auth/me', { token });
}

/* ------------------------------- Cafeterías -------------------------------- */

export function getCafeterias(ciudad?: string) {
  const query = ciudad ? `?ciudad=${encodeURIComponent(ciudad)}` : '';
  return request<Cafeteria[]>(`/api/cafeterias${query}`);
}

export function getCafeteria(id: number) {
  return request<Cafeteria>(`/api/cafeterias/${id}`);
}

/** Solo Admin: payload firmado para imprimir el QR del local. */
export function getCafeteriaQr(token: string, id: number, dias = 30) {
  return request<QrImpreso>(`/api/cafeterias/${id}/qr?dias=${dias}`, { token });
}

/** Solo Admin: revoca los QR anteriores y devuelve uno nuevo. */
export function regenerateCafeteriaQr(token: string, id: number, dias = 30) {
  return request<QrImpreso>(`/api/cafeterias/${id}/qr/regenerar?dias=${dias}`, {
    method: 'POST',
    token,
  });
}

/* --------------------------------- Visitas -------------------------------- */

export function getVisitas(token: string, cafeteriaId?: number) {
  const query = cafeteriaId ? `?cafeteriaId=${cafeteriaId}` : '';
  return request<Visita[]>(`/api/visitas${query}`, { token });
}

/* ---------------------------------- Sellos -------------------------------- */

export function getSellos(token: string, cafeteriaId?: number) {
  const query = cafeteriaId ? `?cafeteriaId=${cafeteriaId}` : '';
  return request<Sello[]>(`/api/sellos${query}`, { token });
}

/** Flujo principal: la API verifica el QR y crea visita + sello en una transacción. */
export function scanQr(token: string, codigo: string) {
  return request<SelloQr>('/api/sellos/qr', {
    method: 'POST',
    token,
    body: { codigo },
  });
}

/* --------------------------------- Reseñas -------------------------------- */

export function getResenasPorUsuario(usuarioId: number) {
  return request<Resena[]>(`/api/resenas?usuarioId=${usuarioId}`);
}

/* -------------------------------- Favoritos ------------------------------- */

export function getFavoritos(token: string) {
  return request<Favorito[]>('/api/favoritos', { token });
}
