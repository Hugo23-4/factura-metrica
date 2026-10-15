import { router } from 'expo-router';

import { Boton } from '@/components/boton';
import { FormularioUsuario } from '@/components/formulario-usuario';
import { Pantalla } from '@/components/pantalla';
import { Tarjeta } from '@/components/tarjeta';
import { ThemedText } from '@/components/themed-text';
import { useGastos } from '@/context/gastos-context';
import { useSesion, useUsuario } from '@/context/sesion-context';
import { confirmar } from '@/utils/confirmar';

/** Edición y baja de la propia cuenta (CRUD del usuario sobre sí mismo). */
export default function CuentaScreen() {
  const usuario = useUsuario();
  const { actualizarUsuario, eliminarUsuario } = useSesion();
  const { eliminarGastosDeCliente } = useGastos();
  const esCliente = usuario.rol === 'cliente';

  async function guardar(datos: Parameters<typeof actualizarUsuario>[1]) {
    const error = await actualizarUsuario(usuario.id, datos);
    if (!error) router.back();
    return error;
  }

  return (
    <Pantalla>
      <FormularioUsuario
        inicial={usuario}
        esCliente={esCliente}
        contrasenaObligatoria={false}
        textoGuardar="Guardar cambios"
        onGuardar={guardar}
      />

      <Tarjeta variante="relleno">
        <ThemedText type="smallBold">Eliminar mi cuenta</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {esCliente
            ? 'Se borrarán tus datos y todos tus comprobantes de este dispositivo (derecho de supresión del RGPD).'
            : 'Se borrará tu usuario de gestor. Los clientes de la asesoría se mantienen.'}
        </ThemedText>
        <Boton
          titulo="Eliminar mi cuenta"
          variante="peligro"
          onPress={() =>
            confirmar('Eliminar cuenta', 'Esta acción no se puede deshacer.', 'Eliminar', () => {
              if (esCliente) eliminarGastosDeCliente(usuario.id);
              eliminarUsuario(usuario.id);
            })
          }
        />
      </Tarjeta>
    </Pantalla>
  );
}
