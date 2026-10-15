import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/cabecera-usuario';
import { Pantalla } from '@/components/pantalla';
import { Tarjeta } from '@/components/tarjeta';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useGastosVisibles } from '@/context/gastos-context';
import { useClientesAsesoria, useUsuario } from '@/context/sesion-context';
import { useTheme } from '@/hooks/use-theme';
import { obtenerAsesoria } from '@/services/asesorias';
import { estadoDe, esExportable, ivaDeducible } from '@/services/estado-gasto';
import { formatearImporte } from '@/utils/formato';
import {
  etiquetaTrimestre,
  perteneceATrimestre,
  proximoPlazo,
  trimestreDe,
} from '@/utils/trimestre';

/** CU-05: supervisión de la cartera de clientes de la asesoría. */
export default function PanelScreen() {
  const theme = useTheme();
  const usuario = useUsuario();
  const clientes = useClientesAsesoria();
  const gastos = useGastosVisibles();

  const trimestre = trimestreDe(new Date());
  const plazo = proximoPlazo(new Date());
  const delTrimestre = gastos.filter((g) => perteneceATrimestre(g.fechaEmision, trimestre));
  const porRevisar = gastos.filter((g) => estadoDe(g) === 'justificado');
  const sinJustificar = gastos.filter((g) => estadoDe(g) === 'pendiente');
  const listosExportar = gastos.filter(esExportable);
  const iva = delTrimestre.filter(esExportable).reduce((suma, g) => suma + ivaDeducible(g), 0);

  const resumenClientes = clientes
    .map((cliente) => {
      const suyos = delTrimestre.filter((g) => g.clienteId === cliente.id);
      const resueltos = suyos.filter((g) => !['pendiente', 'justificado'].includes(estadoDe(g)));
      return {
        cliente,
        total: suyos.length,
        porRevisar: suyos.filter((g) => estadoDe(g) === 'justificado').length,
        progreso: suyos.length ? resueltos.length / suyos.length : 1,
      };
    })
    .sort((a, b) => a.progreso - b.progreso);

  return (
    <Pantalla
      enPestana
      titulo={`Hola, ${usuario.nombre.split(' ')[0]}`}
      antetitulo={obtenerAsesoria(usuario.asesoriaId)?.razonSocial}>
      <Tarjeta variante="relleno">
        <ThemedText type="smallBold">
          {plazo.dias} días para el cierre del {etiquetaTrimestre(plazo.trimestre)}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Modelos 303 y 130 de toda la cartera · hasta el{' '}
          {plazo.limite.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
        </ThemedText>
      </Tarjeta>

      <View style={styles.kpis}>
        <Kpi etiqueta="Clientes activos" valor={String(clientes.filter((c) => c.activo).length)} />
        <Kpi
          etiqueta="Por revisar"
          valor={String(porRevisar.length)}
          color={theme.amarillo}
          onPress={() => router.push('/admin/bandeja')}
        />
        <Kpi etiqueta="Sin justificar" valor={String(sinJustificar.length)} />
        <Kpi
          etiqueta="Listos para exportar"
          valor={String(listosExportar.length)}
          onPress={() => router.push('/admin/exportar')}
        />
      </View>

      <Tarjeta>
        <ThemedText type="small" themeColor="textSecondary">
          IVA soportado deducible de la cartera · {etiquetaTrimestre(trimestre)}
        </ThemedText>
        <ThemedText type="subtitle">{formatearImporte(iva)}</ThemedText>
      </Tarjeta>

      <View style={styles.seccion}>
        <ThemedText type="smallBold">
          Progreso de digitalización · {etiquetaTrimestre(trimestre)}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Porcentaje de gastos del trimestre que ya no necesitan intervención.
        </ThemedText>
        {resumenClientes.map(({ cliente, total, porRevisar: pendientesCliente, progreso }) => (
          <Pressable
            key={cliente.id}
            onPress={() =>
              router.push({ pathname: '/admin/cliente/[id]', params: { id: cliente.id } })
            }
            style={({ pressed }) => [
              styles.cliente,
              { borderColor: theme.border },
              pressed && styles.pulsado,
            ]}>
            <Avatar nombre={cliente.nombre} size={40} />
            <View style={styles.flex}>
              <View style={styles.fila}>
                <ThemedText type="smallBold" style={styles.flex} numberOfLines={1}>
                  {cliente.nombre}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {Math.round(progreso * 100)} %
                </ThemedText>
              </View>
              <View style={[styles.pista, { backgroundColor: theme.backgroundElement }]}>
                <View
                  style={[
                    styles.barra,
                    { width: `${progreso * 100}%`, backgroundColor: theme.primary },
                  ]}
                />
              </View>
              <ThemedText type="small" themeColor="textSecondary">
                {!cliente.activo
                  ? 'Cuenta pausada'
                  : `${total} gastos${pendientesCliente ? ` · ${pendientesCliente} por revisar` : ''}`}
              </ThemedText>
            </View>
          </Pressable>
        ))}
      </View>
    </Pantalla>
  );
}

function Kpi({
  etiqueta,
  valor,
  color,
  onPress,
}: {
  etiqueta: string;
  valor: string;
  color?: string;
  onPress?: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.kpi,
        { borderColor: theme.border },
        pressed && styles.pulsado,
      ]}>
      <View style={styles.fila}>
        {color && <View style={[styles.punto, { backgroundColor: color }]} />}
        <ThemedText type="small" themeColor="textSecondary">
          {etiqueta}
        </ThemedText>
      </View>
      <ThemedText type="subtitle">{valor}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  kpis: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  kpi: {
    flexBasis: '47%',
    flexGrow: 1,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  punto: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  seccion: {
    gap: Spacing.two,
  },
  cliente: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  pista: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: Spacing.one,
  },
  barra: {
    height: '100%',
    borderRadius: 3,
  },
  pulsado: {
    opacity: 0.7,
  },
});
