import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { IconoCategoria } from '@/components/icono-categoria';
import { SemaforoBadge } from '@/components/semaforo-badge';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Gasto } from '@/types/gasto';
import { formatearFecha, formatearImporte, NOMBRE_CATEGORIA } from '@/utils/formato';

interface GastoItemProps {
  gasto: Gasto;
  /** En el panel del gestor se muestra el cliente y se abre la ficha de revisión. */
  nombreCliente?: string;
}

export function GastoItem({ gasto, nombreCliente }: GastoItemProps) {
  const theme = useTheme();
  const abrir = () =>
    nombreCliente !== undefined
      ? router.push({ pathname: '/admin/gasto/[id]', params: { id: gasto.id } })
      : router.push({ pathname: '/gasto/[id]', params: { id: gasto.id } });

  return (
    <Pressable
      onPress={abrir}
      style={({ pressed }) => [
        styles.item,
        { backgroundColor: theme.background, borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <IconoCategoria categoria={gasto.categoria} />
      <View style={styles.info}>
        <ThemedText type="smallBold" numberOfLines={1}>
          {gasto.razonSocialEmisor}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {nombreCliente ? `${nombreCliente} · ` : `${NOMBRE_CATEGORIA[gasto.categoria]} · `}
          {formatearFecha(gasto.fechaEmision)}
        </ThemedText>
        <View style={styles.etiquetas}>
          <SemaforoBadge gasto={gasto} />
          {gasto.enviadoEn && !gasto.exportacionId && (
            <ThemedText type="small" themeColor="textSecondary" style={styles.nota}>
              Enviado
            </ThemedText>
          )}
        </View>
      </View>
      <ThemedText type="smallBold">{formatearImporte(gasto.total)}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  info: {
    flex: 1,
    gap: Spacing.one,
  },
  etiquetas: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  nota: {
    fontSize: 12,
  },
  pressed: {
    opacity: 0.7,
  },
});
