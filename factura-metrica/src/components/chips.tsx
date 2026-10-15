import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Opcion<T extends string | number> {
  valor: T;
  etiqueta: string;
  /** Color del chip cuando está seleccionado; por defecto el color principal. */
  color?: string;
}

interface ChipsProps<T extends string | number> {
  opciones: Opcion<T>[];
  valor: T;
  onCambio: (valor: T) => void;
}

/** Selector de una opción con forma de píldoras. */
export function Chips<T extends string | number>({ opciones, valor, onCambio }: ChipsProps<T>) {
  const theme = useTheme();
  return (
    <View style={styles.contenedor}>
      {opciones.map((opcion) => {
        const activo = opcion.valor === valor;
        const color = opcion.color ?? theme.primary;
        return (
          <Pressable
            key={String(opcion.valor)}
            accessibilityRole="button"
            accessibilityState={{ selected: activo }}
            onPress={() => onCambio(opcion.valor)}
            style={[
              styles.chip,
              activo
                ? { backgroundColor: `${color}14`, borderColor: color }
                : { backgroundColor: theme.background, borderColor: theme.border },
            ]}>
            <ThemedText type="smallBold" style={{ color: activo ? color : theme.textSecondary }}>
              {opcion.etiqueta}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    paddingVertical: Spacing.one + Spacing.half,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.four,
    borderWidth: 1.5,
  },
});
