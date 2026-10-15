import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Chips } from '@/components/chips';
import { GastoItem } from '@/components/gasto-item';
import { Icono } from '@/components/icono';
import { Pantalla } from '@/components/pantalla';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useGastosVisibles } from '@/context/gastos-context';
import { useClientesAsesoria } from '@/context/sesion-context';
import { useTheme } from '@/hooks/use-theme';
import { estadoDe } from '@/services/estado-gasto';
import type { EstadoGasto } from '@/types/gasto';
import { formatearImporte } from '@/utils/formato';
import {
  etiquetaTrimestre,
  perteneceATrimestre,
  ultimosTrimestres,
  type Trimestre,
} from '@/utils/trimestre';

type Filtro = 'por_revisar' | 'verde' | 'amarillo' | 'rojo' | 'todos';

const FILTRO_ESTADOS: Record<Filtro, EstadoGasto[] | null> = {
  por_revisar: ['justificado'],
  verde: ['validado', 'aprobado', 'exportado'],
  amarillo: ['pendiente', 'justificado'],
  rojo: ['no_deducible', 'rechazado'],
  todos: null,
};

/** RF-08: bandeja unificada de toda la cartera, con contadores por estado y filtro por trimestre. */
export default function BandejaScreen() {
  const theme = useTheme();
  const gastos = useGastosVisibles();
  const clientes = useClientesAsesoria();
  const trimestres = ultimosTrimestres(new Date(), 4);
  const [filtro, setFiltro] = useState<Filtro>('por_revisar');
  const [periodo, setPeriodo] = useState('todos');
  const [busqueda, setBusqueda] = useState('');

  const nombreDe = (clienteId: string) => clientes.find((c) => c.id === clienteId)?.nombre ?? '';
  const texto = busqueda.trim().toLowerCase();

  const delPeriodo = gastos.filter((g) => {
    if (periodo === 'todos') return true;
    const [numero, anio] = periodo.split('-').map(Number);
    return perteneceATrimestre(g.fechaEmision, { numero, anio } as Trimestre);
  });
  const contar = (f: Filtro) =>
    delPeriodo.filter((g) => !FILTRO_ESTADOS[f] || FILTRO_ESTADOS[f]!.includes(estadoDe(g))).length;

  const visibles = delPeriodo
    .filter((g) => !FILTRO_ESTADOS[filtro] || FILTRO_ESTADOS[filtro]!.includes(estadoDe(g)))
    .filter(
      (g) =>
        !texto ||
        nombreDe(g.clienteId).toLowerCase().includes(texto) ||
        g.razonSocialEmisor.toLowerCase().includes(texto) ||
        (g.nifEmisor ?? '').toLowerCase().includes(texto) ||
        g.cuentaPgc.includes(texto),
    )
    .sort((a, b) => b.fechaEmision.localeCompare(a.fechaEmision));

  return (
    <Pantalla enPestana titulo="Bandeja" antetitulo="Gastos de toda la cartera">
      <View style={[styles.buscador, { backgroundColor: theme.backgroundElement }]}>
        <Icono ios="magnifyingglass" md="search" size={18} color={theme.textSecondary} />
        <TextInput
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder="Cliente, emisor, NIF o cuenta PGC"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text }]}
        />
      </View>
      <Chips
        opciones={[
          {
            valor: 'por_revisar',
            etiqueta: `Por revisar (${contar('por_revisar')})`,
            color: theme.amarillo,
          },
          { valor: 'verde', etiqueta: `Verde (${contar('verde')})`, color: theme.verde },
          {
            valor: 'amarillo',
            etiqueta: `Amarillo (${contar('amarillo')})`,
            color: theme.amarillo,
          },
          { valor: 'rojo', etiqueta: `Rojo (${contar('rojo')})`, color: theme.rojo },
          { valor: 'todos', etiqueta: `Todos (${contar('todos')})` },
        ]}
        valor={filtro}
        onCambio={setFiltro}
      />
      <Chips
        opciones={[
          { valor: 'todos', etiqueta: 'Todos los trimestres' },
          ...trimestres.map((t) => ({
            valor: `${t.numero}-${t.anio}`,
            etiqueta: etiquetaTrimestre(t),
          })),
        ]}
        valor={periodo}
        onCambio={setPeriodo}
      />
      <ThemedText type="small" themeColor="textSecondary">
        {visibles.length} comprobantes ·{' '}
        {formatearImporte(visibles.reduce((s, g) => s + g.total, 0))}
      </ThemedText>

      {visibles.map((gasto) => (
        <GastoItem key={gasto.id} gasto={gasto} nombreCliente={nombreDe(gasto.clienteId)} />
      ))}
      {visibles.length === 0 && (
        <ThemedText type="small" themeColor="textSecondary" style={styles.vacio}>
          {filtro === 'por_revisar'
            ? 'No hay justificaciones pendientes de revisar.'
            : 'No hay gastos con estos filtros.'}
        </ThemedText>
      )}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  buscador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  input: {
    flex: 1,
    minHeight: 46,
    fontSize: 16,
  },
  vacio: {
    textAlign: 'center',
    marginTop: Spacing.four,
  },
});
