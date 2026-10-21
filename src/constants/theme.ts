/**
 * Kenko's design tokens, inspired by Apple Fitness: pure black (or light grey) backgrounds,
 * solid rounded cards, neon accents and big rounded numbers. Every color has a light and dark
 * value.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#F2F2F7',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E5E5EA',
    textSecondary: '#6E6E73',
    // Brand accent: neon lime. Fills carry dark text; `tintText` is the readable text color.
    tint: '#A8E63A',
    tintEnd: '#C9F56E',
    onTint: '#0B1400',
    tintText: '#4A8A00',
    tintSoft: 'rgba(120,190,20,0.16)',
    move: '#FA114F',
    moveEnd: '#FF5C8A',
    mind: '#00A8D6',
    mindEnd: '#3FD2F5',
    calm: '#6E5CF6',
    calmEnd: '#A08CFF',
    calmSoft: 'rgba(110,92,246,0.14)',
    water: '#007AFF',
    waterEnd: '#4FB4FF',
    waterSoft: 'rgba(0,122,255,0.12)',
    warm: '#F28C00',
    warmEnd: '#FFC531',
    danger: '#FF3B30',
    glass: 'rgba(255,255,255,0.6)',
    glassStrong: 'rgba(255,255,255,0.86)',
    glassBorder: 'rgba(0,0,0,0.06)',
    glassSheen: 'rgba(255,255,255,0.7)',
    shadow: 'rgba(0,0,0,0.06)',
    aurora1: 'rgba(168,230,58,0.22)',
    aurora2: 'rgba(110,92,246,0.22)',
    aurora3: 'rgba(0,168,214,0.18)',
  },
  dark: {
    text: '#FFFFFF',
    background: '#000000',
    backgroundElement: '#1C1C1E',
    backgroundSelected: '#2C2C2E',
    textSecondary: '#8E8E93',
    tint: '#B4F03C',
    tintEnd: '#D4FF6B',
    onTint: '#0B1400',
    tintText: '#B4F03C',
    tintSoft: 'rgba(180,240,60,0.13)',
    move: '#FA114F',
    moveEnd: '#FF5C8A',
    mind: '#00D4FF',
    mindEnd: '#7AE7FF',
    calm: '#7D6BFF',
    calmEnd: '#B39DFF',
    calmSoft: 'rgba(125,107,255,0.16)',
    water: '#0A84FF',
    waterEnd: '#5AC8FA',
    waterSoft: 'rgba(10,132,255,0.16)',
    warm: '#FF9F0A',
    warmEnd: '#FFD60A',
    danger: '#FF453A',
    glass: 'rgba(44,44,46,0.62)',
    glassStrong: 'rgba(44,44,46,0.9)',
    glassBorder: 'rgba(255,255,255,0.08)',
    glassSheen: 'rgba(255,255,255,0.06)',
    shadow: 'rgba(0,0,0,0.5)',
    aurora1: 'rgba(180,240,60,0.14)',
    aurora2: 'rgba(125,107,255,0.30)',
    aurora3: 'rgba(0,212,255,0.16)',
  },
} as const;

/** Accent pairs used for gradients: [start, end]. */
export const Gradients = {
  tint: ['tint', 'tintEnd'],
  move: ['move', 'moveEnd'],
  mind: ['mind', 'mindEnd'],
  calm: ['calm', 'calmEnd'],
  water: ['water', 'waterEnd'],
  warm: ['warm', 'warmEnd'],
} as const satisfies Record<string, readonly [ThemeColor, ThemeColor]>;

export type GradientName = keyof typeof Gradients;

/** Text / icon color that reads well on top of each accent fill. */
export const OnGradient: Record<GradientName, string> = {
  tint: '#0B1400',
  move: '#FFFFFF',
  mind: '#00222B',
  calm: '#FFFFFF',
  water: '#FFFFFF',
  warm: '#2B1600',
};

export const Radius = {
  card: 28,
  control: 999,
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
