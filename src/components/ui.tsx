import type { PropsWithChildren, ReactNode } from 'react';
import {
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

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  BottomTabInset,
  MaxContentWidth,
  Spacing,
  WebTabBarHeight,
  type ThemeColor,
} from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Scrollable page with safe-area padding and a centered, width-capped column. */
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
          paddingBottom: insets.bottom + (tabs ? BottomTabInset : 0) + Spacing.four,
        },
      ]}
      keyboardShouldPersistTaps="handled">
      <View style={styles.column}>
        {title && (
          <View style={styles.header}>
            <View style={styles.headerText}>
              {subtitle && <ThemedText themeColor="textSecondary">{subtitle}</ThemedText>}
              <ThemedText type="subtitle">{title}</ThemedText>
            </View>
            {right}
          </View>
        )}
        {children}
      </View>
    </ScrollView>
  );
}

export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return (
    <ThemedView type="backgroundElement" style={[styles.card, style]}>
      {children}
    </ThemedView>
  );
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

export function ProgressBar({
  value,
  max,
  color = 'tint',
  height = 8,
}: {
  value: number;
  max: number;
  color?: ThemeColor;
  height?: number;
}) {
  const theme = useTheme();
  const ratio = max > 0 ? Math.min(value / max, 1) : 0;
  return (
    <View
      style={[
        styles.track,
        { height, borderRadius: height / 2, backgroundColor: theme.backgroundSelected },
      ]}>
      <View
        style={{
          width: `${ratio * 100}%`,
          height: '100%',
          borderRadius: height / 2,
          backgroundColor: value > max ? theme.danger : theme[color],
        }}
      />
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  color = 'tint',
  disabled,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  color?: ThemeColor;
  disabled?: boolean;
}) {
  const theme = useTheme();
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: primary ? theme[color] : theme.backgroundSelected,
          opacity: disabled ? 0.4 : pressed ? 0.75 : 1,
        },
      ]}>
      <ThemedText type="smallBold" style={{ color: primary ? '#ffffff' : theme.text }}>
        {label}
      </ThemedText>
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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, { backgroundColor: selected ? theme.tint : theme.backgroundElement }]}>
      <ThemedText type="small" style={{ color: selected ? '#ffffff' : theme.text }}>
        {label}
      </ThemedText>
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
          { color: theme.text, backgroundColor: theme.backgroundElement },
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
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
  sectionTitleText: {
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  button: {
    paddingVertical: Spacing.two + 4,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    paddingVertical: Spacing.one + 2,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.four,
  },
  field: {
    gap: Spacing.one,
    flex: 1,
  },
  input: {
    borderRadius: Spacing.two + 4,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
    fontSize: 16,
  },
  stat: {
    flex: 1,
    gap: Spacing.half,
  },
  statValue: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: 700,
  },
});
