import { StyleSheet, View } from 'react-native';

import { Icono } from '@/components/icono';
import { useTheme } from '@/hooks/use-theme';
import type { Categoria } from '@/types/gasto';

const ICONOS = {
  restauracion: { ios: 'fork.knife', md: 'restaurant' },
  combustible: { ios: 'fuelpump', md: 'local_gas_station' },
  alojamiento: { ios: 'bed.double', md: 'hotel' },
  transporte: { ios: 'bus', md: 'directions_bus' },
  material_oficina: { ios: 'paperclip', md: 'attach_file' },
  suministros: { ios: 'bolt', md: 'bolt' },
  servicios_profesionales: { ios: 'briefcase', md: 'work' },
  publicidad: { ios: 'megaphone', md: 'campaign' },
  otros: { ios: 'shippingbox', md: 'inventory_2' },
  multas: { ios: 'exclamationmark.triangle', md: 'warning' },
  consumo_personal: { ios: 'cart', md: 'shopping_cart' },
} as const satisfies Record<Categoria, unknown>;

export function IconoCategoria({ categoria, size = 40 }: { categoria: Categoria; size?: number }) {
  const theme = useTheme();
  const { ios, md } = ICONOS[categoria];
  return (
    <View
      style={[
        styles.contenedor,
        { width: size, height: size, borderRadius: size / 3, backgroundColor: theme.primarySoft },
      ]}>
      <Icono ios={ios} md={md} size={size * 0.5} color={theme.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
