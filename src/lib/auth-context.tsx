import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import {
  ApiError,
  getMe,
  isUnauthorized,
  login as loginRequest,
  register as registerRequest,
  type Usuario,
} from '@/lib/api';
import { parseApiDate } from '@/lib/format';
import { clearSession, readSession, writeSession } from '@/lib/session-storage';

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn' | 'guest';

type AuthContextValue = {
  status: AuthStatus;
  token: string | null;
  user: Usuario | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (nombre: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Margen de seguridad para no usar un JWT que expire durante la siguiente petición. */
function isTokenExpired(expiresAtUtc: string | null | undefined): boolean {
  const date = parseApiDate(expiresAtUtc);
  return !!date && date.getTime() <= Date.now() + 10_000;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<Usuario | null>(null);
  const [expiresAtUtc, setExpiresAtUtc] = useState<string | null>(null);

  // Al abrir la app se recupera la sesión cifrada y se valida contra /api/auth/me.
  useEffect(() => {
    let active = true;

    async function restore() {
      const stored = await readSession();
      if (!active) {
        return;
      }

      if (!stored) {
        setStatus('signedOut');
        return;
      }

      if (isTokenExpired(stored.expiresAtUtc)) {
        await clearSession();
        setToken(null);
        setUser(null);
        setExpiresAtUtc(null);
        setStatus('signedOut');
        return;
      }

      setToken(stored.token);
      setUser(stored.user);
      setExpiresAtUtc(stored.expiresAtUtc ?? null);
      setStatus('signedIn');

      try {
        const me = await getMe(stored.token);
        if (!active) {
          return;
        }
        setUser(me);
        await writeSession({ token: stored.token, user: me, expiresAtUtc: stored.expiresAtUtc });
      } catch (error) {
        if (!active) {
          return;
        }
        // 401: el token expiró o la clave cambió -> hay que volver a entrar.
        // Error de red: se conserva la sesión cacheada para poder abrir la app.
        if (isUnauthorized(error)) {
          await clearSession();
          setToken(null);
          setUser(null);
          setExpiresAtUtc(null);
          setStatus('signedOut');
        }
      }
    }

    void restore();

    return () => {
      active = false;
    };
  }, []);

  const applyAuth = useCallback(
    async (nextToken: string, nextUser: Usuario, nextExpiresAtUtc: string) => {
      await writeSession({ token: nextToken, user: nextUser, expiresAtUtc: nextExpiresAtUtc });
      setToken(nextToken);
      setUser(nextUser);
      setExpiresAtUtc(nextExpiresAtUtc);
      setStatus('signedIn');
    },
    [],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      const response = await loginRequest(email, password);
      await applyAuth(response.token, response.usuario, response.expiresAtUtc);
    },
    [applyAuth],
  );

  const signUp = useCallback(
    async (nombre: string, email: string, password: string) => {
      const response = await registerRequest(nombre, email, password);
      await applyAuth(response.token, response.usuario, response.expiresAtUtc);
    },
    [applyAuth],
  );

  const signOut = useCallback(async () => {
    await clearSession();
    setToken(null);
    setUser(null);
    setExpiresAtUtc(null);
    setStatus('signedOut');
  }, []);

  const continueAsGuest = useCallback(() => {
    setStatus('guest');
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) {
      return;
    }
    try {
      const me = await getMe(token);
      setUser(me);
      await writeSession({ token, user: me, expiresAtUtc });
    } catch (error) {
      if (isUnauthorized(error)) {
        await signOut();
      }
      throw error;
    }
  }, [token, expiresAtUtc, signOut]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      token,
      user,
      signIn,
      signUp,
      signOut,
      continueAsGuest,
      refreshUser,
    }),
    [status, token, user, signIn, signUp, signOut, continueAsGuest, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  }
  return context;
}

export function authErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  return 'Ocurrió un error inesperado. Intenta de nuevo.';
}
