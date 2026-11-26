/**
 * Normaliza las fechas de la API antes de parsearlas.
 *
 * Los objetos recién creados (`POST`) llegan con `Z`, pero los leídos de MySQL
 * (`GET`) llegan sin zona (`2026-11-18T21:16:04.512`). Sin el sufijo, el
 * runtime las interpreta como hora local y las fechas se corren varias horas.
 * Los `DateTimeOffset` (fechas del QR) siempre traen offset y se usan tal cual.
 */
export function parseApiDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }
  const normalized = /([zZ]|[+-]\d{2}:?\d{2})$/.test(value) ? value : `${value}Z`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  if (parts.length === 0) {
    return 'CP';
  }
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
}

export function formatMonthYear(iso: string) {
  const date = parseApiDate(iso);
  if (!date) {
    return '';
  }
  return date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
}

export function formatStampDate(iso: string) {
  const date = parseApiDate(iso);
  if (!date) {
    return '—';
  }
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }).replace('.', '');
}

export function formatVisitDate(iso: string) {
  const date = parseApiDate(iso);
  if (!date) {
    return '—';
  }
  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
