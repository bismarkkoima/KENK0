import { Platform, type ViewStyle } from 'react-native';

/**
 * CSS gradient backgrounds. React Native renders these natively via
 * `experimental_backgroundImage`; react-native-web needs the standard property.
 */
export function backgroundImage(css: string): ViewStyle {
  return (
    Platform.OS === 'web' ? { backgroundImage: css } : { experimental_backgroundImage: css }
  ) as ViewStyle;
}

export function linearGradient(from: string, to: string, angle = 135): ViewStyle {
  return backgroundImage(`linear-gradient(${angle}deg, ${from}, ${to})`);
}

/** A soft round glow that fades to transparent at its edge. */
export function radialGlow(color: string): ViewStyle {
  return backgroundImage(`radial-gradient(circle at center, ${color} 0%, transparent 70%)`);
}
