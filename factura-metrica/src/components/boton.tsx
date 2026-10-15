import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type BotonProps = Omit<PressableProps, 'children'> & {
  titulo: string;
  variante?: 'primario' | 'secundario' | 'contorno' | 'peligro';
  cargando?: boolean;
};

export function Boton({
  titulo,
  variante = 'primario',
  cargando,
  disabled,
  style,
  ...rest
}: BotonProps) {
  const theme = useTheme();
  const colores = {
    primario: { fondo: theme.primary, texto: theme.onPrimary, borde: theme.primary },
    secundario: { fondo: theme.primarySoft, texto: theme.primary, borde: theme.primarySoft },
    contorno: { fondo: theme.background, texto: theme.text, borde: theme.border },
    peligro: { fondo: theme.background, texto: theme.rojo, borde: `${theme.rojo}55` },
  }[variante];
  const inactivo = disabled || cargando;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={inactivo}
      style={(estado) => [
        styles.boton,
        { backgroundColor: colores.fondo, borderColor: colores.borde },
        (estado.pressed || inactivo) && styles.atenuado,
        typeof style === 'function' ? style(estado) : style,
      ]}
      {...rest}>
      {cargando ? (
        <ActivityIndicator color={colores.texto} />
      ) : (
        <ThemedText type="smallBold" style={{ color: colores.texto }}>
          {titulo}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  atenuado: {
    opacity: 0.55,
  },
});
