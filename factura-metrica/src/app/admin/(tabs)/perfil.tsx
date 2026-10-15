import { router } from 'expo-router';

import { Boton } from '@/components/boton';
import { CabeceraUsuario } from '@/components/cabecera-usuario';
import { EnlaceFila } from '@/components/enlace-fila';
import { FilaDato } from '@/components/fila-dato';
import { Pantalla } from '@/components/pantalla';
import { Tarjeta } from '@/components/tarjeta';
import { ThemedText } from '@/components/themed-text';
import { useGastos } from '@/context/gastos-context';
import { useGestoresAsesoria, useSesion, useUsuario } from '@/context/sesion-context';
import { obtenerAsesoria } from '@/services/asesorias';
import { confirmar } from '@/utils/confirmar';

export default function PerfilGestorScreen() {
  const usuario = useUsuario();
  const gestores = useGestoresAsesoria();
  const { cerrarSesion, restablecerUsuarios } = useSesion();
  const { restablecerGastos } = useGastos();
  const asesoria = obtenerAsesoria(usuario.asesoriaId);

  return (
    <Pantalla enPestana titulo="Perfil">
      <CabeceraUsuario usuario={usuario} />
      <Boton titulo="Editar mis datos" variante="contorno" onPress={() => router.push('/cuenta')} />

      <Tarjeta>
        <ThemedText type="smallBold">{asesoria?.razonSocial}</ThemedText>
        <FilaDato etiqueta="CIF" valor={asesoria?.cif ?? ''} />
        <FilaDato etiqueta="Teléfono" valor={asesoria?.telefono ?? ''} />
        <FilaDato etiqueta="Correo" valor={asesoria?.emailContacto ?? ''} />
        <FilaDato
          etiqueta="Plan"
          valor={asesoria?.plan === 'profesional' ? 'Profesional' : 'Básico'}
        />
        <FilaDato etiqueta="Código de invitación" valor={asesoria?.codigoInvitacion ?? ''} />
        <ThemedText type="small" themeColor="textSecondary">
          Comparte el código con tus clientes para que se den de alta en la app.
        </ThemedText>
      </Tarjeta>

      <Tarjeta>
        <ThemedText type="smallBold">Equipo de la asesoría</ThemedText>
        {gestores.map((g) => (
          <FilaDato key={g.id} etiqueta={g.nombre} valor={g.id === usuario.id ? 'Tú' : 'Gestor'} />
        ))}
      </Tarjeta>

      <EnlaceFila ios="book" md="menu_book" titulo="Guía de gastos deducibles" href="/guia" />

      <Tarjeta variante="relleno">
        <ThemedText type="smallBold">Entorno de pruebas</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Vuelve a cargar las asesorías, gestores, autónomos y comprobantes de demostración.
        </ThemedText>
        <Boton
          titulo="Restablecer datos de prueba"
          variante="peligro"
          onPress={() =>
            confirmar(
              'Restablecer datos',
              'Se perderán todos los cambios hechos en la app.',
              'Restablecer',
              () => {
                restablecerGastos();
                restablecerUsuarios();
              },
            )
          }
        />
      </Tarjeta>

      <Boton
        titulo="Cerrar sesión"
        variante="contorno"
        onPress={() =>
          confirmar('Cerrar sesión', '¿Quieres salir de tu cuenta?', 'Cerrar sesión', cerrarSesion)
        }
      />
    </Pantalla>
  );
}
