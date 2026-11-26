import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { CoffeeGradient, OnEspresso, Radius, Spacing, Type } from '@/constants/theme';
import {
  ApiError,
  getCafeteria,
  getCafeterias,
  getCafeteriaQr,
  getSellos,
  imageUrl,
  isUnauthorized,
  scanQr,
  type Cafeteria,
  type SelloQr,
} from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { formatStampDate, initialsFor } from '@/lib/format';
import { looksLikeStampQr, normalizeQrText } from '@/lib/qr';

// ─── Palette helpers (all over espresso backgrounds) ─────────────────────────
const CREAM = OnEspresso.text;      // '#FFF8F0'
const MUTED = OnEspresso.muted;     // '#D2BEAB'
const FAINT = OnEspresso.faint;     // 'rgba(255,248,240,0.16)'
const LINE  = OnEspresso.line;      // 'rgba(255,248,240,0.22)'

// Stamp amber accent (over espresso)
const AMBER = '#B96B36';

const absoluteFill = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
} as const;

type Phase = 'scanning' | 'working' | 'success' | 'error';

type StampResult = {
  sello: SelloQr;
  cafeteria: Cafeteria | null;
  imagen: string | null;
};

function describeScanError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.title === 'Sello duplicado') {
      return `${error.message} El límite se reinicia a las 00:00 UTC (18:00 en CDMX).`;
    }
    return error.message;
  }
  return error instanceof Error
    ? error.message
    : 'No se pudo registrar el sello. Intenta de nuevo.';
}

