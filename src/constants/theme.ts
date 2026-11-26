/**
 * Design tokens for the editorial "specialty coffee" identity.
 *
 * Palette: Linen Beige (paper), Espresso (ink / leather), and Farm Green
 * (the third harmonious color) with toasted amber accents for stamps.
 * Every token exists in both schemes so components can read them safely.
 *
 * All the values are defined in `Colors.light` and `Colors.dark`.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    // Surfaces — linen paper, ivory cards, sand containers
    background: '#F7F2EB',
    backgroundElement: '#FFFFFF',
    backgroundSecondary: '#F0E8DC',
    backgroundSelected: '#EAE0D2',

    // Ink — espresso titles, hazelnut subtitles, faded metadata
    text: '#1C130D',
    textSecondary: '#6E5A4B',
    textMuted: '#9C8A7B',

    // Primary action — espresso fill with cream label
    primary: '#1C130D',
    primaryHover: '#2E1E14',
    onPrimary: '#FFF8F0',

    // Passport leather cover
    passportCover: '#23160D',
    passportBorder: '#483120',
    passportText: '#FFF8F0',
    passportTextMuted: '#D2BEAB',

    // Third color — farm / botanical green
    accent: '#2F4538',
    /** Green for text/icons on `accentSoft` surfaces (readable in both schemes). */
    accentStrong: '#2F4538',
    accentSoft: '#EBF1ED',
    accentBorder: '#C8D9CC',
    onAccent: '#FFF8F0',
    /** Slightly lighter green used for the taster level progress bar. */
    accentProgress: '#3D5C48',

    // Stamp ink — toasted amber / terracotta
    stampAccent: '#B96B36',
    stampAccentSoft: '#FAF2E8',

    // Delimiters, inputs and states
    border: '#E2D6C5',
    borderFocus: '#1C130D',
    inputBackground: '#F9F6F0',
    success: '#2F4538',
    danger: '#A84832',
  },
  dark: {
    background: '#140E0A',
    backgroundElement: '#211710',
    backgroundSecondary: '#2C1F17',
    backgroundSelected: '#3A2A20',

    text: '#F7F0E8',
    textSecondary: '#BCAFA3',
    textMuted: '#8C7E72',

    primary: '#E8D2BD',
    primaryHover: '#D9BEA4',
    onPrimary: '#1C130D',

    passportCover: '#1A110B',
    passportBorder: '#3F2B1D',
    passportText: '#F7F0E8',
    passportTextMuted: '#B8A89A',

    accent: '#5E856E',
    accentStrong: '#B9D3C3',
    accentSoft: '#213327',
    accentBorder: '#355340',
    onAccent: '#0E1711',
    accentProgress: '#4E715D',

    stampAccent: '#D98A52',
    stampAccentSoft: '#332115',

    border: '#33251B',
    borderFocus: '#E8D2BD',
    inputBackground: '#1A120C',
    success: '#6AA87E',
    danger: '#E58570',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/**
 * Typographic families.
 *
 * `Creato Display` is the brand typeface. The app ships with a fluid native
 * fallback so the UI renders without extra assets:
 *  - iOS: `system-ui` (SF Pro) with the editorial weights of the scale below.
 *  - Android: `sans-serif` (Roboto) with the same hierarchy.
 *  - Web: `--font-display` from `global.css`, which already lists
 *    `'Creato Display'` first.
 *
 * To use the real typeface, drop `CreatoDisplay-*.otf` into `assets/fonts/`,
 * load them with `expo-font` in `src/app/_layout.tsx` and point `display` /
 * `displayBold` at the loaded family names. Nothing else needs to change.
 */
export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
    /** Editorial headings / display text */
    display: 'system-ui',
  },
  android: {
    sans: 'sans-serif',
    serif: 'serif',
    rounded: 'sans-serif',
    mono: 'monospace',
    display: 'sans-serif',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
    display: 'normal',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-display)',
    mono: 'var(--font-mono)',
    display: 'var(--font-display)',
  },
});

/**
 * Editorial type scale. Spread one of these objects into a `StyleSheet` entry
 * (or inline style) to keep the hierarchy consistent across screens.
 */
export const Type = {
  /** Hero headlines and passport covers. */
  display: {
    fontFamily: Fonts.display,
    fontSize: 34,
    lineHeight: 39,
    fontWeight: '800',
    letterSpacing: -1,
  },
  /** Screen titles. */
  title: {
    fontFamily: Fonts.display,
    fontSize: 27,
    lineHeight: 32,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  /** Card titles and section headings. */
  heading: {
    fontFamily: Fonts.display,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  /** Numeric highlights (metrics, counters). */
  number: {
    fontFamily: Fonts.display,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  /** Lead paragraphs. */
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    letterSpacing: 0,
  },
  /** Default reading text. */
  body: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400',
    letterSpacing: 0,
  },
  /** Emphasized reading text. */
  bodyStrong: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    letterSpacing: 0,
  },
  /** Buttons and small emphasis. */
  label: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  /** Tracked uppercase labels (field labels, overlines). */
  overline: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  /** Metadata and captions. */
  caption: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 26,
  pill: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

/** Sobriety-first espresso leather gradient used for hero surfaces. */
export const CoffeeGradient = ['#1C130D', '#23160D', '#3D2717'] as const;

/** Cream / muted tones for text and details over espresso surfaces. */
export const OnEspresso = {
  text: '#FFF8F0',
  muted: '#D2BEAB',
  faint: 'rgba(255,248,240,0.16)',
  line: 'rgba(255,248,240,0.22)',
} as const;
