import { BlurView } from 'expo-blur';
import { useId, type PropsWithChildren, type ReactNode } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, G, LinearGradient, Stop } from 'react-native-svg';

import { Icon, type AppIcon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import {
  BottomTabInset,
  FontFiles,
  Gradients,
  MaxContentWidth,
  OnGradient,
  Radius,
  Spacing,
  WebTabBarHeight,
  type GradientName,
  type ThemeColor,
} from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { linearGradient, radialGlow, withAlpha } from '@/lib/style';

export type IconName = AppIcon;

/**
 * Real backdrop blur on iOS and web. Android's blur needs a dedicated target view and is costly
 * in scrolling lists, so there glass falls back to a denser translucent fill.
 */
const SUPPORTS_BLUR = Platform.OS === 'ios' || Platform.OS === 'web';

/** Soft colored glows behind full-screen experiences like the meditation player. */
export function AuroraBackground({ variant = 'default' }: { variant?: 'default' | 'calm' }) {
  const theme = useTheme();
  const [a, b, c] =
    variant === 'calm'
      ? [theme.aurora2, theme.calmSoft, theme.aurora3]
      : [theme.aurora1, theme.aurora2, theme.aurora3];
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { backgroundColor: theme.background }]}>
      <View style={[styles.blob, styles.blobTopLeft, radialGlow(a)]} />
      <View style={[styles.blob, styles.blobRight, radialGlow(b)]} />
      <View style={[styles.blob, styles.blobBottom, radialGlow(c)]} />
    </View>
  );
}

/** Scrollable page with a large rounded title, safe-area padding and a capped width. */
export function Screen({
  children,
  title,
  subtitle,
  right,
  tabs = true,
}: PropsWithChildren<{ title?: string; subtitle?: string; right?: ReactNode; tabs?: boolean }>) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[
        styles.screenContent,
        {
          // Tab screens draw under the status bar (and, on web, under the top tab bar);
          // stack screens already sit below a header.
          paddingTop: (tabs ? insets.top + WebTabBarHeight : 0) + Spacing.three,
          paddingBottom: insets.bottom + (tabs ? BottomTabInset : 0) + Spacing.six,
        },
      ]}
      keyboardShouldPersistTaps="handled">
      <View style={styles.column}>
        {title && (
          <View style={styles.header}>
            <View style={styles.headerText}>
              {subtitle && (
                <ThemedText type="smallBold" themeColor="textSecondary">
                  {subtitle}
                </ThemedText>
              )}
              <ThemedText type="subtitle">{title}</ThemedText>
            </View>
            {right && <View style={styles.headerRight}>{right}</View>}
          </View>
        )}
        {children}
      </View>
    </ScrollView>
  );
}

/** Frosted-glass surface: blur + translucent fill + light sheen along the top edge. */
export function Glass({
  children,
  style,
  radius = Radius.card,
  strong = false,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle>; radius?: number; strong?: boolean }>) {
  const theme = useTheme();
  const scheme = useColorScheme();
  const fill = strong || !SUPPORTS_BLUR ? theme.glassStrong : theme.glass;

  return (
    <View style={[styles.glass, { borderRadius: radius, borderColor: theme.glassBorder }, style]}>
      <View style={[StyleSheet.absoluteFill, styles.clip, { borderRadius: radius }]}>
        {SUPPORTS_BLUR && (
          <BlurView
            intensity={40}
            tint={scheme === 'dark' ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        )}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: fill }]} />
        <View style={[styles.sheen, linearGradient(theme.glassSheen, 'transparent', 180)]} />
      </View>
      {children}
    </View>
  );
}

/**
 * Solid rounded card. Pass `accent` for the Fitness-style tinted card, whose background is a
 * dim wash of the accent color.
 */
export function Card({
  children,
  style,
  accent,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle>; accent?: GradientName }>) {
  const theme = useTheme();
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const background = accent
    ? withAlpha(theme[Gradients[accent][0]], dark ? 0.14 : 0.13)
    : theme.backgroundElement;
  // A lit top edge and a soft drop shadow lift the card off the background.
  const edge = accent
    ? withAlpha(theme[Gradients[accent][0]], dark ? 0.35 : 0.25)
    : dark
      ? 'rgba(140,255,190,0.10)'
      : 'rgba(255,255,255,1)';
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: background,
          borderTopColor: edge,
          borderTopWidth: 1,
          boxShadow: dark ? '0 10px 24px rgba(0,0,0,0.55)' : `0 8px 22px ${theme.shadow}`,
        },
        style,
      ]}>
      {children}
    </View>
  );
}

/** Card heading row: bold rounded title with an optional trailing element. */
export function CardTitle({ children, right }: PropsWithChildren<{ right?: ReactNode }>) {
  return (
    <View style={styles.cardTitle}>
      <ThemedText type="heading" style={styles.flexShrink}>
        {children}
      </ThemedText>
      {right}
    </View>
  );
}

export function SectionTitle({ children, right }: PropsWithChildren<{ right?: ReactNode }>) {
  return (
    <View style={styles.sectionTitle}>
      <ThemedText type="heading">{children}</ThemedText>
      {right}
    </View>
  );
}

