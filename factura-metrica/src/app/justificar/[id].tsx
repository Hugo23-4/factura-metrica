import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Boton } from '@/components/boton';
import { CampoTexto } from '@/components/campo-texto';
import { Icono } from '@/components/icono';
import { Pantalla } from '@/components/pantalla';
import { Tarjeta } from '@/components/tarjeta';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useGasto, useGastos } from '@/context/gastos-context';
import { useTheme } from '@/hooks/use-theme';
import { formatearFechaHora, formatearImporte } from '@/utils/formato';
import { esNifValido } from '@/utils/nif';

const LONGITUD_MINIMA_MOTIVO = 10;

const SUGERENCIAS = [
  'Comida de trabajo con cliente para ',
  'Reunión con proveedor para ',
  'Desplazamiento a la obra de ',
  'Material para el encargo de ',
];

/** Asesor Fiscal Virtual (RF-06): pide al autónomo el contexto de un gasto de riesgo. */
export default function JustificarScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const gasto = useGasto(id);
  const { justificarGasto } = useGastos();

  const [motivo, setMotivo] = useState(gasto?.justificacion?.motivoProfesional ?? '');
  const [clienteNombre, setClienteNombre] = useState(gasto?.justificacion?.clienteNombre ?? '');
  const [clienteNif, setClienteNif] = useState(gasto?.justificacion?.clienteNif ?? '');

  if (!gasto) {
    return (
      <Pantalla>
        <ThemedText themeColor="textSecondary">Este gasto ya no existe.</ThemedText>
      </Pantalla>
    );
  }

  const nifIncorrecto = clienteNif.trim().length > 0 && !esNifValido(clienteNif);
  const motivoCorto = motivo.trim().length < LONGITUD_MINIMA_MOTIVO;

  function enviar() {
    justificarGasto(gasto!.id, {
      motivoProfesional: motivo.trim(),
      clienteNombre: clienteNombre.trim() || undefined,
      clienteNif: clienteNif.trim().toUpperCase() || undefined,
    });
    router.dismissTo({ pathname: '/gasto/[id]', params: { id: gasto!.id } });
  }

  return (
    <Pantalla>
      <Tarjeta variante="relleno" style={styles.resumen}>
        <ThemedText type="smallBold">{gasto.razonSocialEmisor}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formatearFechaHora(gasto.fechaEmision)} · {formatearImporte(gasto.total)}
        </ThemedText>
      </Tarjeta>

      <View style={styles.mensaje}>
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <Icono ios="sparkles" md="auto_awesome" size={18} color={theme.onPrimary} />
        </View>
        <View style={[styles.burbuja, { backgroundColor: theme.primarySoft }]}>
          <ThemedText type="smallBold" style={{ color: theme.primary }}>
            Asesor Fiscal Virtual
          </ThemedText>
          <ThemedText type="small">{gasto.preguntaAsesor}</ThemedText>
        </View>
      </View>

      <View style={styles.sugerencias}>
        {SUGERENCIAS.map((sugerencia) => (
          <Pressable
            key={sugerencia}
            onPress={() => setMotivo(sugerencia)}
            style={({ pressed }) => [
              styles.sugerencia,
              { borderColor: theme.border },
              pressed && styles.pulsado,
            ]}>
            <ThemedText type="small">{sugerencia.trim()}…</ThemedText>
          </Pressable>
        ))}
      </View>

      <CampoTexto
        etiqueta="Motivo profesional *"
        value={motivo}
        onChangeText={setMotivo}
        placeholder="Ej.: comida con proveedor para cerrar el contrato de suministros"
        multiline
        ayuda={`Describe con al menos ${LONGITUD_MINIMA_MOTIVO} caracteres la relación con tu actividad.`}
      />
      <CampoTexto
        etiqueta="Cliente o proveedor"
        value={clienteNombre}
        onChangeText={setClienteNombre}
        placeholder="Nombre o razón social"
      />
      <CampoTexto
        etiqueta="NIF del cliente o proveedor"
        value={clienteNif}
        onChangeText={setClienteNif}
        placeholder="12345678Z / B06123456"
        autoCapitalize="characters"
        autoCorrect={false}
        error={nifIncorrecto && 'El NIF no tiene un formato válido.'}
      />

      <Boton
        titulo="Enviar justificación"
        onPress={enviar}
        disabled={motivoCorto || nifIncorrecto}
      />
      <Boton titulo="Responder más tarde" variante="contorno" onPress={() => router.back()} />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  resumen: {
    gap: Spacing.half,
  },
  mensaje: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  burbuja: {
    flex: 1,
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderTopLeftRadius: Spacing.one,
  },
  sugerencias: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  sugerencia: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.four,
    borderWidth: 1,
  },
  pulsado: {
    opacity: 0.6,
  },
});
