import type { PropsWithChildren, ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Icon, type AppIcon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { linearGradient, radialGlow, withAlpha } from '@/lib/style';

/**
 * Category colors for home tiles. Like a health app's dashboard, each area of health keeps the
 * same color everywhere, in light and dark mode alike, so people learn to find it at a glance.
 */
export const TileColors = {
  energy: '#2F63D8',
  activity: '#0E7A60',
  fitness: '#17977A',
  cardio: '#0F64B0',
  heart: '#B565C9',
  vitals: '#0AA5C8',
  hearing: '#A8735A',
  food: '#D9662A',
  water: '#1F7FE0',
  mood: '#C8649A',
  mind: '#2E2C8F',
  rewards: '#B9800F',
} as const;

export type TileColor = keyof typeof TileColors | 'surface';

const GAP = 12;
const SIDE_PADDING = Spacing.three * 2;

/** Width of a half-width tile for the current screen. */
export function useTileWidth() {
  const { width } = useWindowDimensions();
  const content = Math.min(width - SIDE_PADDING, MaxContentWidth);
  return { half: (content - GAP) / 2, full: content };
}

export function TileGrid({ children }: PropsWithChildren) {
  return <View style={styles.grid}>{children}</View>;
}

/**
 * A dashboard tile: a colored panel with a small title at the top, supporting text at the
 * bottom and an illustration in the corner. `surface` tiles follow the theme (graphite in dark
 * mode, white in light) and are used for number-heavy tiles like steps.
 */
export function Tile({
  title,
  body,
  color,
  wide = false,
  height = 176,
  art,
  onPress,
  accessibilityLabel,
  children,
  style,
}: PropsWithChildren<{
  title: string;
  body?: string;
  color: TileColor;
  wide?: boolean;
  height?: number | 'auto';
  art?: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}>) {
  const theme = useTheme();
  const scheme = useColorScheme();
  const { half, full } = useTileWidth();
  const surface = color === 'surface';
  const base = surface ? (scheme === 'dark' ? '#1A1F1D' : '#FFFFFF') : TileColors[color];
  const text = surface ? theme.text : '#FFFFFF';
  const sub = surface ? theme.textSecondary : 'rgba(255,255,255,0.88)';

  const content = (
    <View
      style={[
        styles.tile,
        {
          width: wide ? full : half,
          minHeight: height === 'auto' ? undefined : height,
          backgroundColor: base,
          boxShadow:
            scheme === 'dark'
              ? '0 10px 24px rgba(0,0,0,0.45)'
              : `0 8px 20px ${surface ? 'rgba(10,40,25,0.08)' : withAlpha(base, 0.3)}`,
        },
        // Colored tiles get a soft top-left light for a bit of depth.
        !surface && linearGradient('rgba(255,255,255,0.10)', 'rgba(255,255,255,0)', 160),
        style,
      ]}>
      {art && <View style={styles.art}>{art}</View>}
      <ThemedText style={[styles.title, { color: text }]}>{title}</ThemedText>
      <View style={styles.content}>{children}</View>
      {body && <ThemedText style={[styles.body, { color: sub }]}>{body}</ThemedText>}
    </View>
  );

  if (!onPress) return content;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      onPress={onPress}
      style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.97 : 1 }] })}>
      {content}
    </Pressable>
  );
}

/** A glossy 3D sphere with an icon, peeking in from the tile's corner. */
export function OrbArt({
  icon,
  from,
  to,
  size = 92,
}: {
  icon: AppIcon;
  from: string;
  to: string;
  size?: number;
}) {
  return (
    <View style={{ width: size + 24, height: size + 24 }}>
      <View
        style={[StyleSheet.absoluteFill, { borderRadius: 999 }, radialGlow(withAlpha(from, 0.55))]}
      />
      <View
        style={[
          styles.orb,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            boxShadow: `0 8px 18px ${withAlpha(from, 0.5)}, inset 0 -6px 14px rgba(0,0,0,0.25), inset 0 3px 2px rgba(255,255,255,0.5)`,
          },
          linearGradient(to, from, 160),
        ]}>
        <View
          style={[
            styles.orbGloss,
            linearGradient('rgba(255,255,255,0.55)', 'rgba(255,255,255,0)', 180),
          ]}
        />
        <Icon name={icon} size={size * 0.46} color="#FFFFFF" />
      </View>
    </View>
  );
}

