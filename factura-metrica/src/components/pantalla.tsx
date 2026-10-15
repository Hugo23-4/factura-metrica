import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface PantallaProps {
  children: ReactNode;
  titulo?: string;
  antetitulo?: string;
  /** Contenido a la derecha del título (por ejemplo, un botón). */
  accion?: ReactNode;
  /** Pantallas de pestaña: respetan el área segura superior y dejan hueco a la barra inferior. */
  enPestana?: boolean;
}

/** Contenedor común de las pantallas con scroll, ancho máximo y teclado. */
export function Pantalla({ children, titulo, antetitulo, accion, enPestana }: PantallaProps) {
  const theme = useTheme();
  const contenido = (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        styles.contenido,
        { paddingBottom: (enPestana ? BottomTabInset : 0) + Spacing.six },
      ]}>
      {titulo && (
        <View style={styles.cabecera}>
          <View style={styles.titulos}>
            {antetitulo && (
              <ThemedText type="small" themeColor="textSecondary">
                {antetitulo}
              </ThemedText>
            )}
            <ThemedText type="subtitle">{titulo}</ThemedText>
          </View>
          {accion}
        </View>
      )}
      {children}
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {enPestana ? (
        <SafeAreaView edges={['top']} style={styles.flex}>
          {contenido}
        </SafeAreaView>
      ) : (
        contenido
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  contenido: {
    gap: Spacing.three,
    padding: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  titulos: {
    flex: 1,
  },
});
