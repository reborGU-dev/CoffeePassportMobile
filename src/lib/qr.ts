/**
 * El QR de una cafetería ya no es un identificador legible: es un token firmado
 * con esta forma (ver `QR-SELLOS-E-IMAGENES.md`):
 *
 *   CP2.<cafeteriaId>.<version>.<emitidoUnix>.<expiraUnix>.<firmaHMAC>
 *
 * Ejemplo:
 *   CP2.1.1.1763500000.1766092000.4_YETU3hCfPPh3vsGvOZVR4v0Cbul1evxqRlQKQKxyE
 *
 * El cliente NO debe interpretarlo, recortarlo ni reconstruirlo: se envía tal
 * cual llega a `POST /api/sellos/qr`, que valida la firma y la caducidad.
 * Aquí solo se comprueba el prefijo para dar retroalimentación inmediata si el
 * usuario escaneó un QR ajeno (menú, póster, etc.).
 */
export const STAMP_QR_PREFIX = 'CP2.';

export function normalizeQrText(value: string): string {
  return value.trim();
}

export function looksLikeStampQr(value: string): boolean {
  return normalizeQrText(value).startsWith(STAMP_QR_PREFIX);
}
