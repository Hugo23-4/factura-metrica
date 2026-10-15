import { router } from 'expo-router';

import { FormularioGasto } from '@/components/formulario-gasto';
import { Pantalla } from '@/components/pantalla';
import { ThemedText } from '@/components/themed-text';
import type { DatosExtraidos } from '@/types/gasto';

/** Un sábado a las 22:30 para que el visitante vea el semáforo en acción desde el principio. */
function ejemploInicial(): DatosExtraidos {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - ((fecha.getDay() + 1) % 7));
  fecha.setHours(22, 30, 0, 0);
  return {
    fechaEmision: fecha.toISOString(),
    nifEmisor: 'B06654321',
    razonSocialEmisor: 'Restaurante El Puente Romano',
    nifReceptor: null,
    baseImponible: 58.18,
    tipoIva: 10,
    cuotaIva: 5.82,
    total: 64,
    categoria: 'restauracion',
    tipoDocumento: 'ticket',
  };
}

/** Simulador del semáforo fiscal para visitantes sin registrar: no guarda nada. */
export default function SimuladorScreen() {
  return (
    <Pantalla>
      <ThemedText type="small" themeColor="textSecondary">
        Cambia los datos del gasto y observa cómo reacciona el motor de reglas fiscales. Para
        guardar tus gastos y enviarlos a tu gestoría, crea una cuenta.
      </ThemedText>
      <FormularioGasto
        inicial={ejemploInicial()}
        textoGuardar="Crear cuenta para guardar mis gastos"
        onGuardar={() => router.push('/registro')}
      />
    </Pantalla>
  );
}
