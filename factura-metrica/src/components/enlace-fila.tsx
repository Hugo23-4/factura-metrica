import { router, type Href } from 'expo-router';
import type { AndroidSymbol } from 'expo-symbols';
import { Pressable, StyleSheet } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

import { Icono } from '@/components/icono';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface EnlaceFilaProps {
  ios: SFSymbol;
  md: AndroidSymbol;
  titulo: string;
  href: Href;
}

/** Fila de navegación con icono y flecha. */
export function EnlaceFila({ ios, md, titulo, href }: EnlaceFilaProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => router.push(href)}
      style={({ pressed }) => [
        styles.enlace,
        { borderColor: theme.border },
        pressed && styles.pulsado,
      ]}>
      <Icono ios={ios} md={md} />
      <ThemedText type="smallBold" style={styles.flex}>
        {titulo}
      </ThemedText>
      <Icono ios="chevron.right" md="chevron_right" size={18} color={theme.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  enlace: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  flex: {
    flex: 1,
  },
  pulsado: {
    opacity: 0.7,
  },
});
