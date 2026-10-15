/**
 * Paleta de FacturaMétrica: tema claro en escala de grises; el color se reserva para el semáforo.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  // Interfaz en escala de grises.
  text: '#18181B',
  textSecondary: '#71717A',
  background: '#FFFFFF',
  backgroundElement: '#F5F5F5',
  backgroundSelected: '#E7E7E7',
  border: '#E4E4E7',
  primary: '#18181B',
  primarySoft: '#F1F1F2',
  onPrimary: '#FFFFFF',
  // Color reservado para el semáforo fiscal y los avisos.
  verde: '#16A34A',
  amarillo: '#D97706',
  rojo: '#DC2626',
} as const;

export type ThemeColor = keyof typeof Colors;

/**
 * Google Sans, cargada en `app/_layout.tsx`.
 * Cada peso es una familia distinta: en Android `fontWeight` no elige el archivo de la fuente.
 */
export const Fuentes = {
  regular: 'GoogleSans_400Regular',
  medium: 'GoogleSans_500Medium',
  semibold: 'GoogleSans_600SemiBold',
  bold: 'GoogleSans_700Bold',
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

export const BottomTabInset = Platform.select({ ios: 50, android: 80, web: 72 }) ?? 0;
export const MaxContentWidth = 800;
