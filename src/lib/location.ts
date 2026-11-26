import * as Location from 'expo-location';
import { Platform } from 'react-native';

/**
 * Solicita el permiso de ubicación "mientras se usa la app" al arrancar.
 * En web se omite: el navegador pediría el permiso al usar geolocalización.
 */
export async function requestLocationPermissionOnStartup(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await Location.requestForegroundPermissionsAsync();
  } catch {
    // Un dispositivo sin servicios de ubicación no debe impedir abrir la app.
  }
}
