import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { FilaDato } from '@/components/fila-dato';
import { Icono } from '@/components/icono';
import { IconoCategoria } from '@/components/icono-categoria';
import { SemaforoBadge } from '@/components/semaforo-badge';
import { Tarjeta } from '@/components/tarjeta';
import { ThemedText } from '@/components/themed-text';
import { CATEGORIAS, CUENTAS_PGC, type CuentaPgc } from '@/constants/fiscal';
import { Spacing } from '@/constants/theme';
import { useSesion } from '@/context/sesion-context';
import { useTheme } from '@/hooks/use-theme';
import { COLOR_ESTADO, estadoDe, ivaDeducible } from '@/services/estado-gasto';
import type { Gasto } from '@/types/gasto';
import { formatearFecha, formatearFechaHora, formatearImporte } from '@/utils/formato';

/** Ficha completa del comprobante, común al autónomo y al gestor. */
export function DetalleGasto({ gasto }: { gasto: Gasto }) {
  const theme = useTheme();
  const { usuarios } = useSesion();
  const color = theme[COLOR_ESTADO[estadoDe(gasto)]];
  const categoria = CATEGORIAS[gasto.categoria];
  const gestorRevisor = usuarios.find((u) => u.id === gasto.revision?.gestorId);

  return (
    <>
      <View style={styles.cabecera}>
        <IconoCategoria categoria={gasto.categoria} size={52} />
        <View style={styles.flex}>
          <ThemedText type="smallBold">{gasto.razonSocialEmisor}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {formatearFechaHora(gasto.fechaEmision)}
          </ThemedText>
        </View>
      </View>

      <View style={styles.importe}>
        <ThemedText type="subtitle">{formatearImporte(gasto.total)}</ThemedText>
        <SemaforoBadge gasto={gasto} />
      </View>

      {gasto.motivoRiesgo && (
        <View
          style={[
            styles.aviso,
            { backgroundColor: `${theme[gasto.semaforo]}10`, borderColor: theme[gasto.semaforo] },
          ]}>
          <ThemedText type="small">{gasto.motivoRiesgo}</ThemedText>
        </View>
      )}

      <Seguimiento gasto={gasto} />

      {gasto.revision && (
        <View style={[styles.aviso, { backgroundColor: `${color}10`, borderColor: color }]}>
          <ThemedText type="smallBold">
            {gasto.revision.decision === 'aprobado'
              ? 'Criterio aprobado'
              : 'Justificación rechazada'}
            {gestorRevisor ? ` por ${gestorRevisor.nombre}` : ''} ·{' '}
            {formatearFecha(gasto.revision.fecha)}
          </ThemedText>
          {gasto.revision.comentario && (
            <ThemedText type="small">{gasto.revision.comentario}</ThemedText>
          )}
        </View>
      )}

      <Tarjeta>
        <FilaDato etiqueta="NIF emisor" valor={gasto.nifEmisor ?? 'No detectado'} />
        <FilaDato
          etiqueta="Documento"
          valor={gasto.nifReceptor ? 'Factura completa' : 'Factura simplificada (ticket)'}
        />
        <FilaDato etiqueta="Categoría" valor={categoria.nombre} />
        <FilaDato
          etiqueta="Cuenta PGC"
          valor={`${gasto.cuentaPgc} ${CUENTAS_PGC[gasto.cuentaPgc as CuentaPgc] ?? ''}`.trim()}
        />
        <View style={[styles.separador, { backgroundColor: theme.border }]} />
        <FilaDato etiqueta="Base imponible" valor={formatearImporte(gasto.baseImponible)} />
        <FilaDato etiqueta={`IVA (${gasto.tipoIva} %)`} valor={formatearImporte(gasto.cuotaIva)} />
        <FilaDato
          etiqueta={`IVA deducible (${categoria.deducibleIvaPct} %)`}
          valor={formatearImporte(ivaDeducible(gasto))}
        />
        <FilaDato etiqueta="Total" valor={formatearImporte(gasto.total)} />
      </Tarjeta>

      {gasto.justificacion && (
        <Tarjeta>
          <ThemedText type="smallBold">Justificación del autónomo</ThemedText>
          <ThemedText type="small">{gasto.justificacion.motivoProfesional}</ThemedText>
          {gasto.justificacion.clienteNombre && (
            <FilaDato etiqueta="Cliente / proveedor" valor={gasto.justificacion.clienteNombre} />
          )}
          {gasto.justificacion.clienteNif && (
            <FilaDato etiqueta="NIF" valor={gasto.justificacion.clienteNif} />
          )}
        </Tarjeta>
      )}

      {gasto.nota && (
        <Tarjeta variante="relleno">
          <ThemedText type="smallBold">Nota para el gestor</ThemedText>
          <ThemedText type="small">{gasto.nota}</ThemedText>
        </Tarjeta>
      )}

      {gasto.imagenUri && (
        <Image source={{ uri: gasto.imagenUri }} style={styles.imagen} contentFit="contain" />
      )}
      {gasto.nombreArchivo && !gasto.imagenUri && (
        <Tarjeta variante="relleno" style={styles.archivo}>
          <Icono ios="doc.richtext" md="picture_as_pdf" />
          <ThemedText type="small" style={styles.flex}>
            {gasto.nombreArchivo}
          </ThemedText>
        </Tarjeta>
      )}
      {gasto.hashDocumento && (
        <Tarjeta variante="relleno">
          <ThemedText type="smallBold">Huella del documento (SHA-256)</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" selectable style={styles.huella}>
            {gasto.hashDocumento}
          </ThemedText>
        </Tarjeta>
      )}
    </>
  );
}

