import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Boton } from '@/components/boton';
import { CampoTexto } from '@/components/campo-texto';
import { Chips } from '@/components/chips';
import { DetalleGasto } from '@/components/detalle-gasto';
import { Pantalla } from '@/components/pantalla';
import { Tarjeta } from '@/components/tarjeta';
import { ThemedText } from '@/components/themed-text';
import { CUENTAS_PGC, LISTA_CATEGORIAS, CATEGORIAS, SIN_CUENTA } from '@/constants/fiscal';
import { Spacing } from '@/constants/theme';
import { useGasto, useGastos } from '@/context/gastos-context';
import { useSesion } from '@/context/sesion-context';
import { estadoDe } from '@/services/estado-gasto';
import type { Categoria } from '@/types/gasto';
import { confirmar } from '@/utils/confirmar';

/** RF-09 / CU-06 / CU-07: el gestor aprueba, rectifica o rechaza el criterio del autónomo. */
export default function RevisionGastoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const gasto = useGasto(id);
  const { usuarios } = useSesion();
  const { revisarGasto, rectificarGasto, eliminarGasto } = useGastos();
  const [rechazando, setRechazando] = useState(false);
  const [comentario, setComentario] = useState('');
  const [categoria, setCategoria] = useState<Categoria | undefined>(gasto?.categoria);
  const [cuentaPgc, setCuentaPgc] = useState(gasto?.cuentaPgc ?? '');

  if (!gasto || !categoria) {
    return (
      <Pantalla>
        <ThemedText themeColor="textSecondary">Este gasto ya no existe.</ThemedText>
      </Pantalla>
    );
  }

  const estado = estadoDe(gasto);
  const cliente = usuarios.find((u) => u.id === gasto.clienteId);
  const contabilizado = estado === 'exportado';
  const hayCambios = categoria !== gasto.categoria || cuentaPgc !== gasto.cuentaPgc;

  function cambiarCategoria(nueva: Categoria) {
    setCategoria(nueva);
    setCuentaPgc(CATEGORIAS[nueva].cuentaPgc);
  }

  return (
    <Pantalla>
      <ThemedText type="small" themeColor="textSecondary">
        Cliente: {cliente?.nombre} · {cliente?.nif}
      </ThemedText>
      <DetalleGasto gasto={gasto} />

      {(estado === 'justificado' || estado === 'rechazado') && (
        <Tarjeta>
          <ThemedText type="smallBold">Revisión de la justificación</ThemedText>
          {!rechazando ? (
            <View style={styles.fila}>
              <Boton
                titulo="Aprobar criterio"
                style={styles.flex}
                onPress={() => revisarGasto(gasto.id, 'aprobado')}
              />
              <Boton
                titulo="Rechazar"
                variante="peligro"
                style={styles.flex}
                onPress={() => setRechazando(true)}
              />
            </View>
          ) : (
            <>
              <CampoTexto
                etiqueta="Motivo del rechazo"
                value={comentario}
                onChangeText={setComentario}
                placeholder="Explica al autónomo qué falta para aceptar el gasto"
                multiline
              />
              <View style={styles.fila}>
                <Boton
                  titulo="Cancelar"
                  variante="contorno"
                  style={styles.flex}
                  onPress={() => setRechazando(false)}
                />
                <Boton
                  titulo="Confirmar rechazo"
                  variante="peligro"
                  style={styles.flex}
                  disabled={comentario.trim().length < 5}
                  onPress={() => {
                    revisarGasto(gasto.id, 'rechazado', comentario.trim());
                    setRechazando(false);
                  }}
                />
              </View>
            </>
          )}
        </Tarjeta>
      )}

      {!contabilizado && (
        <Tarjeta>
          <ThemedText type="smallBold">Imputación contable</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Acepta la subcuenta propuesta o rectifícala.
          </ThemedText>
          <ThemedText type="smallBold">Categoría</ThemedText>
          <Chips
            opciones={LISTA_CATEGORIAS.map((c) => ({ valor: c, etiqueta: CATEGORIAS[c].nombre }))}
            valor={categoria}
            onCambio={cambiarCategoria}
          />
          <ThemedText type="smallBold">Cuenta del PGC</ThemedText>
          <Chips
            opciones={[
              ...Object.entries(CUENTAS_PGC).map(([codigo, nombre]) => ({
                valor: codigo,
                etiqueta: `${codigo} ${nombre}`,
              })),
              { valor: SIN_CUENTA, etiqueta: 'Sin cuenta (no contabilizable)' },
            ]}
            valor={cuentaPgc}
            onCambio={setCuentaPgc}
          />
          <Boton
            titulo="Guardar imputación"
            variante="contorno"
            disabled={!hayCambios}
            onPress={() => rectificarGasto(gasto.id, { categoria, cuentaPgc })}
          />
        </Tarjeta>
      )}

      {!contabilizado && (
        <Boton
          titulo="Eliminar comprobante"
          variante="peligro"
          onPress={() =>
            confirmar(
              'Eliminar comprobante',
              'Se borrará también para el autónomo.',
              'Eliminar',
              () => {
                eliminarGasto(gasto.id);
                router.back();
              },
            )
          }
        />
      )}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  fila: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
});