export default function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { status, token, user, signOut } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [phase, setPhase] = useState<Phase>('scanning');
  const [result, setResult] = useState<StampResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const busyRef = useRef(false);
  const lastScanRef = useRef<{ data: string; at: number } | null>(null);

  const confirmStamp = useCallback(
    async (codigo: string) => {
      if (busyRef.current) return;

      if (status !== 'signedIn' || !token) {
        setPhase('error');
        setMessage('Inicia sesión para registrar el sello en tu pasaporte.');
        return;
      }

      busyRef.current = true;
      setPhase('working');
      setMessage('Validando el QR con la API…');

      try {
        const sello = await scanQr(token, codigo);

        setMessage('Cargando los datos de la cafetería…');
        let cafeteria: Cafeteria | null = null;
        try {
          cafeteria = await getCafeteria(sello.cafeteriaId);
        } catch {
          cafeteria = null;
        }

        setResult({ sello, cafeteria, imagen: imageUrl(sello.imagenUrl) });
        setPhase('success');
        setMessage(null);
      } catch (error) {
        if (isUnauthorized(error)) {
          await signOut();
          setMessage('Tu sesión expiró. Vuelve a iniciar sesión para sellar.');
        } else {
          setMessage(describeScanError(error));
        }
        setPhase('error');
      } finally {
        busyRef.current = false;
      }
    },
    [signOut, status, token],
  );

  const handleBarcodeScanned = useCallback(
    (scan: BarcodeScanningResult) => {
      if (phase !== 'scanning' || busyRef.current) return;

      const codigo = scan.data;
      const now = Date.now();
      const last = lastScanRef.current;
      if (last && last.data === codigo && now - last.at < 2500) return;
      lastScanRef.current = { data: codigo, at: now };

      if (!looksLikeStampQr(normalizeQrText(codigo))) {
        setMessage('Ese código no es un QR de CoffeePassport. Busca el del mostrador.');
        return;
      }

      setMessage(null);
      void confirmStamp(codigo);
    },
    [confirmStamp, phase],
  );

  const reset = () => {
    busyRef.current = false;
    lastScanRef.current = null;
    setPhase('scanning');
    setResult(null);
    setMessage(null);
    setFailedImage(null);
  };

  const close = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/mapa');
    }
  };

  const simulateQr = async () => {
    if (phase === 'working') return;

    if (status !== 'signedIn' || !token) {
      setPhase('error');
      setMessage('Inicia sesión para probar el sellado.');
      return;
    }

    if (user?.rol !== 'Admin') {
      setPhase('error');
      setMessage(
        'La simulación firma un QR en la API y necesita una cuenta Admin. Usa ana@example.com / Cafe12345!.',
      );
      return;
    }

    try {
      setMessage('Buscando una cafetería con sello configurado…');
      const [cafeterias, sellos] = await Promise.all([getCafeterias(), getSellos(token)]);

      const hoyUtc = new Date().toISOString().slice(0, 10);
      const selladasHoy = new Set(
        sellos
          .filter((sello) => sello.fechaObtenido.slice(0, 10) === hoyUtc)
          .map((sello) => sello.cafeteriaId),
      );

      const conSello = cafeterias.filter((cafeteria) => cafeteria.activa && cafeteria.selloUrl);
      const target =
        conSello.find((cafeteria) => !selladasHoy.has(cafeteria.id)) ??
        conSello[0] ??
        cafeterias.find((cafeteria) => cafeteria.activa);

      if (!target) {
        setPhase('error');
        setMessage('La API no tiene cafeterías activas. Ejecuta el seed de la base de datos.');
        return;
      }

      const qr = await getCafeteriaQr(token, target.id, 1);
      await confirmStamp(qr.payload);
    } catch (error) {
      setPhase('error');
      setMessage(describeScanError(error));
    }
  };

  /* ══════════════════════ Estado: ÉXITO ══════════════════════ */

  if (phase === 'success' && result) {
    const nombre = result.sello.cafeteriaNombre;
    const ciudad = result.cafeteria?.ciudad?.trim() || 'MÉXICO';

    return (
      <LinearGradient
        colors={CoffeeGradient}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.95, y: 1 }}
        style={styles.fill}>
        <StatusBar style="light" />
        <View
          style={[
            styles.successContent,
            {
              paddingTop: insets.top + Spacing.five,
              paddingBottom: insets.bottom + Spacing.five,
              paddingLeft: insets.left + Spacing.four,
              paddingRight: insets.right + Spacing.four,
            },
          ]}>

          {/* ── Encabezado editorial ── */}
          <View style={styles.successHeader}>
            <Text style={styles.successKicker}>PASAPORTE ACTUALIZADO</Text>
            <Text style={styles.successTitle}>¡Sello conseguido!</Text>
            <Text style={styles.successSubtitle}>
              Tu visita a {nombre} quedó registrada en Coffee Passport.
            </Text>
          </View>

          {/* ── Gran sello coleccionable ── */}
          <View style={styles.bigStampRing}>
            {/* Decorative arc label */}
            <Text style={styles.bigStampArcTop}>COFFEE PASSPORT · MÉXICO</Text>
            <View style={styles.bigStamp}>
              {result.imagen && failedImage !== result.imagen ? (
                <Image
                  source={{ uri: result.imagen }}
                  style={styles.bigStampImage}
                  resizeMode="contain"
                  onError={() => setFailedImage(result.imagen)}
                />
              ) : (
                <View style={styles.bigStampInner}>
                  <Text style={styles.bigStampInitials}>{initialsFor(nombre)}</Text>
                  <View style={styles.bigStampLine} />
                  <Text style={styles.bigStampCity}>{ciudad.toUpperCase()}</Text>
                </View>
              )}
            </View>
            <Text style={styles.bigStampDate}>{formatStampDate(result.sello.fechaObtenido)}</Text>
          </View>

          {/* ── Recibo editorial (tabla de visita) ── */}
          <View style={styles.receipt}>
            {/* Decorative header strip */}
            <View style={styles.receiptHeader}>
              <Text style={styles.receiptHeaderText}>DETALLE DE VISITA</Text>
            </View>
            <View style={styles.receiptBody}>
              <ReceiptRow label="CAFETERÍA" value={nombre} />
              <View style={styles.receiptDivider} />
              <ReceiptRow label="VISITA" value={`#${result.sello.visitaId}`} />
              <View style={styles.receiptDivider} />
              <ReceiptRow label="SELLO" value={`#${result.sello.selloId}`} />
              <View style={styles.receiptDivider} />
              <ReceiptRow label="FECHA" value={formatStampDate(result.sello.fechaObtenido)} />
              {result.sello.puntosGanados > 0 ? (
                <>
                  <View style={styles.receiptDivider} />
                  <ReceiptRow label="PUNTOS" value={`+${result.sello.puntosGanados}`} amber />
                </>
              ) : null}
            </View>
          </View>

          {/* ── CTAs ── */}
          <View style={styles.successActions}>
            <Button
              label="Ver mi pasaporte"
              icon="book"
              iconPosition="left"
              onPress={() => router.replace('/pasaporte')}
            />
            <Button label="Escanear otro QR" variant="secondary" onPress={reset} />
          </View>
        </View>
      </LinearGradient>
    );
  }

  /* ══════════════════════ Estado: ERROR ══════════════════════ */

  if (phase === 'error') {
    return (
      <LinearGradient colors={CoffeeGradient} style={styles.fill}>
        <StatusBar style="light" />
        <View
          style={[
            styles.errorContent,
            {
              paddingTop: insets.top + Spacing.five,
              paddingBottom: insets.bottom + Spacing.five,
              paddingHorizontal: Spacing.four,
            },
          ]}>
          {/* ── Icono de error ── */}
          <View style={styles.errorIconWrap}>
            <View style={styles.errorIconOuter}>
              <Icon name="alert-circle" size={36} color={CREAM} />
            </View>
          </View>

          <Text style={styles.errorKicker}>ALGO SALIÓ MAL</Text>
          <Text style={styles.errorTitle}>No pudimos sellar</Text>
          <Text style={styles.errorMessage}>{message}</Text>

          <View style={styles.errorActions}>
            {status !== 'signedIn' ? (
              <Button
                label="Iniciar sesión"
                icon="log-in"
                iconPosition="left"
                onPress={() => router.replace('/')}
              />
            ) : (
              <Button label="Reintentar" icon="refresh" iconPosition="left" onPress={reset} />
            )}
            <Button label="Volver al mapa" variant="secondary" onPress={close} />
          </View>
        </View>
      </LinearGradient>
    );
  }

  /* ══════════════════════ Permisos de cámara ══════════════════════ */

  if (!permission) {
    return (
      <LinearGradient colors={CoffeeGradient} style={[styles.fill, styles.centerContent]}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={CREAM} />
        <Text style={styles.loadingText}>Preparando la cámara…</Text>
      </LinearGradient>
    );
  }

  if (!permission.granted) {
    return (
      <LinearGradient colors={CoffeeGradient} style={styles.fill}>
        <StatusBar style="light" />
        <View
          style={[
            styles.permissionCard,
            {
              paddingTop: insets.top + Spacing.five,
              paddingBottom: insets.bottom + Spacing.five,
            },
          ]}>
          {/* ── Icono de cámara ── */}
          <View style={styles.permissionIconWrap}>
            <Icon name="camera-outline" size={34} color={CREAM} />
          </View>

          <Text style={styles.permissionKicker}>ACCESO REQUERIDO</Text>
          <Text style={styles.permissionTitle}>Necesitamos{'\n'}tu cámara</Text>
          <Text style={styles.permissionText}>
            La cámara solo se usa para leer el QR del local. La foto no se guarda ni se envía:
            únicamente se procesa el código.
          </Text>

          {permission.canAskAgain ? (
            <Button label="Dar permiso" icon="camera" iconPosition="left" onPress={requestPermission} />
          ) : (
            <Button
              label="Abrir ajustes"
              icon="settings"
              iconPosition="left"
              onPress={() => Linking.openSettings()}
            />
          )}
          <Button label="Volver" variant="ghost" onPress={close} />
        </View>
      </LinearGradient>
    );
  }

  /* ══════════════════════ Vista principal: ESCÁNER ══════════════════════ */

  return (
    <View style={styles.fill}>
      <StatusBar style="light" />

      {/* Cámara */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={phase === 'scanning' ? handleBarcodeScanned : undefined}
        onMountError={(event) => {
          setPhase('error');
          setMessage(
            event?.message
              ? `No se pudo iniciar la cámara: ${event.message}`
              : 'No se pudo iniciar la cámara en este dispositivo.',
          );
        }}
      />

      {/* Scrim oscuro con controles */}
      <View style={styles.scrim} pointerEvents="box-none">

        {/* ── Top bar ── */}
        <View
          style={[
            styles.topBar,
            { paddingTop: insets.top + Spacing.two, paddingHorizontal: Spacing.four },
          ]}>
          {/* Botón cerrar */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar escáner"
            onPress={close}
            style={styles.roundButton}>
            <Icon name="close" size={20} color={CREAM} />
          </Pressable>

          {/* Título central */}
          <View style={styles.topTitle}>
            <Text style={styles.topOverline}>COFFEE PASSPORT</Text>
            <Text style={styles.topTitleText}>Escanear QR</Text>
          </View>

          {/* Linterna */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={torch ? 'Apagar linterna' : 'Encender linterna'}
            onPress={() => setTorch((v) => !v)}
            style={[styles.roundButton, torch && styles.roundButtonActive]}>
            <Icon name={torch ? 'flash' : 'flash-off'} size={20} color={CREAM} />
          </Pressable>
        </View>

        {/* ── Visor QR ── */}
        <View style={styles.finderBlock}>
          <View style={styles.finder}>
            {/* Esquinas estilo editorial */}
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
            {/* Línea de escaneo animada (decorativa) */}
            <View style={styles.scanLine} />
          </View>
          <View style={styles.hintPill}>
            <Icon name="qr-code-outline" size={13} color={CREAM} />
            <Text style={styles.hintText}>Apunta al código del mostrador</Text>
          </View>
        </View>

        {/* ── Panel inferior ── */}
        <View
          style={[
            styles.bottomPanel,
            { paddingBottom: insets.bottom + Spacing.four, paddingHorizontal: Spacing.four },
          ]}>

          {/* Aviso de error/información */}
          {message ? (
            <View style={styles.notice}>
              <Icon name="information-circle" size={15} color={CREAM} />
              <Text style={styles.noticeText}>{message}</Text>
            </View>
          ) : null}

          {/* Separador decorativo */}
          <View style={styles.bottomDivider} />

          <Text style={styles.bottomTitle}>Confirma que estás{'\n'}en la cafetería</Text>
          <Text style={styles.bottomText}>
            El QR firmado del local crea tu visita y sello digital al instante.
          </Text>

          {status !== 'signedIn' ? (
            <Button
              label="Iniciar sesión para sellar"
              icon="log-in"
              iconPosition="left"
              onPress={() => router.replace('/')}
            />
          ) : null}

          {__DEV__ ? (
            <Pressable onPress={simulateQr} hitSlop={8} style={styles.demoButton}>
              <Text style={styles.demoButtonText}>
                {Platform.OS === 'web' ? 'Probar sin cámara (demo)' : 'Simular QR (demo)'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* ── Overlay de trabajo ── */}
      {phase === 'working' ? (
        <View style={styles.workingOverlay}>
          <ActivityIndicator size="large" color={CREAM} />
          <Text style={styles.workingTitle}>Validando visita</Text>
          <Text style={styles.workingText}>{message ?? 'Un momento…'}</Text>
        </View>
      ) : null}
    </View>
  );
}

/* ─── Componente auxiliar: fila de recibo ─────────────────────────────────── */
function ReceiptRow({
  label,
  value,
  amber,
}: {
  label: string;
  value: string;
  amber?: boolean;
}) {
  return (
    <View style={styles.receiptRow}>
      <Text style={styles.receiptLabel}>{label}</Text>
      <Text style={[styles.receiptValue, amber && styles.receiptValueAmber]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

/* ─── Estilos ─────────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  fill: { flex: 1 },
  centerContent: { alignItems: 'center', justifyContent: 'center', gap: Spacing.three },

  /* ── Loading ── */
  loadingText: {
    ...Type.caption,
    color: MUTED,
    marginTop: Spacing.two,
  },

  /* ── Permiso ── */
  permissionCard: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  permissionIconWrap: {
    width: 80,
    height: 80,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: FAINT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  permissionKicker: {
    ...Type.overline,
    color: MUTED,
    letterSpacing: 1.8,
  },
  permissionTitle: {
    ...Type.title,
    color: CREAM,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  permissionText: {
    ...Type.body,
    color: MUTED,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: Spacing.two,
  },

  /* ── Escáner: scrim y controles ── */
  scrim: {
    ...absoluteFill,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(20,16,12,0.22)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  roundButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(20,16,12,0.60)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: LINE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundButtonActive: {
    backgroundColor: 'rgba(185,107,54,0.85)',
    borderColor: 'rgba(255,248,240,0.6)',
  },
  topTitle: {
    alignItems: 'center',
    gap: 2,
  },
  topOverline: {
    ...Type.overline,
    color: MUTED,
    letterSpacing: 1.6,
  },
  topTitleText: {
    ...Type.bodyStrong,
    color: CREAM,
    letterSpacing: 0,
  },

  /* ── Visor QR ── */
  finderBlock: {
    alignItems: 'center',
    gap: Spacing.three,
  },
  finder: {
    width: 264,
    height: 264,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(20,16,12,0.12)',
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderColor: CREAM,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: Radius.md,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: Radius.md,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: Radius.md,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: Radius.md,
  },
  scanLine: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: '50%',
    height: 1.5,
    backgroundColor: 'rgba(185,107,54,0.6)',
    borderRadius: 2,
  },
  hintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(20,16,12,0.65)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: LINE,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
  hintText: {
    ...Type.caption,
    color: CREAM,
    fontWeight: '700',
  },

  /* ── Panel inferior ── */
  bottomPanel: {
    gap: Spacing.two,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(168,72,50,0.90)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,248,240,0.2)',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  noticeText: {
    flex: 1,
    ...Type.caption,
    color: CREAM,
    fontWeight: '600',
    lineHeight: 17,
  },
  bottomDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: LINE,
    marginVertical: Spacing.one,
  },
  bottomTitle: {
    ...Type.heading,
    color: CREAM,
  },
  bottomText: {
    ...Type.caption,
    color: MUTED,
    lineHeight: 18,
  },
  demoButton: {
    alignSelf: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  demoButtonText: {
    ...Type.caption,
    color: MUTED,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  /* ── Overlay Working ── */
  workingOverlay: {
    ...absoluteFill,
    backgroundColor: 'rgba(20,16,12,0.86)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.five,
    gap: Spacing.two,
  },
  workingTitle: {
    ...Type.heading,
    color: CREAM,
    marginTop: Spacing.two,
  },
  workingText: {
    ...Type.body,
    color: MUTED,
    textAlign: 'center',
  },

  /* ── Estado: Error ── */
  errorContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  errorIconWrap: {
    marginBottom: Spacing.two,
  },
  errorIconOuter: {
    width: 80,
    height: 80,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(168,72,50,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(168,72,50,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorKicker: {
    ...Type.overline,
    color: MUTED,
    letterSpacing: 1.8,
  },
  errorTitle: {
    ...Type.title,
    color: CREAM,
    textAlign: 'center',
  },
  errorMessage: {
    ...Type.body,
    color: MUTED,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: Spacing.two,
  },
  errorActions: {
    width: '100%',
    gap: Spacing.two,
  },

  /* ── Estado: Éxito ── */
  successContent: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.four,
  },
  successHeader: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  successKicker: {
    ...Type.overline,
    color: MUTED,
    letterSpacing: 2,
  },
  successTitle: {
    ...Type.display,
    color: CREAM,
    textAlign: 'center',
  },
  successSubtitle: {
    ...Type.body,
    color: MUTED,
    textAlign: 'center',
    maxWidth: 300,
  },

  /* ── Gran sello coleccionable ── */
  bigStampRing: {
    alignSelf: 'center',
    alignItems: 'center',
    gap: Spacing.two,
  },
  bigStampArcTop: {
    ...Type.overline,
    color: MUTED,
    letterSpacing: 2.5,
  },
  bigStamp: {
    width: 196,
    height: 196,
    borderRadius: Radius.pill,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: `${AMBER}88`,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-6deg' }],
    overflow: 'hidden',
    backgroundColor: 'rgba(185,107,54,0.08)',
  },
  bigStampImage: {
    width: 184,
    height: 184,
    borderRadius: Radius.pill,
  },
  bigStampInner: {
    alignItems: 'center',
    gap: 4,
  },
  bigStampInitials: {
    color: CREAM,
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: 2,
  },
  bigStampLine: {
    width: 48,
    height: 1,
    backgroundColor: `${AMBER}80`,
    marginVertical: 4,
  },
  bigStampCity: {
    ...Type.overline,
    color: AMBER,
    letterSpacing: 3,
  },
  bigStampDate: {
    ...Type.caption,
    color: MUTED,
  },

  /* ── Recibo editorial ── */
  receipt: {
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: LINE,
  },
  receiptHeader: {
    backgroundColor: 'rgba(255,248,240,0.08)',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: LINE,
    alignItems: 'center',
  },
  receiptHeaderText: {
    ...Type.overline,
    color: MUTED,
    letterSpacing: 2,
  },
  receiptBody: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.one,
    backgroundColor: 'rgba(255,248,240,0.06)',
  },
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingVertical: 2,
  },
  receiptDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,248,240,0.1)',
  },
  receiptLabel: {
    ...Type.overline,
    color: MUTED,
    letterSpacing: 1,
  },
  receiptValue: {
    flexShrink: 1,
    ...Type.caption,
    color: CREAM,
    fontWeight: '700',
    textAlign: 'right',
  },
  receiptValueAmber: {
    color: AMBER,
    fontWeight: '800',
  },

  successActions: {
    gap: Spacing.two,
  },
});
