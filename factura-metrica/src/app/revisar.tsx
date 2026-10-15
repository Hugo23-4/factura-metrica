import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';

import { FormularioGasto } from '@/components/formulario-gasto';
import { Pantalla } from '@/components/pantalla';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useGastos } from '@/context/gastos-context';
import { useUsuario } from '@/context/sesion-context';
import type { DatosExtraidos } from '@/types/gasto';

/** Revisión de los datos que ha extraído el OCR antes de registrar el gasto. */
export default function RevisarScreen() {
  const usuario = useUsuario();
  const { borrador, setBorrador, registrarGasto } = useGastos();

  if (!borrador) {
    return <Redirect href="/capturar" />;
  }

  function guardar(datos: DatosExtraidos, nota?: string) {
    const gasto = registrarGasto({ ...borrador!, datos }, nota);
    if (!gasto) return;
    setBorrador(null);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(
        gasto.semaforo === 'verde'
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning,
      );
    }
    const destino = gasto.semaforo === 'amarillo' ? '/justificar/[id]' : '/gasto/[id]';
    router.replace({ pathname: destino, params: { id: gasto.id } });
  }

  return (
    <Pantalla>
      {borrador.imagenUri && (
        <Image source={{ uri: borrador.imagenUri }} style={styles.imagen} contentFit="contain" />
      )}
      <ThemedText type="small" themeColor="textSecondary">
        Comprueba que los datos leídos son correctos. Si cambias algo, el semáforo se recalcula al
        momento.
      </ThemedText>
      <FormularioGasto
        inicial={borrador.datos}
        nifAutonomo={usuario.nif}
        textoGuardar="Guardar gasto"
        onGuardar={guardar}
      />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  imagen: {
    width: '100%',
    height: 200,
    borderRadius: Spacing.three,
  },
});
