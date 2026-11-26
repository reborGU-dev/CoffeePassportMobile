import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { Usuario } from '@/lib/api';

export type StoredSession = {
  token: string;
  user: Usuario | null;
  /** `expiresAtUtc` de `AuthResponse`; permite descartar un JWT vencido sin una llamada. */
  expiresAtUtc?: string | null;
};

const SESSION_KEY = 'coffeepassport.session';
const isWeb = Platform.OS === 'web';

/**
 * En móvil el token se guarda cifrado con el Keychain (iOS) / Keystore
 * (Android) mediante expo-secure-store. SecureStore no existe en web, así que
 * ahí se usa localStorage. El resto de la app no sabe cuál se está usando.
 */
function webStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage;
}

export async function readSession(): Promise<StoredSession | null> {
  try {
    const raw = isWeb
      ? webStorage()?.getItem(SESSION_KEY) ?? null
      : await SecureStore.getItemAsync(SESSION_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<StoredSession>;
    if (typeof parsed.token !== 'string' || !parsed.token) {
      return null;
    }

    return {
      token: parsed.token,
      user: parsed.user ?? null,
      expiresAtUtc: typeof parsed.expiresAtUtc === 'string' ? parsed.expiresAtUtc : null,
    };
  } catch {
    return null;
  }
}

export async function writeSession(session: StoredSession): Promise<void> {
  const raw = JSON.stringify(session);
  if (isWeb) {
    webStorage()?.setItem(SESSION_KEY, raw);
    return;
  }
  await SecureStore.setItemAsync(SESSION_KEY, raw);
}

export async function clearSession(): Promise<void> {
  if (isWeb) {
    webStorage()?.removeItem(SESSION_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(SESSION_KEY);
}
