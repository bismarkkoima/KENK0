import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { FontFiles, Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?:
    | 'default'
    | 'title'
    | 'small'
    | 'smallBold'
    | 'subtitle'
    | 'heading'
    | 'display'
    | 'quote'
    | 'link'
    | 'linkPrimary'
    | 'code';
  themeColor?: ThemeColor;
};

type Weight = keyof (typeof FontFiles)['DMSans'];

/**
 * Custom fonts ship one file per weight, and Android ignores `fontWeight` for them. Resolve the
 * requested family + weight to the matching loaded file so `fontWeight: 700` just works.
 */
function resolveFont(style: TextStyle): TextStyle {
  if (style.fontFamily === Fonts.mono) return style;
  const family = style.fontFamily === Fonts.serif ? 'SourceSerif4' : 'DMSans';
  const requested = Number(style.fontWeight ?? 400);
  const weight = (Math.min(900, Math.max(300, Math.round(requested / 100) * 100)) || 400) as Weight;
  const italic = style.fontStyle === 'italic';
  return {
    ...style,
    fontFamily: `${FontFiles[family][weight]}${italic ? '_Italic' : ''}`,
    // The weight and slant now live in the font file; leaving them would fake-bold it on iOS.
    fontWeight: undefined,
    fontStyle: undefined,
  };
}

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  const flat: TextStyle =
    StyleSheet.flatten([{ color: theme[themeColor ?? 'text'] }, styles[type], style]) ?? {};
  return <Text style={resolveFont(flat)} {...rest} />;
}

const styles = StyleSheet.create({
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 500,
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 700,
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 400,
  },
  title: {
    fontSize: 48,
    fontWeight: 700,
    lineHeight: 52,
    letterSpacing: -1,
  },
  /** Large page title, e.g. "Summary". */
  subtitle: {
    fontSize: 36,
    lineHeight: 42,
    fontWeight: 800,
    letterSpacing: -1.2,
  },
  /** Card title, e.g. "Activity Rings". */
  heading: {
    fontSize: 21,
    lineHeight: 27,
    fontWeight: 700,
    letterSpacing: -0.4,
  },
  /** Big colored metric, e.g. "258/400 CAL". */
  display: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: 700,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  /** Serif text for quotes and greetings. */
  quote: {
    fontFamily: Fonts.serif,
    fontSize: 21,
    lineHeight: 29,
    fontWeight: 500,
    letterSpacing: -0.2,
  },
  link: {
    lineHeight: 30,
    fontSize: 14,
  },
  linkPrimary: {
    lineHeight: 30,
    fontSize: 14,
    color: '#3c87f7',
  },
  code: {
    fontFamily: Fonts.mono,
    fontSize: 12,
  },
});
