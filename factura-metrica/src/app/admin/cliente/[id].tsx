import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Switch, View } from 'react-native';

import { Boton } from '@/components/boton';
import { CabeceraUsuario } from '@/components/cabecera-usuario';
import { FilaDato } from '@/components/fila-dato';
import { GastoItem } from '@/components/gasto-item';
import { Pantalla } from '@/components/pantalla';
import { Tarjeta } from '@/components/tarjeta';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useGastos, useGastosVisibles } from '@/context/gastos-context';
import { useClientesAsesoria, useSesion } from '@/context/sesion-context';
import { useTheme } from '@/hooks/use-theme';
import { esDeducible, estadoDe, ivaDeducible } from '@/services/estado-gasto';
import { confirmar } from '@/utils/confirmar';
import { formatearFecha, formatearImporte } from '@/utils/formato';

/** Ficha de un autónomo de la cartera: lectura, pausa, edición y baja (RF-14). */
export default function FichaClienteScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const cliente = useClientesAsesoria().find((c) => c.id === id);
  const { usuarios, cambiarActivo, eliminarUsuario } = useSesion();
  const { eliminarGastosDeCliente } = useGastos();
  const gastos = useGastosVisibles()
    .filter((g) => g.clienteId === id)
    .sort((a, b) => b.fechaEmision.localeCompare(a.fechaEmision));

  if (!cliente) {
    return (
      <Pantalla>
        <ThemedText themeColor="textSecondary">
          Este cliente no existe o no pertenece a tu asesoría.
        </ThemedText>
      </Pantalla>
    );
  }

  const gestor = usuarios.find((u) => u.id === cliente.gestorId);
  const deducibles = gastos.filter(esDeducible);

  return (
    <Pantalla>
      <CabeceraUsuario usuario={cliente} />

      <Tarjeta>
        <FilaDato etiqueta="NIF" valor={cliente.nif} />
        <FilaDato etiqueta="Actividad" valor={cliente.actividad} />
        {cliente.telefono && <FilaDato etiqueta="Teléfono" valor={cliente.telefono} />}
        {cliente.domicilioFiscal && (
          <FilaDato etiqueta="Domicilio fiscal" valor={cliente.domicilioFiscal} />
        )}
        <FilaDato etiqueta="Gestor asignado" valor={gestor?.nombre ?? 'Sin asignar'} />
        <FilaDato etiqueta="Alta" valor={formatearFecha(cliente.creadoEn)} />
      </Tarjeta>

      <Tarjeta>
        <View style={styles.fila}>
          <View style={styles.flex}>
            <ThemedText type="smallBold">
              {cliente.activo ? 'Cuenta activa' : 'Cuenta pausada'}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Un cliente pausado no puede iniciar sesión, pero sus datos se conservan.
            </ThemedText>
          </View>
          <Switch
            value={cliente.activo}
            onValueChange={(activo) => cambiarActivo(cliente.id, activo)}
            trackColor={{ true: theme.primary, false: theme.border }}
          />
        </View>
      </Tarjeta>

      <View style={styles.fila}>
        <Resumen etiqueta="Comprobantes" valor={String(gastos.length)} />
        <Resumen
          etiqueta="Por revisar"
          valor={String(gastos.filter((g) => estadoDe(g) === 'justificado').length)}
        />
        <Resumen
          etiqueta="IVA deducible"
          valor={formatearImporte(deducibles.reduce((s, g) => s + ivaDeducible(g), 0))}
        />
      </View>

      <View style={styles.fila}>
        <Boton
          titulo="Editar"
          variante="contorno"
          style={styles.flex}
          onPress={() =>
            router.push({ pathname: '/admin/cliente-formulario', params: { id: cliente.id } })
          }
        />
        <Boton
          titulo="Dar de baja"
          variante="peligro"
          style={styles.flex}
          onPress={() =>
            confirmar(
              'Dar de baja al cliente',
              `Se eliminarán la cuenta de ${cliente.nombre} y sus ${gastos.length} comprobantes.`,
              'Dar de baja',
              () => {
                eliminarGastosDeCliente(cliente.id);
                eliminarUsuario(cliente.id);
                router.back();
              },
            )
          }
        />
      </View>

      <ThemedText type="smallBold">Comprobantes</ThemedText>
      {gastos.map((gasto) => (
        <GastoItem key={gasto.id} gasto={gasto} nombreCliente="" />
      ))}
      {gastos.length === 0 && (
        <ThemedText type="small" themeColor="textSecondary">
          Este cliente todavía no ha registrado gastos.
        </ThemedText>
      )}
    </Pantalla>
  );
}

function Resumen({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <Tarjeta style={styles.resumen}>
      <ThemedText type="small" themeColor="textSecondary">
        {etiqueta}
      </ThemedText>
      <ThemedText type="smallBold">{valor}</ThemedText>
    </Tarjeta>
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
  resumen: {
    flex: 1,
    gap: Spacing.half,
  },
});
