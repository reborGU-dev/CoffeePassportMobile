# ☕ Coffee Passport

App móvil para visitar cafeterías, coleccionar sellos y llevar un pasaporte cafetero.
Está hecha con **Expo + React Native** (Expo Router, TypeScript) para **Android e iOS**.

## Pantallas

- **Acceso y registro**: inicio de sesión, creación de cuenta y modo invitado.
- **Mapa**: pide permiso de ubicación, muestra las cafeterías geolocalizadas y ordena la
  lista por distancia. Al tocar un pin se abre la ficha del local con foto, dirección,
  distancia y el botón «Cómo llegar».
- **Pasaporte**: sellos coleccionados, visitas recientes y progreso de nivel.
- **Escanear**: lector de QR con permiso de cámara para registrar una visita.
- **Perfil**: datos del catador, ajustes y menú de cuenta.

Las pantallas de **Pasaporte** y **Perfil** se pueden ver sin backend: entra con
«Continuar como invitado» y la app usa los datos de demostración de `src/data/demo.ts`.
La pestaña **Mapa** sí necesita la API local de pruebas para mostrar el catálogo de
cafeterías (sin ella muestra el aviso de «Sin conexión» y permite reintentar).

## Requisitos

- Node.js 20 o superior y npm.
- [Expo Go](https://expo.dev/go) con **SDK 58** en un teléfono, o un emulador
  Android/iOS. También puedes generar un build de desarrollo con
  `npx expo run:android` / `npx expo run:ios`.
- Opcional: la API local de pruebas (ver abajo).

## Cómo ejecutarla

```bash
# 1. Instala dependencias
npm install

# 2. Configura la URL de la API local
#    Copia el ejemplo y ajusta la dirección (IP de tu equipo en la red Wi-Fi)
cp .env.example .env          # macOS / Linux / Git Bash
# Copy-Item .env.example .env # Windows PowerShell

# 3. Arranca Metro
npx expo start
```

Después:

- Escanea el QR con **Expo Go** (el teléfono y la computadora deben estar en la misma red).
- O pulsa `a` para el emulador de Android / `i` para el simulador de iOS.

Si no creas el `.env`, la app usa una URL por defecto para el emulador de Android
(`http://10.0.2.2:<puerto>`) o para iOS/web (`http://localhost:<puerto>`).

### API local de pruebas

El proyecto se desarrolló contra **una API local, solo para pruebas**; no está incluida
en este repositorio. Configura su dirección en `.env` con la variable
`EXPO_PUBLIC_API_URL` (ver `.env.example`). No se requieren claves ni servicios externos
para ver el resto de la app.

## Permisos

- **Ubicación**: se pide al abrir la pestaña Mapa y se usa para centrar el mapa y ordenar
  las cafeterías por cercanía. Se declara con el plugin `expo-location` en `app.json`.
- **Cámara**: se pide en la pantalla de escaneo para leer el código QR del local. Se
  declara con el plugin `expo-camera` en `app.json`.

En Expo Go ambos permisos funcionan con la configuración del proyecto. Para un build
independiente de Android con Google Maps hay que agregar
`android.config.googleMaps.apiKey` en `app.json` (Expo Go ya incluye una clave propia).

## Estructura

```text
src/app/          Rutas y pantallas (Expo Router)
src/components/   Componentes de UI, mapa y hoja de cafeterías
src/hooks/        Lógica reutilizable (ubicación, cafeterías, pasaporte, tema)
src/lib/          Cliente de la API, geolocalización, sesión y formato
src/data/         Datos de demostración (mock)
src/constants/    Tema, colores y espaciados
assets/           Iconos, splash e imágenes
```

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm start` | Arranca Metro (`expo start`). |
| `npm run android` | Arranca Metro y abre Android. |
| `npm run ios` | Arranca Metro y abre iOS. |
| `npm run web` | Arranca la versión web. |
| `npm run lint` | Revisa el código con ESLint (`expo lint`). |

Comprobación de tipos:

```bash
npx tsc --noEmit
```

## Notas

- El proyecto usa **Continuous Native Generation**: no hay carpetas `android/` ni `ios/`;
  la configuración nativa vive en `app.json` y en los config plugins.
- Para instalar una librería usa `npx expo install <paquete>` (elige la versión
  compatible con el SDK en lugar de `npm install`).
- La app funciona en Expo Go; si agregas una librería con código nativo necesitarás un
  build de desarrollo (`npx expo run:android` o `eas build --profile development`).