/**
 * A view filled with one of the accent gradients. `raised` gives it a glossy, 3D look: a light
 * sheen across the top, a soft inner shadow at the bottom and a colored glow underneath.
 */
export function GradientFill({
  name,
  style,
  angle = 135,
  raised = false,
  children,
}: PropsWithChildren<{
  name: GradientName;
  style?: StyleProp<ViewStyle>;
  angle?: number;
  raised?: boolean;
}>) {
  const theme = useTheme();
  const [from, to] = Gradients[name];
  if (!raised) {
    return <View style={[linearGradient(theme[from], theme[to], angle), style]}>{children}</View>;
  }
  return (
    <View
      style={[
        linearGradient(theme[to], theme[from], 180),
        {
          boxShadow: `0 6px 18px ${withAlpha(theme[from], 0.45)}, inset 0 -3px 8px rgba(0,0,0,0.22), inset 0 2px 1px rgba(255,255,255,0.45)`,
        },
        style,
      ]}>
      <View
        pointerEvents="none"
        style={[styles.gloss, linearGradient('rgba(255,255,255,0.42)', 'rgba(255,255,255,0)', 180)]}
      />
      {children}
    </View>
  );
}

export function ProgressBar({
  value,
  max,
  color = 'tint',
  height = 8,
  warnOver = false,
}: {
  value: number;
  max: number;
  color?: GradientName;
  height?: number;
  /** Turn red past the goal — for limits like calories, not targets like water. */
  warnOver?: boolean;
}) {
  const theme = useTheme();
  const ratio = max > 0 ? Math.min(value / max, 1) : 0;
  const over = warnOver && value > max;
  return (
    <View
      style={[
        styles.track,
        {
          height,
          borderRadius: height / 2,
          backgroundColor: withAlpha(theme[Gradients[color][0]], 0.18),
        },
      ]}>
      {over ? (
        <View style={[styles.barFill, { width: '100%', backgroundColor: theme.danger }]} />
      ) : (
        <GradientFill
          name={color}
          angle={90}
          style={[styles.barFill, { width: `${ratio * 100}%`, borderRadius: height / 2 }]}
        />
      )}
    </View>
  );
}

type RingSpec = { progress: number; color: GradientName; warnOver?: boolean };

/** Circular progress ring with a gradient stroke over a dim track of the same color. */
export function Ring({
  size,
  stroke = 12,
  progress,
  color = 'tint',
  warnOver = false,
  children,
}: PropsWithChildren<{ size: number; stroke?: number } & RingSpec>) {
  return (
    <Rings size={size} stroke={stroke} rings={[{ progress, color, warnOver }]}>
      {children}
    </Rings>
  );
}

/** Concentric rings, outermost first — like Apple's Activity rings. */
export function Rings({
  size,
  stroke = 12,
  gap = 3,
  rings,
  children,
}: PropsWithChildren<{ size: number; stroke?: number; gap?: number; rings: RingSpec[] }>) {
  const theme = useTheme();
  // SVG gradient ids are document-wide on web, so each ring needs its own.
  const baseId = `ring-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`;
  const c = size / 2;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={styles.ringSvg}>
        <Defs>
          {rings.map((ring, i) => {
            const [from, to] = Gradients[ring.color];
            const over = ring.warnOver && ring.progress > 1;
            return (
              <LinearGradient key={i} id={`${baseId}-${i}`} x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={over ? theme.danger : theme[from]} />
                <Stop offset="1" stopColor={over ? theme.danger : theme[to]} />
              </LinearGradient>
            );
          })}
        </Defs>
        {rings.map((ring, i) => {
          const r = c - stroke / 2 - i * (stroke + gap);
          const circumference = 2 * Math.PI * r;
          const clamped = Math.max(0, Math.min(ring.progress, 1));
          return (
            <G key={i}>
              <Circle
                cx={c}
                cy={c}
                r={r}
                stroke={withAlpha(theme[Gradients[ring.color][0]], 0.22)}
                strokeWidth={stroke}
                fill="none"
              />
              {clamped > 0 && (
                // Soft glow under the progress arc.
                <Circle
                  cx={c}
                  cy={c}
                  r={r}
                  stroke={theme[Gradients[ring.color][0]]}
                  strokeOpacity={0.28}
                  strokeWidth={stroke * 1.7}
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset={circumference * (1 - clamped)}
                  transform={`rotate(-90 ${c} ${c})`}
                />
              )}
              {clamped > 0 && (
                <Circle
                  cx={c}
                  cy={c}
                  r={r}
                  stroke={`url(#${baseId}-${i})`}
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset={circumference * (1 - clamped)}
                  transform={`rotate(-90 ${c} ${c})`}
                />
              )}
            </G>
          );
        })}
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>{children}</View>
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  color = 'tint',
  disabled,
  icon,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  color?: GradientName;
  disabled?: boolean;
  icon?: IconName;
}) {
  const theme = useTheme();
  const primary = variant === 'primary';
  const textColor = primary ? OnGradient[color] : theme.text;
  const content = (
    <View style={styles.buttonContent}>
      {icon && <Icon name={icon} size={18} color={textColor} />}
      <ThemedText type="smallBold" style={[styles.buttonText, { color: textColor }]}>
        {label}
      </ThemedText>
    </View>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        { opacity: disabled ? 0.4 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
      ]}>
      {primary ? (
        <GradientFill name={color} raised style={styles.button}>
          {content}
        </GradientFill>
      ) : (
        <View style={[styles.button, { backgroundColor: theme.backgroundSelected }]}>
          {content}
        </View>
      )}
    </Pressable>
  );
}

