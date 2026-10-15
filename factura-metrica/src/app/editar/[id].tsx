import { router, useLocalSearchParams } from 'expo-router';

import { FormularioGasto } from '@/components/formulario-gasto';
import { Pantalla } from '@/components/pantalla';
import { ThemedText } from '@/components/themed-text';
import { useGasto, useGastos } from '@/context/gastos-context';
import { useUsuario } from '@/context/sesion-context';
import type { DatosExtraidos } from '@/types/gasto';

export default function EditarGastoScreen() {
  const usuario = useUsuario();
  const { id } = useLocalSearchParams<{ id: string }>();
  const gasto = useGasto(id);
  const { actualizarGasto } = useGastos();

  if (!gasto) {
    return (
      <Pantalla>
        <ThemedText themeColor="textSecondary">Este gasto ya no existe.</ThemedText>
      </Pantalla>
    );
  }

  function guardar(datos: DatosExtraidos, nota?: string) {
    const actualizado = actualizarGasto(gasto!.id, datos, nota);
    if (actualizado?.semaforo === 'amarillo' && !actualizado.justificacion) {
      router.replace({ pathname: '/justificar/[id]', params: { id: actualizado.id } });
    } else {
      router.back();
    }
  }

  return (
    <Pantalla>
      <FormularioGasto
        inicial={gasto}
        notaInicial={gasto.nota}
        nifAutonomo={usuario.nif}
        textoGuardar="Guardar cambios"
        onGuardar={guardar}
      />
    </Pantalla>
  );
}
