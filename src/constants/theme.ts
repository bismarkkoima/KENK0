/**
 * Kenko's design tokens, inspired by Apple Fitness: pure black (or light grey) backgrounds,
 * solid rounded cards, neon accents and big rounded numbers. Every color has a light and dark
 * value.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#06140C',
    background: '#F2F7F4',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E2EDE7',
    textSecondary: '#56695E',
    // Brand accent: vivid green. Fills carry dark text; `tintText` is the readable text color.
    tint: '#16C468',
    tintEnd: '#5BEA9E',
    onTint: '#00170A',
    tintText: '#08853F',
    tintSoft: 'rgba(22,196,104,0.14)',
    // Timers and clocks.
    sky: '#0EA5E9',
    skyEnd: '#7DD3FC',
    skyText: '#0378B5',
    move: '#FF3D68',
    moveEnd: '#FF8AA4',
    mind: '#06B6D4',
    mindEnd: '#67E8F9',
    calm: '#7C5CFF',
    calmEnd: '#B4A2FF',
    calmSoft: 'rgba(124,92,255,0.14)',
    water: '#2F7BFF',
    waterEnd: '#7AB4FF',
    waterSoft: 'rgba(47,123,255,0.12)',
    warm: '#FF9F1A',
    warmEnd: '#FFD25C',
    gold: '#F5B301',
    goldEnd: '#FFE27A',
    danger: '#F0303E',
    glass: 'rgba(255,255,255,0.6)',
    glassStrong: 'rgba(255,255,255,0.86)',
    glassBorder: 'rgba(6,20,12,0.06)',
    glassSheen: 'rgba(255,255,255,0.7)',
    shadow: 'rgba(6,40,20,0.08)',
    aurora1: 'rgba(22,196,104,0.20)',
    aurora2: 'rgba(14,165,233,0.18)',
    aurora3: 'rgba(124,92,255,0.14)',
  },
  // Dark mode: black and deep greens, with bright greens and light-blue timers on top.
  dark: {
    text: '#F1FFF6',
    background: '#010503',
    backgroundElement: '#0A1A11',
    backgroundSelected: '#13291C',
    textSecondary: '#8AA595',
    tint: '#1EE07A',
    tintEnd: '#8BFFC0',
    onTint: '#00170A',
    tintText: '#39F08D',
    tintSoft: 'rgba(30,224,122,0.14)',
    sky: '#5CC8FF',
    skyEnd: '#BDE9FF',
    skyText: '#8AD8FF',
    move: '#FF4D74',
    moveEnd: '#FF9DB2',
    mind: '#22D3EE',
    mindEnd: '#A5F3FC',
    calm: '#8B6CFF',
    calmEnd: '#C6B6FF',
    calmSoft: 'rgba(139,108,255,0.18)',
    water: '#3B8BFF',
    waterEnd: '#93C5FF',
    waterSoft: 'rgba(59,139,255,0.18)',
    warm: '#FFAA2B',
    warmEnd: '#FFDC73',
    gold: '#FFC21A',
    goldEnd: '#FFEA94',
    danger: '#FF4D57',
    glass: 'rgba(10,26,17,0.62)',
    glassStrong: 'rgba(10,26,17,0.9)',
    glassBorder: 'rgba(140,255,190,0.10)',
    glassSheen: 'rgba(255,255,255,0.06)',
    shadow: 'rgba(0,0,0,0.6)',
    aurora1: 'rgba(30,224,122,0.18)',
    aurora2: 'rgba(92,200,255,0.16)',
    aurora3: 'rgba(16,80,48,0.45)',
  },
} as const;

/** Accent pairs used for gradients: [start, end]. */
export const Gradients = {
  tint: ['tint', 'tintEnd'],
  sky: ['sky', 'skyEnd'],
  move: ['move', 'moveEnd'],
  mind: ['mind', 'mindEnd'],
  calm: ['calm', 'calmEnd'],
  water: ['water', 'waterEnd'],
  warm: ['warm', 'warmEnd'],
  gold: ['gold', 'goldEnd'],
} as const satisfies Record<string, readonly [ThemeColor, ThemeColor]>;

export type GradientName = keyof typeof Gradients;

/** Text / icon color that reads well on top of each accent fill. */
export const OnGradient: Record<GradientName, string> = {
  tint: '#00170A',
  sky: '#032536',
  move: '#FFFFFF',
  mind: '#032B33',
  calm: '#FFFFFF',
  water: '#FFFFFF',
  warm: '#2B1600',
  gold: '#2B1D00',
};

/** Readable text color for an accent (bright fills like tint and sky need a deeper shade). */
export function accentText(name: GradientName): ThemeColor {
  if (name === 'tint') return 'tintText';
  if (name === 'sky') return 'skyText';
  return Gradients[name][0];
}

export const Radius = {
  card: 28,
  control: 999,
  pill: 999,
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/**
 * Google Fonts: DM Sans for the interface and numbers, Source Serif 4 for quotes and greetings.
 * Use these names as `fontFamily`; `ThemedText` swaps in the file for the requested weight.
 */
export const Fonts = {
  sans: 'DMSans',
  serif: 'SourceSerif4',
  /** Kept for older call sites; same as `sans`. */
  rounded: 'DMSans',
  mono: Platform.select({ ios: 'ui-monospace', default: 'monospace' }),
} as const;

/** Loaded font files per family and weight (see the root layout). */
export const FontFiles = {
  DMSans: {
    300: 'DMSans_300Light',
    400: 'DMSans_400Regular',
    500: 'DMSans_500Medium',
    600: 'DMSans_600SemiBold',
    700: 'DMSans_700Bold',
    800: 'DMSans_800ExtraBold',
    900: 'DMSans_900Black',
  },
  SourceSerif4: {
    300: 'SourceSerif4_300Light',
    400: 'SourceSerif4_400Regular',
    500: 'SourceSerif4_500Medium',
    600: 'SourceSerif4_600SemiBold',
    700: 'SourceSerif4_700Bold',
    800: 'SourceSerif4_700Bold',
    900: 'SourceSerif4_700Bold',
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

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
/** On web, native tabs render as a bar along the top of the page. */
export const WebTabBarHeight = Platform.OS === 'web' ? 56 : 0;
export const MaxContentWidth = 800;
