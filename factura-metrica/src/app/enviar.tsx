import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Boton } from '@/components/boton';
import { FilaDato } from '@/components/fila-dato';
import { GastoItem } from '@/components/gasto-item';
import { Icono } from '@/components/icono';
import { Pantalla } from '@/components/pantalla';
import { Tarjeta } from '@/components/tarjeta';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useGastos, useGastosVisibles } from '@/context/gastos-context';
import { useUsuario } from '@/context/sesion-context';
import { useTheme } from '@/hooks/use-theme';
import { obtenerAsesoria } from '@/services/asesorias';
import { estadoDe } from '@/services/estado-gasto';
import { formatearImporte } from '@/utils/formato';
import {
  etiquetaTrimestre,
  perteneceATrimestre,
  trimestreDe,
  type Trimestre,
} from '@/utils/trimestre';

/**
 * Cierre trimestral: el autónomo envía a su gestoría los gastos revisados del trimestre.
 * Los gastos sin justificar se quedan en la app hasta que se respondan.
 */
export default function EnviarScreen() {
  const theme = useTheme();
  const usuario = useUsuario();
  const gastos = useGastosVisibles();
  const { enviarAGestoria } = useGastos();
  const nombreAsesoria = obtenerAsesoria(usuario.asesoriaId)?.razonSocial;
  const params = useLocalSearchParams<{ trimestre?: string }>();
  const [enviados, setEnviados] = useState<number | null>(null);

  const trimestre = leerTrimestre(params.trimestre) ?? trimestreDe(new Date());
  const sinEnviar = gastos.filter(
    (g) => !g.enviadoEn && perteneceATrimestre(g.fechaEmision, trimestre),
  );
  const pendientes = sinEnviar.filter((g) => ['pendiente', 'rechazado'].includes(estadoDe(g)));
  const listos = sinEnviar.filter((g) => !pendientes.includes(g));
  const contar = (estado: ReturnType<typeof estadoDe>) =>
    listos.filter((g) => estadoDe(g) === estado).length;

  if (enviados !== null) {
    return (
      <Pantalla>
        <View style={styles.exito}>
          <View style={[styles.circulo, { backgroundColor: `${theme.verde}18` }]}>
            <Icono ios="checkmark" md="check" size={36} color={theme.verde} />
          </View>
          <ThemedText type="subtitle" style={styles.centrado}>
            ¡Enviado!
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.centrado}>
            {nombreAsesoria} ha recibido {enviados} {enviados === 1 ? 'gasto' : 'gastos'} del{' '}
            {etiquetaTrimestre(trimestre)} con su clasificación y cuenta contable.
          </ThemedText>
        </View>
        <Boton titulo="Volver al inicio" onPress={() => router.dismissAll()} />
      </Pantalla>
    );
  }

  return (
    <Pantalla titulo={etiquetaTrimestre(trimestre)} antetitulo={`Envío a ${nombreAsesoria}`}>
      {sinEnviar.length === 0 ? (
        <Tarjeta variante="relleno">
          <ThemedText type="small" themeColor="textSecondary">
            No tienes gastos pendientes de enviar en este trimestre.
          </ThemedText>
        </Tarjeta>
      ) : (
        <>
          <Tarjeta>
            <ThemedText type="smallBold">Resumen del envío</ThemedText>
            <FilaDato etiqueta="Deducibles" valor={String(contar('validado'))} />
            <FilaDato
              etiqueta="Justificados (los revisará tu gestor)"
              valor={String(contar('justificado'))}
            />
            <FilaDato
              etiqueta="No deducibles (solo informativos)"
              valor={String(contar('no_deducible'))}
            />
            <View style={[styles.separador, { backgroundColor: theme.border }]} />
            <FilaDato
              etiqueta="Importe total"
              valor={formatearImporte(listos.reduce((s, g) => s + g.total, 0))}
            />
          </Tarjeta>

          {pendientes.length > 0 && (
            <View style={styles.seccion}>
              <View
                style={[
                  styles.aviso,
                  { backgroundColor: `${theme.amarillo}10`, borderColor: theme.amarillo },
                ]}>
                <ThemedText type="small">
                  {pendientes.length === 1
                    ? 'Un gasto necesita justificación y no se enviará todavía.'
                    : `${pendientes.length} gastos necesitan justificación y no se enviarán todavía.`}{' '}
                  Respóndelos para no perder la deducción.
                </ThemedText>
              </View>
              {pendientes.map((gasto) => (
                <GastoItem key={gasto.id} gasto={gasto} />
              ))}
            </View>
          )}

          <Boton
            titulo={`Enviar ${listos.length} ${listos.length === 1 ? 'gasto' : 'gastos'} a mi gestoría`}
            disabled={listos.length === 0}
            onPress={() => {
              enviarAGestoria(listos.map((g) => g.id));
              setEnviados(listos.length);
            }}
          />
        </>
      )}
    </Pantalla>
  );
}

function leerTrimestre(valor: string | undefined): Trimestre | null {
  const coincidencia = valor?.match(/^([1-4])-(\d{4})$/);
  if (!coincidencia) return null;
  return { numero: Number(coincidencia[1]) as Trimestre['numero'], anio: Number(coincidencia[2]) };
}

const styles = StyleSheet.create({
  seccion: {
    gap: Spacing.two,
  },
  aviso: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderLeftWidth: 4,
  },
  separador: {
    height: 1,
  },
  exito: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.five,
  },
  circulo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centrado: {
    textAlign: 'center',
  },
});
