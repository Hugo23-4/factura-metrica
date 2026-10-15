import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Boton } from '@/components/boton';
import { DetalleGasto } from '@/components/detalle-gasto';
import { Pantalla } from '@/components/pantalla';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useGasto, useGastos } from '@/context/gastos-context';
import { estadoDe } from '@/services/estado-gasto';
import { confirmar } from '@/utils/confirmar';

/** Detalle del gasto para el autónomo: leer, editar, justificar y eliminar. */
export default function DetalleGastoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const gasto = useGasto(id);
  const { eliminarGasto } = useGastos();

  if (!gasto) {
    return (
      <Pantalla>
        <ThemedText themeColor="textSecondary">Este gasto ya no existe.</ThemedText>
      </Pantalla>
    );
  }

  const estado = estadoDe(gasto);
  const justificar = () => router.push({ pathname: '/justificar/[id]', params: { id: gasto.id } });
  const bloqueado = Boolean(gasto.enviadoEn) || estado === 'aprobado' || estado === 'exportado';

  return (
    <Pantalla>
      <DetalleGasto gasto={gasto} />

      {estado === 'pendiente' && (
        <Boton titulo="Justificar con el Asesor Fiscal" onPress={justificar} />
      )}
      {estado === 'rechazado' && <Boton titulo="Corregir la justificación" onPress={justificar} />}
      {estado === 'justificado' && !gasto.enviadoEn && (
        <Boton titulo="Modificar justificación" variante="secundario" onPress={justificar} />
      )}

      {bloqueado ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.centrado}>
          Este gasto ya está en manos de tu gestoría. Si hay un error, contacta con tu gestor.
        </ThemedText>
      ) : (
        <View style={styles.acciones}>
          <Boton
            titulo="Editar datos"
            variante="contorno"
            style={styles.flex}
            onPress={() => router.push({ pathname: '/editar/[id]', params: { id: gasto.id } })}
          />
          <Boton
            titulo="Eliminar"
            variante="peligro"
            style={styles.flex}
            onPress={() =>
              confirmar(
                'Eliminar gasto',
                '¿Seguro que quieres eliminar este comprobante?',
                'Eliminar',
                () => {
                  eliminarGasto(gasto.id);
                  router.back();
                },
              )
            }
          />
        </View>
      )}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  acciones: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  centrado: {
    textAlign: 'center',
  },
});
