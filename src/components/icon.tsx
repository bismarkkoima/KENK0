import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { ComponentProps } from 'react';

type CommunityIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/**
 * Either a system symbol (SF Symbols on iOS, Material Symbols elsewhere) or a Material Community
 * icon, which Kenko uses for its own activity figures so they look the same on every platform.
 */
export type AppIcon = SymbolViewProps['name'] | { mci: CommunityIconName };

export function Icon({ name, size, color }: { name: AppIcon; size: number; color: string }) {
  if (typeof name === 'object' && 'mci' in name) {
    return <MaterialCommunityIcons name={name.mci} size={size} color={color} />;
  }
  return <SymbolView name={name} size={size} tintColor={color} />;
}
