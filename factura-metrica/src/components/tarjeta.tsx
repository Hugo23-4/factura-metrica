import { StyleSheet, View, type ViewProps } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TarjetaProps = ViewProps & {
  /** `relleno` usa el gris suave de fondo; `borde` deja la tarjeta en blanco con contorno. */
  variante?: 'borde' | 'relleno';
};

export function Tarjeta({ variante = 'borde', style, ...rest }: TarjetaProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.tarjeta,
        variante === 'borde'
          ? { backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1 }
          : { backgroundColor: theme.backgroundElement },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
});