/** Round button holding a single icon, like the Fitness header buttons. */
export function IconButton({
  icon,
  label,
  onPress,
  size = 48,
  color,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  size?: number;
  color?: ThemeColor;
}) {
  const theme = useTheme();
  const scheme = useColorScheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.center,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: scheme === 'dark' ? theme.backgroundSelected : theme.backgroundElement,
          transform: [{ scale: pressed ? 0.92 : 1 }],
        },
        scheme !== 'dark' && { boxShadow: `0 2px 8px ${theme.shadow}` },
      ]}>
      <Icon name={icon} size={size * 0.44} color={theme[color ?? 'text']} />
    </Pressable>
  );
}

/** Big round accent button with a play (or other) glyph. */
export function PlayButton({
  label,
  onPress,
  color = 'tint',
  size = 60,
  icon = PLAY_ICON,
}: {
  label: string;
  /** Omit when the button sits inside a larger pressable card; it then renders as a glyph. */
  onPress?: () => void;
  color?: GradientName;
  size?: number;
  icon?: IconName;
}) {
  const circle = (
    <GradientFill
      name={color}
      raised
      style={[styles.center, { width: size, height: size, borderRadius: size / 2 }]}>
      <Icon name={icon} size={size * 0.42} color={OnGradient[color]} />
    </GradientFill>
  );
  if (!onPress) return circle;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.92 : 1 }] })}>
      {circle}
    </Pressable>
  );
}

export const PLAY_ICON: IconName = { ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' };

/** Small rounded square holding an icon on an accent fill. */
export function IconTile({
  icon,
  color,
  size = 44,
}: {
  icon: IconName;
  color: GradientName;
  size?: number;
}) {
  return (
    <GradientFill
      name={color}
      raised
      style={[styles.center, { width: size, height: size, borderRadius: size * 0.32 }]}>
      <Icon name={icon} size={size * 0.5} color={OnGradient[color]} />
    </GradientFill>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  color = 'tint',
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  color?: GradientName;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
      {selected ? (
        <GradientFill name={color} raised style={styles.chip}>
          <ThemedText type="smallBold" style={{ color: OnGradient[color] }}>
            {label}
          </ThemedText>
        </GradientFill>
      ) : (
        <View style={[styles.chip, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText type="smallBold">{label}</ThemedText>
        </View>
      )}
    </Pressable>
  );
}

export function Field({ label, ...props }: TextInputProps & { label?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      {label && (
        <ThemedText type="small" themeColor="textSecondary">
          {label}
        </ThemedText>
      )}
      <TextInput
        placeholderTextColor={theme.textSecondary}
        {...props}
        style={[
          styles.input,
          {
            color: theme.text,
            backgroundColor: theme.backgroundSelected,
            fontFamily: FontFiles.DMSans[400],
          },
          props.style,
        ]}
      />
    </View>
  );
}

export function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <View style={styles.stat}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText style={styles.statValue}>
        {value}
        {unit && (
          <ThemedText type="small" themeColor="textSecondary">
            {' '}
            {unit}
          </ThemedText>
        )}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  flexShrink: {
    flexShrink: 1,
  },
  blob: {
    position: 'absolute',
    width: 520,
    height: 520,
    borderRadius: 260,
  },
  blobTopLeft: {
    top: -220,
    left: -200,
  },
  blobRight: {
    top: 180,
    right: -260,
  },
  blobBottom: {
    bottom: -240,
    left: -80,
  },
  screenContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  column: {
    flex: 1,
    maxWidth: MaxContentWidth,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.one,
  },
  headerText: {
    flexShrink: 1,
  },
  headerRight: {
    flexDirection: 'row',
    gap: Spacing.two + 4,
  },
  glass: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  gloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '52%',
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
  },
  clip: {
    overflow: 'hidden',
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 48,
    opacity: 0.6,
  },
  card: {
    borderRadius: Radius.card,
    padding: Spacing.four - 4,
    gap: Spacing.three,
  },
  cardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.three,
    paddingHorizontal: Spacing.one,
  },
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
  },
  ringSvg: {
    position: 'absolute',
  },
  button: {
    minHeight: 54,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  buttonText: {
    fontSize: 17,
    letterSpacing: 0.1,
  },
  chip: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
  },
  // Grows to share a row with other fields, but keeps its natural height when stacked.
  field: {
    gap: Spacing.one,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 'auto',
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 6,
    fontSize: 16,
  },
  stat: {
    flex: 1,
    gap: Spacing.half,
  },
  statValue: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: 700,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
});
