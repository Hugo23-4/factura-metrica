import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

export function FilaDato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View style={styles.fila}>
      <ThemedText type="small" themeColor="textSecondary">
        {etiqueta}
      </ThemedText>
      <ThemedText type="smallBold" style={styles.valor}>
        {valor}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  valor: {
    flexShrink: 1,
    textAlign: 'right',
  },
});
