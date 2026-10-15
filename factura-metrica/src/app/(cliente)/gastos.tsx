import { useState } from 'react';
import { SectionList, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chips } from '@/components/chips';
import { GastoItem } from '@/components/gasto-item';
import { Icono } from '@/components/icono';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useGastosVisibles } from '@/context/gastos-context';
import { useTheme } from '@/hooks/use-theme';
import type { Gasto, Semaforo } from '@/types/gasto';
import { formatearImporte, NOMBRE_CATEGORIA } from '@/utils/formato';
import {
  etiquetaTrimestre,
  perteneceATrimestre,
  ultimosTrimestres,
  type Trimestre,
} from '@/utils/trimestre';

type FiltroSemaforo = 'todos' | Semaforo;

/** Repositorio documental de comprobantes (RF-12): búsqueda, filtros y agrupación mensual. */
export default function GastosScreen() {
  const theme = useTheme();
  const gastos = useGastosVisibles();
  const [busqueda, setBusqueda] = useState('');
  const [semaforo, setSemaforo] = useState<FiltroSemaforo>('todos');
  const [periodo, setPeriodo] = useState('todos');

  const trimestres = ultimosTrimestres(new Date(), 4);
  const texto = busqueda.trim().toLowerCase();

  const filtrados = gastos
    .filter((g) => semaforo === 'todos' || g.semaforo === semaforo)
    .filter((g) => {
      if (periodo === 'todos') return true;
      const [numero, anio] = periodo.split('-').map(Number);
      return perteneceATrimestre(g.fechaEmision, { numero, anio } as Trimestre);
    })
    .filter(
      (g) =>
        !texto ||
        g.razonSocialEmisor.toLowerCase().includes(texto) ||
        (g.nifEmisor ?? '').toLowerCase().includes(texto) ||
        NOMBRE_CATEGORIA[g.categoria].toLowerCase().includes(texto) ||
        (g.justificacion?.clienteNombre ?? '').toLowerCase().includes(texto),
    )
    .sort((a, b) => b.fechaEmision.localeCompare(a.fechaEmision));

  const secciones = agruparPorMes(filtrados);
  const total = filtrados.reduce((suma, g) => suma + g.total, 0);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top']} style={styles.container}>
        <SectionList
          sections={secciones}
          keyExtractor={(gasto) => gasto.id}
          renderItem={({ item }) => <GastoItem gasto={item} />}
          renderSectionHeader={({ section }) => (
            <View style={[styles.cabeceraSeccion, { backgroundColor: theme.background }]}>
              <ThemedText type="smallBold">{section.titulo}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {formatearImporte(section.total)}
              </ThemedText>
            </View>
          )}
          stickySectionHeadersEnabled
          contentContainerStyle={styles.contenido}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={styles.cabecera}>
              <ThemedText type="subtitle">Gastos</ThemedText>
              <View style={[styles.buscador, { backgroundColor: theme.backgroundElement }]}>
                <Icono ios="magnifyingglass" md="search" size={18} color={theme.textSecondary} />
                <TextInput
                  value={busqueda}
                  onChangeText={setBusqueda}
                  placeholder="Buscar por emisor, NIF, categoría o cliente"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.inputBusqueda, { color: theme.text }]}
                />
              </View>
              <Chips
                opciones={[
                  { valor: 'todos', etiqueta: 'Todos' },
                  { valor: 'verde', etiqueta: 'Deducibles', color: theme.verde },
                  { valor: 'amarillo', etiqueta: 'En revisión', color: theme.amarillo },
                  { valor: 'rojo', etiqueta: 'No deducibles', color: theme.rojo },
                ]}
                valor={semaforo}
                onCambio={setSemaforo}
              />
              <Chips
                opciones={[
                  { valor: 'todos', etiqueta: 'Todo el historial' },
                  ...trimestres.map((t) => ({
                    valor: `${t.numero}-${t.anio}`,
                    etiqueta: etiquetaTrimestre(t),
                  })),
                ]}
                valor={periodo}
                onCambio={setPeriodo}
              />
              <ThemedText type="small" themeColor="textSecondary">
                {filtrados.length} {filtrados.length === 1 ? 'comprobante' : 'comprobantes'} ·{' '}
                {formatearImporte(total)}
              </ThemedText>
            </View>
          }
          ListEmptyComponent={
            <ThemedText type="small" themeColor="textSecondary" style={styles.vacio}>
              No hay gastos que coincidan con los filtros.
            </ThemedText>
          }
        />
      </SafeAreaView>
    </View>
  );
}

function agruparPorMes(gastos: Gasto[]) {
  const grupos = new Map<string, { titulo: string; total: number; data: Gasto[] }>();
  for (const gasto of gastos) {
    const fecha = new Date(gasto.fechaEmision);
    const clave = `${fecha.getFullYear()}-${fecha.getMonth()}`;
    if (!grupos.has(clave)) {
      const mes = fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      const titulo = mes.charAt(0).toUpperCase() + mes.slice(1);
      grupos.set(clave, { titulo, total: 0, data: [] });
    }
    const grupo = grupos.get(clave)!;
    grupo.data.push(gasto);
    grupo.total += gasto.total;
  }
  return [...grupos.values()];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contenido: {
    gap: Spacing.two,
    padding: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.six,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  cabecera: {
    gap: Spacing.three,
    marginBottom: Spacing.one,
  },
  buscador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  inputBusqueda: {
    flex: 1,
    minHeight: 46,
    fontSize: 16,
  },
  cabeceraSeccion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.three,
    paddingBottom: Spacing.one,
  },
  vacio: {
    textAlign: 'center',
    marginTop: Spacing.four,
  },
});
