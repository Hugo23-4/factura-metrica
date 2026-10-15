import { useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';

import { Boton } from '@/components/boton';
import { Chips } from '@/components/chips';
import { FilaDato } from '@/components/fila-dato';
import { Pantalla } from '@/components/pantalla';
import { Tarjeta } from '@/components/tarjeta';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useExportacionesAsesoria, useGastos, useGastosVisibles } from '@/context/gastos-context';
import { useClientesAsesoria, useSesion, useUsuario } from '@/context/sesion-context';
import { obtenerAsesoria } from '@/services/asesorias';
import { compartirArchivo } from '@/services/documentos';
import { esExportable, estadoDe } from '@/services/estado-gasto';
import { crearAsientos, generarCsv, generarJson } from '@/services/exportacion';
import type { Exportacion } from '@/types/gasto';
import { formatearFechaHora, formatearImporte } from '@/utils/formato';
import { etiquetaTrimestre, perteneceATrimestre, ultimosTrimestres } from '@/utils/trimestre';

/** RF-11 / CU-08: exportación del lote trimestral para el software contable del despacho. */
export default function ExportarScreen() {
  const usuario = useUsuario();
  const { usuarios } = useSesion();
  const clientes = useClientesAsesoria();
  const gastos = useGastosVisibles();
  const exportaciones = useExportacionesAsesoria();
  const { exportarGastos } = useGastos();
  const trimestres = ultimosTrimestres(new Date(), 4);
  const [indice, setIndice] = useState(1);
  const [formato, setFormato] = useState<Exportacion['formato']>('csv');
  const [exportando, setExportando] = useState(false);

  const trimestre = trimestres[indice];
  const delTrimestre = gastos.filter((g) => perteneceATrimestre(g.fechaEmision, trimestre));
  const exportables = delTrimestre.filter(esExportable);
  const sinRevisar = delTrimestre.filter((g) => ['pendiente', 'justificado'].includes(estadoDe(g)));
  const yaExportados = delTrimestre.filter((g) => g.exportacionId);

  async function exportar() {
    setExportando(true);
    const asientos = crearAsientos(exportables, clientes);
    const nombre = `facturametrica_${trimestre.anio}_${trimestre.numero}T.${formato}`;
    const contenido =
      formato === 'csv'
        ? generarCsv(asientos)
        : generarJson(asientos, {
            asesoria: obtenerAsesoria(usuario.asesoriaId)?.razonSocial,
            trimestre: etiquetaTrimestre(trimestre),
            generado: new Date().toISOString(),
          });
    try {
      await compartirArchivo(
        nombre,
        contenido,
        formato === 'csv' ? 'text/csv' : 'application/json',
      );
      exportarGastos(
        exportables.map((g) => g.id),
        trimestre.numero,
        trimestre.anio,
        formato,
      );
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Inténtalo de nuevo.';
      if (Platform.OS === 'web') window.alert(mensaje);
      else Alert.alert('No se pudo exportar', mensaje);
    } finally {
      setExportando(false);
    }
  }

  return (
    <Pantalla enPestana titulo="Exportar" antetitulo="Enlace con el software contable">
      <View style={styles.grupo}>
        <ThemedText type="smallBold">Trimestre fiscal</ThemedText>
        <Chips
          opciones={trimestres.map((t, i) => ({ valor: i, etiqueta: etiquetaTrimestre(t) }))}
          valor={indice}
          onCambio={setIndice}
        />
      </View>
      <View style={styles.grupo}>
        <ThemedText type="smallBold">Formato</ThemedText>
        <Chips
          opciones={[
            { valor: 'csv', etiqueta: 'CSV (Excel, A3, Sage)' },
            { valor: 'json', etiqueta: 'JSON (API)' },
          ]}
          valor={formato}
          onCambio={setFormato}
        />
      </View>

      <Tarjeta>
        <FilaDato etiqueta="Asientos listos para exportar" valor={String(exportables.length)} />
        <FilaDato
          etiqueta="Importe total"
          valor={formatearImporte(exportables.reduce((s, g) => s + g.total, 0))}
        />
        <FilaDato etiqueta="Ya contabilizados" valor={String(yaExportados.length)} />
        <FilaDato etiqueta="Pendientes de revisión" valor={String(sinRevisar.length)} />
      </Tarjeta>

      {sinRevisar.length > 0 && (
        <ThemedText type="small" themeColor="textSecondary">
          Los gastos sin justificar o sin revisar no se incluyen. Apruébalos en la bandeja para
          añadirlos a un próximo lote.
        </ThemedText>
      )}

      <Boton
        titulo={`Exportar ${exportables.length} asientos`}
        disabled={exportables.length === 0}
        cargando={exportando}
        onPress={exportar}
      />

      <ThemedText type="smallBold" style={styles.historial}>
        Historial de exportaciones
      </ThemedText>
      {exportaciones.length === 0 && (
        <ThemedText type="small" themeColor="textSecondary">
          Todavía no se ha exportado ningún lote.
        </ThemedText>
      )}
      {exportaciones.map((e) => (
        <Tarjeta key={e.id} variante="relleno">
          <View style={styles.fila}>
            <ThemedText type="smallBold" style={styles.flex}>
              {etiquetaTrimestre({ numero: e.trimestre as 1, anio: e.anio })} ·{' '}
              {e.formato.toUpperCase()}
            </ThemedText>
            <ThemedText type="smallBold">{formatearImporte(e.totalImporte)}</ThemedText>
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            {e.numAsientos} asientos · {formatearFechaHora(e.fecha)} ·{' '}
            {usuarios.find((u) => u.id === e.gestorId)?.nombre}
          </ThemedText>
        </Tarjeta>
      ))}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  grupo: {
    gap: Spacing.two,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historial: {
    marginTop: Spacing.two,
  },
});
