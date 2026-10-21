/**
 * Kenko's design tokens. Surfaces are translucent "glass" layered over a soft aurora
 * background; accents are two-stop gradients. Every color has a light and dark value.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0B1220',
    background: '#EEF2F8',
    backgroundElement: 'rgba(255,255,255,0.62)',
    backgroundSelected: 'rgba(15,23,42,0.07)',
    textSecondary: '#5B6475',
    tint: '#10A877',
    tintEnd: '#2CC6B8',
    tintSoft: 'rgba(16,168,119,0.14)',
    calm: '#7464F0',
    calmEnd: '#B37AF6',
    calmSoft: 'rgba(116,100,240,0.14)',
    water: '#2F80ED',
    waterEnd: '#56CCF2',
    waterSoft: 'rgba(47,128,237,0.13)',
    warm: '#F2994A',
    warmEnd: '#F2C94C',
    danger: '#E5484D',
    // Glass surfaces
    glass: 'rgba(255,255,255,0.55)',
    glassStrong: 'rgba(255,255,255,0.8)',
    glassBorder: 'rgba(255,255,255,0.85)',
    glassSheen: 'rgba(255,255,255,0.7)',
    shadow: 'rgba(31,41,73,0.12)',
    // Ambient background glows
    aurora1: 'rgba(44,198,160,0.30)',
    aurora2: 'rgba(140,120,245,0.28)',
    aurora3: 'rgba(86,170,242,0.24)',
  },
  // Dark accents stay saturated so white text on gradient fills keeps its contrast.
  dark: {
    text: '#F4F6FB',
    background: '#060912',
    backgroundElement: 'rgba(255,255,255,0.07)',
    backgroundSelected: 'rgba(255,255,255,0.10)',
    textSecondary: '#9AA3B5',
    tint: '#10B981',
    tintEnd: '#14B8A6',
    tintSoft: 'rgba(52,211,153,0.16)',
    calm: '#7C6CF5',
    calmEnd: '#B07CF7',
    calmSoft: 'rgba(155,140,255,0.16)',
    water: '#3B82F6',
    waterEnd: '#22D3EE',
    waterSoft: 'rgba(77,163,255,0.16)',
    warm: '#F59E0B',
    warmEnd: '#FBBF24',
    danger: '#FF6B6B',
    glass: 'rgba(255,255,255,0.06)',
    glassStrong: 'rgba(255,255,255,0.12)',
    glassBorder: 'rgba(255,255,255,0.12)',
    glassSheen: 'rgba(255,255,255,0.10)',
    shadow: 'rgba(0,0,0,0.45)',
    aurora1: 'rgba(16,185,129,0.22)',
    aurora2: 'rgba(124,92,255,0.30)',
    aurora3: 'rgba(37,99,235,0.22)',
  },
} as const;

/** Accent pairs used for gradients: [start, end]. */
export const Gradients = {
  tint: ['tint', 'tintEnd'],
  calm: ['calm', 'calmEnd'],
  water: ['water', 'waterEnd'],
  warm: ['warm', 'warmEnd'],
} as const satisfies Record<string, readonly [ThemeColor, ThemeColor]>;

export type GradientName = keyof typeof Gradients;

export const Radius = {
  card: 24,
  control: 16,
  pill: 999,
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

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
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
/** On web, native tabs render as a bar along the top of the page. */
export const WebTabBarHeight = Platform.OS === 'web' ? 56 : 0;
export const MaxContentWidth = 800;
