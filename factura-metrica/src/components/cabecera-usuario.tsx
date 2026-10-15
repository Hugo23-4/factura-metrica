import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Usuario } from '@/types/usuario';

export function iniciales(nombre: string) {
  return nombre
    .split(' ')
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase();
}

export function Avatar({ nombre, size = 56 }: { nombre: string; size?: number }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: theme.primarySoft },
      ]}>
      <ThemedText type="smallBold" style={{ fontSize: size * 0.34, lineHeight: size * 0.44 }}>
        {iniciales(nombre)}
      </ThemedText>
    </View>
  );
}

export function CabeceraUsuario({ usuario }: { usuario: Usuario }) {
  return (
    <View style={styles.cabecera}>
      <Avatar nombre={usuario.nombre} />
      <View style={styles.flex}>
        <ThemedText type="smallBold" style={styles.nombre}>
          {usuario.nombre}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {usuario.email}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
  nombre: {
    fontSize: 18,
    lineHeight: 24,
  },
});
