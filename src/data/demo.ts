import type { IconName } from '@/components/ui/icon';

export const demoUser = {
  name: 'Alex Rivera',
  firstName: 'Alex',
  initials: 'AR',
  email: 'alex@coffeepassport.app',
  memberSince: 'Marzo 2024',
  passportNumber: 'CP-2026-0142',
  level: 'Catador explorador',
  points: 1240,
  nextLevelPoints: 1800,
  city: 'Ciudad de México',
} as const;

export type Stamp = {
  id: string;
  name: string;
  city: string;
  date: string;
  initials: string;
  /** Imagen del sello tal como la guardó la API (`sello.imagenUrl`), ya absoluta. */
  imageUrl?: string | null;
  /** Método de extracción degustado, si la visita lo registró (V60, Espresso…). */
  method?: string;
  locked?: boolean;
};

export const stamps: Stamp[] = [
  { id: 's1', name: 'Café Origen', city: 'CDMX', date: '12 Oct', initials: 'CO', method: 'V60' },
  { id: 's2', name: 'Tostado Lento', city: 'CDMX', date: '04 Oct', initials: 'TL', method: 'Geisha' },
  { id: 's3', name: 'La Molida', city: 'CDMX', date: '28 Sep', initials: 'LM', method: 'Espresso' },
  { id: 's4', name: 'Grano Claro', city: 'CDMX', date: '19 Sep', initials: 'GC', method: 'Chemex' },
  { id: 's5', name: 'Cafetería Nube', city: 'Puebla', date: '02 Sep', initials: 'CN', method: 'Flat White' },
  { id: 's6', name: 'Raíz Café', city: 'Oaxaca', date: '21 Ago', initials: 'RC', method: 'Oaxaca' },
  { id: 's7', name: 'Bruma Coffee', city: 'CDMX', date: '10 Ago', initials: 'BC', method: 'Cold Brew' },
  { id: 's8', name: 'Casa Semilla', city: 'Querétaro', date: '27 Jul', initials: 'CS', method: 'Aeropress' },
  { id: 's9', name: 'Próxima visita', city: '', date: '', initials: '', locked: true },
  { id: 's10', name: 'Próxima visita', city: '', date: '', initials: '', locked: true },
];

export type Visit = {
  id: string;
  cafeteria: string;
  area: string;
  date: string;
  rating: number;
  note: string;
  initials: string;
};

export const recentVisits: Visit[] = [
  {
    id: 'v1',
    cafeteria: 'Café Origen',
    area: 'Roma Norte',
    date: '12 Oct 2026',
    rating: 5,
    note: 'El mejor filtrado que he probado en la zona. El pan de masa madre está increíble.',
    initials: 'CO',
  },
  {
    id: 'v2',
    cafeteria: 'Tostado Lento',
    area: 'Condesa',
    date: '04 Oct 2026',
    rating: 4,
    note: 'Muy buen latte y terraza tranquila. La atención fue un poco lenta.',
    initials: 'TL',
  },
  {
    id: 'v3',
    cafeteria: 'La Molida',
    area: 'Juárez',
    date: '28 Sep 2026',
    rating: 5,
    note: 'Probaron un geisha increíble. Definitivamente vuelvo por la barra de métodos.',
    initials: 'LM',
  },
];

export type MenuItem = {
  id: string;
  label: string;
  caption?: string;
  icon: IconName;
  badge?: string;
};

export const accountMenu: MenuItem[] = [
  {
    id: 'favorites',
    label: 'Cafeterías favoritas',
    caption: '6 guardadas',
    icon: 'heart',
  },
  {
    id: 'history',
    label: 'Historial de visitas',
    caption: '12 sellos registrados',
    icon: 'time',
  },
  {
    id: 'payments',
    label: 'Métodos de pago',
    caption: 'Visa •••• 4242',
    icon: 'card',
  },
  {
    id: 'notifications',
    label: 'Notificaciones',
    caption: 'Retos y nuevas cafeterías',
    icon: 'notifications',
    badge: '3',
  },
];

export const helpMenu: MenuItem[] = [
  {
    id: 'help',
    label: 'Centro de ayuda',
    icon: 'help-circle',
  },
  {
    id: 'privacy',
    label: 'Privacidad y datos',
    icon: 'lock-closed',
  },
];

export const discoveryStats = [
  { id: 'stamps', label: 'Sellos', value: '12' },
  { id: 'cafes', label: 'Cafeterías', value: '8' },
  { id: 'cities', label: 'Ciudades', value: '3' },
] as const;
