import { router } from 'expo-router';
import { Alert, Platform, StyleSheet, Switch, View } from 'react-native';

import { Boton } from '@/components/boton';
import { CabeceraUsuario } from '@/components/cabecera-usuario';
import { EnlaceFila } from '@/components/enlace-fila';
import { FilaDato } from '@/components/fila-dato';
import { Icono } from '@/components/icono';
import { Pantalla } from '@/components/pantalla';
import { Tarjeta } from '@/components/tarjeta';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useGastosVisibles } from '@/context/gastos-context';
import { useSesion, useUsuario } from '@/context/sesion-context';
import { useTheme } from '@/hooks/use-theme';
import { obtenerAsesoria } from '@/services/asesorias';
import { cancelarRecordatorios, programarRecordatorios } from '@/services/notificaciones';
import { confirmar } from '@/utils/confirmar';

export default function PerfilScreen() {
  const theme = useTheme();
  const usuario = useUsuario();
  const { usuarios, cambiarRecordatorios, cerrarSesion } = useSesion();
  const gastos = useGastosVisibles();
  const asesoria = obtenerAsesoria(usuario.asesoriaId);
  const gestor = usuarios.find((u) => u.id === usuario.gestorId);
  const pendientes = gastos.filter((g) => g.semaforo === 'amarillo' && !g.justificacion).length;

  async function alternarRecordatorios(activar: boolean) {
    if (!activar) {
      await cancelarRecordatorios();
      cambiarRecordatorios(false);
      return;
    }
    if (!(await programarRecordatorios(pendientes))) {
      const mensaje =
        Platform.OS === 'web'
          ? 'Los recordatorios solo están disponibles en la app móvil.'
          : 'Activa las notificaciones en los ajustes del dispositivo.';
      if (Platform.OS === 'web') window.alert(mensaje);
      else Alert.alert('No se pudieron activar', mensaje);
      return;
    }
    cambiarRecordatorios(true);
  }

  return (
    <Pantalla enPestana titulo="Perfil">
      <CabeceraUsuario usuario={usuario} />

      <Tarjeta>
        <ThemedText type="smallBold">Datos fiscales</ThemedText>
        <FilaDato etiqueta="NIF" valor={usuario.nif} />
        <FilaDato etiqueta="Actividad" valor={usuario.actividad} />
        {usuario.domicilioFiscal && (
          <FilaDato etiqueta="Domicilio" valor={usuario.domicilioFiscal} />
        )}
        <FilaDato etiqueta="Comprobantes guardados" valor={String(gastos.length)} />
        <Boton
          titulo="Editar mis datos"
          variante="contorno"
          onPress={() => router.push('/cuenta')}
        />
      </Tarjeta>

      <Tarjeta>
        <View style={styles.fila}>
          <Icono ios="building.2" md="apartment" />
          <View style={styles.flex}>
            <ThemedText type="smallBold">{asesoria?.razonSocial}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {gestor ? `Tu gestor: ${gestor.nombre}` : 'Tu asesoría'} · {asesoria?.telefono}
            </ThemedText>
          </View>
        </View>
      </Tarjeta>

      <Tarjeta>
        <View style={styles.fila}>
          <View style={styles.flex}>
            <ThemedText type="smallBold">Recordatorios fiscales</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Avisos 7 días y 1 día antes del cierre trimestral, y de los gastos pendientes de
              justificar.
            </ThemedText>
          </View>
          <Switch
            value={usuario.recordatorios}
            onValueChange={alternarRecordatorios}
            trackColor={{ true: theme.primary, false: theme.border }}
          />
        </View>
      </Tarjeta>

      <EnlaceFila ios="book" md="menu_book" titulo="Guía de gastos deducibles" href="/guia" />

      <Boton
        titulo="Cerrar sesión"
        variante="contorno"
        onPress={() =>
          confirmar(
            'Cerrar sesión',
            'Tus gastos se mantendrán en este dispositivo.',
            'Cerrar sesión',
            cerrarSesion,
          )
        }
      />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
});
