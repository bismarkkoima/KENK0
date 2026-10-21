import { BlurView } from 'expo-blur';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
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
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import {
  BottomTabInset,
  Gradients,
  MaxContentWidth,
  Radius,
  Spacing,
  WebTabBarHeight,
  type GradientName,
  type ThemeColor,
} from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { linearGradient, radialGlow } from '@/lib/style';

/**
 * Real backdrop blur on iOS and web. Android's blur needs a dedicated target view and is costly
 * in scrolling lists, so there glass falls back to a denser translucent fill.
 */
const SUPPORTS_BLUR = Platform.OS === 'ios' || Platform.OS === 'web';

/** Soft colored glows behind the content — the "aurora" that the glass panels frost. */
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

/** Scrollable page over the aurora background, with safe-area padding and a capped width. */
export function Screen({
  children,
  title,
  subtitle,
  right,
  tabs = true,
}: PropsWithChildren<{ title?: string; subtitle?: string; right?: ReactNode; tabs?: boolean }>) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.fill}>
      <AuroraBackground />
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[
          styles.screenContent,
          {
            // Tab screens draw under the status bar (and, on web, under the top tab bar);
            // stack screens already sit below a header.
            paddingTop: (tabs ? insets.top + WebTabBarHeight : 0) + Spacing.three,
            paddingBottom: insets.bottom + (tabs ? BottomTabInset : 0) + Spacing.five,
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
              {right}
            </View>
          )}
          {children}
        </View>
      </ScrollView>
    </View>
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
    <View
      style={[
        styles.glass,
        {
          borderRadius: radius,
          borderColor: theme.glassBorder,
          boxShadow: `0 10px 30px ${theme.shadow}`,
        },
        style,
      ]}>
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

export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <Glass style={[styles.card, style]}>{children}</Glass>;
}

export function SectionTitle({ children, right }: PropsWithChildren<{ right?: ReactNode }>) {
  return (
    <View style={styles.sectionTitle}>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitleText}>
        {children}
      </ThemedText>
      {right}
    </View>
  );
}

/** A view filled with one of the accent gradients. */
export function GradientFill({
  name,
  style,
  angle = 135,
  children,
}: PropsWithChildren<{ name: GradientName; style?: StyleProp<ViewStyle>; angle?: number }>) {
  const theme = useTheme();
  const [from, to] = Gradients[name];
  return <View style={[linearGradient(theme[from], theme[to], angle), style]}>{children}</View>;
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
        { height, borderRadius: height / 2, backgroundColor: theme.backgroundSelected },
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

/** Circular progress ring with a gradient stroke. Children render in the center. */
export function Ring({
  size,
  stroke = 12,
  progress,
  color = 'tint',
  warnOver = false,
  children,
}: PropsWithChildren<{
  size: number;
  stroke?: number;
  /** 0–1; values above 1 render as a full ring. */
  progress: number;
  color?: GradientName;
  warnOver?: boolean;
}>) {
  const theme = useTheme();
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(progress, 1));
  const [from, to] = Gradients[color];
  const over = warnOver && progress > 1;
  // SVG gradient ids are document-wide on web, so each ring needs its own.
  const id = `ring-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={styles.ringSvg}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={over ? theme.danger : theme[from]} />
            <Stop offset="1" stopColor={over ? theme.danger : theme[to]} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={theme.backgroundSelected}
          strokeWidth={stroke}
          fill="none"
        />
        {clamped > 0 && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={`url(#${id})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - clamped)}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
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
  icon?: SymbolViewProps['name'];
}) {
  const theme = useTheme();
  const primary = variant === 'primary';
  const textColor = primary ? '#ffffff' : theme.text;
  const content = (
    <View style={styles.buttonContent}>
      {icon && <SymbolView name={icon} size={18} tintColor={textColor} />}
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
        { opacity: disabled ? 0.4 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}>
      {primary ? (
        <GradientFill
          name={color}
          style={[styles.button, { boxShadow: `0 8px 20px ${theme[Gradients[color][0]]}55` }]}>
          {content}
        </GradientFill>
      ) : (
        <Glass radius={Radius.control} style={styles.button}>
          {content}
        </Glass>
      )}
    </Pressable>
  );
}

/** Round glass button holding a single icon. */
export function IconButton({
  icon,
  label,
  onPress,
  size = 48,
  color,
}: {
  icon: SymbolViewProps['name'];
  label: string;
  onPress: () => void;
  size?: number;
  color?: ThemeColor;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.94 : 1 }] })}>
      <Glass radius={size / 2} style={[styles.center, { width: size, height: size }]}>
        <SymbolView name={icon} size={size * 0.42} tintColor={theme[color ?? 'text']} />
      </Glass>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const text = (
    <ThemedText type="smallBold" style={{ color: selected ? '#ffffff' : theme.text }}>
      {label}
    </ThemedText>
  );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
      {selected ? (
        <GradientFill name="tint" style={styles.chip}>
          {text}
        </GradientFill>
      ) : (
        <Glass radius={Radius.pill} style={styles.chip}>
          {text}
        </Glass>
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
            backgroundColor: theme.backgroundElement,
            borderColor: theme.glassBorder,
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
  fill: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
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
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: Spacing.one,
  },
  headerText: {
    flexShrink: 1,
  },
  glass: {
    borderWidth: StyleSheet.hairlineWidth,
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
    padding: Spacing.three + 2,
    gap: Spacing.two + 2,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.one,
  },
  sectionTitleText: {
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontSize: 12,
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
    minHeight: 52,
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
    fontSize: 16,
    letterSpacing: 0.2,
  },
  chip: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
  },
  field: {
    gap: Spacing.one,
    flex: 1,
  },
  input: {
    borderRadius: Radius.control,
    borderWidth: StyleSheet.hairlineWidth,
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
