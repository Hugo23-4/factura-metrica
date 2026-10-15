import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import { useTheme } from '@/hooks/use-theme';

type Nombre = Extract<SymbolViewProps['name'], { ios?: unknown }>;

interface IconoProps {
  /** Nombre del SF Symbol (iOS). */
  ios: NonNullable<Nombre['ios']>;
  /** Nombre del Material Symbol (Android y web). */
  md: NonNullable<Nombre['android']>;
  size?: number;
  color?: string;
}

export function Icono({ ios, md, size = 22, color }: IconoProps) {
  const theme = useTheme();
  return (
    <SymbolView name={{ ios, android: md, web: md }} size={size} tintColor={color ?? theme.text} />
  );
}