/** Línea de tiempo según la máquina de estados del comprobante (DFE). */
function Seguimiento({ gasto }: { gasto: Gasto }) {
  const theme = useTheme();
  const estado = estadoDe(gasto);
  const pasos = [
    { titulo: 'Registrado', hecho: true },
    {
      titulo:
        estado === 'pendiente'
          ? 'Pendiente de justificar'
          : gasto.semaforo === 'rojo'
            ? 'No deducible'
            : gasto.semaforo === 'verde'
              ? 'Validado automáticamente'
              : 'Justificado',
      hecho: estado !== 'pendiente',
    },
    {
      titulo: estado === 'rechazado' ? 'Rechazado por el gestor' : 'Revisado por el gestor',
      hecho: Boolean(gasto.revision) || gasto.semaforo === 'verde',
    },
    { titulo: 'Contabilizado', hecho: Boolean(gasto.exportacionId) },
  ];

  return (
    <View style={styles.pasos}>
      {pasos.map((paso, i) => (
        <View key={paso.titulo} style={styles.paso}>
          <View
            style={[
              styles.puntoPaso,
              { backgroundColor: paso.hecho ? theme.primary : theme.border },
            ]}
          />
          {i < pasos.length - 1 && (
            <View style={[styles.lineaPaso, { backgroundColor: theme.border }]} />
          )}
          <ThemedText
            type="small"
            themeColor={paso.hecho ? 'text' : 'textSecondary'}
            style={styles.textoPaso}>
            {paso.titulo}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  importe: {
    gap: Spacing.one,
  },
  aviso: {
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderLeftWidth: 4,
  },
  separador: {
    height: 1,
  },
  imagen: {
    width: '100%',
    height: 320,
    borderRadius: Spacing.three,
  },
  archivo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  huella: {
    fontSize: 12,
  },
  pasos: {
    flexDirection: 'row',
  },
  paso: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
  },
  puntoPaso: {
    width: 14,
    height: 14,
    borderRadius: 7,
    zIndex: 1,
  },
  lineaPaso: {
    position: 'absolute',
    top: 6,
    left: '50%',
    width: '100%',
    height: 2,
  },
  textoPaso: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
  },
});
