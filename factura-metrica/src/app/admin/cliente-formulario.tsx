import { router, Stack, useLocalSearchParams } from 'expo-router';

import { FormularioUsuario } from '@/components/formulario-usuario';
import { Pantalla } from '@/components/pantalla';
import { useClientesAsesoria, useGestoresAsesoria, useSesion } from '@/context/sesion-context';
import type { DatosUsuario } from '@/types/usuario';

/** Alta y edición de clientes por parte del gestor (RF-14). */
export default function ClienteFormularioScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const cliente = useClientesAsesoria().find((c) => c.id === id);
  const gestores = useGestoresAsesoria();
  const { crearCliente, actualizarUsuario } = useSesion();

  async function guardar(datos: DatosUsuario) {
    const error = cliente ? await actualizarUsuario(cliente.id, datos) : await crearCliente(datos);
    if (!error) router.back();
    return error;
  }

  return (
    <Pantalla>
      <Stack.Screen options={{ title: cliente ? 'Editar cliente' : 'Nuevo cliente' }} />
      <FormularioUsuario
        inicial={cliente}
        esCliente
        contrasenaObligatoria={!cliente}
        gestores={gestores}
        textoGuardar={cliente ? 'Guardar cambios' : 'Dar de alta'}
        onGuardar={guardar}
      />
    </Pantalla>
  );
}
