import { Link, router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Boton } from '@/components/boton';
import { GastoItem } from '@/components/gasto-item';
import { Icono } from '@/components/icono';
import { Pantalla } from '@/components/pantalla';
import { Tarjeta } from '@/components/tarjeta';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useGastosVisibles } from '@/context/gastos-context';
import { useUsuario } from '@/context/sesion-context';
import { useTheme } from '@/hooks/use-theme';
import { obtenerAsesoria } from '@/services/asesorias';
import { baseDeducible, esDeducible, estadoDe, ivaDeducible } from '@/services/estado-gasto';
import type { Semaforo } from '@/types/gasto';
import { formatearImporte } from '@/utils/formato';
import {
  etiquetaTrimestre,
  perteneceATrimestre,
  proximoPlazo,
  trimestreDe,
} from '@/utils/trimestre';

const ULTIMOS_VISIBLES = 4;

export default function InicioScreen() {
  const theme = useTheme();
  const usuario = useUsuario();
  const gastos = useGastosVisibles();

  const hoy = new Date();
  const trimestre = trimestreDe(hoy);
  const plazo = proximoPlazo(hoy);
  const delTrimestre = gastos.filter((g) => perteneceATrimestre(g.fechaEmision, trimestre));
  const pendientes = gastos.filter((g) => ['pendiente', 'rechazado'].includes(estadoDe(g)));
  const deducibles = delTrimestre.filter(esDeducible);
  const totalBase = deducibles.reduce((suma, g) => suma + baseDeducible(g), 0);
  const totalIva = deducibles.reduce((suma, g) => suma + ivaDeducible(g), 0);
  const sinEnviarDelPlazo = gastos.filter(
    (g) => !g.enviadoEn && perteneceATrimestre(g.fechaEmision, plazo.trimestre),
  ).length;
  const ultimos = [...gastos]
    .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn))
    .slice(0, ULTIMOS_VISIBLES);

  const contar = (semaforo: Semaforo) => delTrimestre.filter((g) => g.semaforo === semaforo).length;
  const urgente = plazo.dias <= 7;
  const nombrePila = usuario.nombre.split(' ')[0];

  return (
    <Pantalla
      enPestana
      titulo={`Hola, ${nombrePila}`}
      antetitulo={obtenerAsesoria(usuario.asesoriaId)?.razonSocial}>
      <Tarjeta
        style={{
          backgroundColor: urgente ? `${theme.amarillo}10` : theme.primarySoft,
          borderColor: urgente ? `${theme.amarillo}55` : theme.primarySoft,
        }}>
        <View style={styles.filaIcono}>
          <Icono
            ios="calendar.badge.clock"
            md="event"
            color={urgente ? theme.amarillo : theme.primary}
          />
          <View style={styles.flex}>
            <ThemedText type="smallBold">
              {plazo.dias === 0
                ? `Hoy termina el plazo del ${etiquetaTrimestre(plazo.trimestre)}`
                : `${plazo.dias} ${plazo.dias === 1 ? 'día' : 'días'} para cerrar el ${etiquetaTrimestre(plazo.trimestre)}`}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Modelos 303 y 130 · hasta el{' '}
              {plazo.limite.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
            </ThemedText>
          </View>
        </View>
        {sinEnviarDelPlazo > 0 && (
          <Link
            href={{
              pathname: '/enviar',
              params: { trimestre: `${plazo.trimestre.numero}-${plazo.trimestre.anio}` },
            }}
            asChild>
            <Boton
              titulo={`Preparar envío (${sinEnviarDelPlazo} sin enviar)`}
              variante={urgente ? 'primario' : 'contorno'}
            />
          </Link>
        )}
      </Tarjeta>

      <View>
        <ThemedText type="smallBold" style={styles.tituloSeccion}>
          Trimestre en curso · {etiquetaTrimestre(trimestre)}
        </ThemedText>
        <View style={styles.contadores}>
          <Contador etiqueta="Deducibles" valor={contar('verde')} color={theme.verde} />
          <Contador etiqueta="En revisión" valor={contar('amarillo')} color={theme.amarillo} />
          <Contador etiqueta="No deducibles" valor={contar('rojo')} color={theme.rojo} />
        </View>
      </View>

      <Tarjeta>
        <ThemedText type="small" themeColor="textSecondary">
          Base deducible acumulada
        </ThemedText>
        <ThemedText type="subtitle">{formatearImporte(totalBase)}</ThemedText>
        <View style={styles.filaIcono}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.flex}>
            IVA soportado deducible
          </ThemedText>
          <ThemedText type="smallBold" style={{ color: theme.verde }}>
            {formatearImporte(totalIva)}
          </ThemedText>
        </View>
      </Tarjeta>

      <View style={styles.acciones}>
        <Pressable
          onPress={() => router.push('/capturar')}
          style={({ pressed }) => [
            styles.accion,
            { backgroundColor: theme.primary },
            pressed && styles.pulsado,
          ]}>
          <Icono ios="camera.fill" md="photo_camera" color={theme.onPrimary} />
          <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
            Escanear ticket
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={() => router.push('/guia')}
          style={({ pressed }) => [
            styles.accion,
            { backgroundColor: theme.backgroundElement },
            pressed && styles.pulsado,
          ]}>
          <Icono ios="book" md="menu_book" color={theme.primary} />
          <ThemedText type="smallBold">¿Qué puedo deducir?</ThemedText>
        </Pressable>
      </View>

      {pendientes.length > 0 && (
        <View style={styles.seccion}>
          <ThemedText type="smallBold">Requieren tu atención ({pendientes.length})</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Gastos sin justificar o rechazados por tu gestor. Respóndelos para no perder la
            deducción.
          </ThemedText>
          {pendientes.map((gasto) => (
            <GastoItem key={gasto.id} gasto={gasto} />
          ))}
        </View>
      )}

      {ultimos.length > 0 ? (
        <View style={styles.seccion}>
          <View style={styles.filaIcono}>
            <ThemedText type="smallBold" style={styles.flex}>
              Últimos gastos
            </ThemedText>
            <Link href="/gastos">
              <ThemedText type="smallBold" style={{ color: theme.primary }}>
                Ver todos
              </ThemedText>
            </Link>
          </View>
          {ultimos.map((gasto) => (
            <GastoItem key={gasto.id} gasto={gasto} />
          ))}
        </View>
      ) : (
        <ThemedText type="small" themeColor="textSecondary" style={styles.vacio}>
          Aún no has registrado gastos. Haz una foto a tu primer ticket y FacturaMétrica lo
          clasificará al momento.
        </ThemedText>
      )}
    </Pantalla>
  );
}

function Contador({ etiqueta, valor, color }: { etiqueta: string; valor: number; color: string }) {
  return (
    <View style={[styles.contador, { backgroundColor: `${color}10`, borderColor: `${color}33` }]}>
      <ThemedText type="subtitle" style={{ color }}>
        {valor}
      </ThemedText>
      <ThemedText type="small" style={{ color }}>
        {etiqueta}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  filaIcono: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  tituloSeccion: {
    marginBottom: Spacing.two,
  },
  contadores: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  contador: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  acciones: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  accion: {
    flex: 1,
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  pulsado: {
    opacity: 0.75,
  },
  seccion: {
    gap: Spacing.two,
  },
  vacio: {
    textAlign: 'center',
    marginTop: Spacing.four,
  },
});
