import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { COLOR_ESTADO, ETIQUETA_ESTADO, estadoDe } from '@/services/estado-gasto';
import type { Gasto } from '@/types/gasto';

export function SemaforoBadge({ gasto }: { gasto: Gasto }) {
  const theme = useTheme();
  const estado = estadoDe(gasto);
  const color = theme[COLOR_ESTADO[estado]];

  return (
    <View style={[styles.badge, { backgroundColor: `${color}14` }]}>
      <View style={[styles.punto, { backgroundColor: color }]} />
      <ThemedText type="smallBold" style={[styles.texto, { color }]}>
        {ETIQUETA_ESTADO[estado]}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.one,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.three,
  },
  punto: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  texto: {
    fontSize: 12,
    lineHeight: 16,
  },
});