/** Concentric translucent rings around an icon — like a sound wave or a gauge. */
export function RingsArt({
  icon,
  color,
  size = 120,
}: {
  icon: AppIcon;
  color: string;
  size?: number;
}) {
  return (
    <View style={[styles.rings, { width: size, height: size }]}>
      {[1, 0.74, 0.5].map((f) => (
        <View
          key={f}
          style={{
            position: 'absolute',
            width: size * f,
            height: size * f,
            borderRadius: size,
            backgroundColor: withAlpha(color, 0.18),
            borderWidth: 1,
            borderColor: withAlpha('#FFFFFF', 0.12),
          }}
        />
      ))}
      <View
        style={[
          styles.ringCore,
          { width: size * 0.36, height: size * 0.36, borderRadius: size },
          linearGradient(withAlpha('#FFFFFF', 0.95), withAlpha(color, 0.9), 160),
        ]}>
        <Icon name={icon} size={size * 0.2} color={color} />
      </View>
    </View>
  );
}

/** A small night sky with a moon — for sleep, meditation and calm. */
export function NightArt() {
  const stars = [
    [8, 30, 2],
    [40, 12, 1.5],
    [70, 52, 2],
    [18, 74, 1.5],
    [96, 24, 2.5],
    [110, 70, 1.5],
    [58, 90, 2],
  ];
  return (
    <View style={styles.night}>
      {stars.map(([x, y, r], i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: r * 2,
            height: r * 2,
            borderRadius: r,
            backgroundColor: 'rgba(255,255,255,0.75)',
          }}
        />
      ))}
      <View style={[styles.moon, linearGradient('#B9A8FF', '#6D4CF0', 160)]}>
        <View style={[styles.moonCut]} />
      </View>
      <Icon name={{ mci: 'star-four-points' }} size={22} color="#D9D2FF" />
    </View>
  );
}

/** White pill button for use inside colored tiles. */
export function TileButton({
  label,
  icon,
  onPress,
  color = '#FFFFFF',
}: {
  label: string;
  icon?: AppIcon;
  onPress: () => void;
  color?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.tileButton,
        { backgroundColor: withAlpha('#FFFFFF', 0.2), opacity: pressed ? 0.7 : 1 },
      ]}>
      {icon && <Icon name={icon} size={16} color={color} />}
      <ThemedText type="smallBold" style={{ color }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  tile: {
    borderRadius: 26,
    padding: Spacing.three + 2,
    overflow: 'hidden',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  art: {
    position: 'absolute',
    top: -14,
    right: -14,
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: 500,
    maxWidth: '65%',
  },
  content: {
    gap: Spacing.one,
  },
  body: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: 400,
  },
  orb: {
    position: 'absolute',
    top: 12,
    left: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  orbGloss: {
    position: 'absolute',
    top: 0,
    left: '12%',
    right: '12%',
    height: '48%',
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
  },
  rings: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCore: {
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
  },
  night: {
    width: 140,
    height: 120,
    alignItems: 'flex-end',
    paddingTop: 18,
    paddingRight: 22,
  },
  moon: {
    position: 'absolute',
    top: 26,
    right: 30,
    width: 70,
    height: 70,
    borderRadius: 35,
    boxShadow: '0 0 30px rgba(140,110,255,0.6)',
    overflow: 'hidden',
  },
  moonCut: {
    position: 'absolute',
    top: -14,
    right: -18,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: TileColors.mind,
  },
  tileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
});
