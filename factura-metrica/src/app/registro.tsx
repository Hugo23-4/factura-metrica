import { FormularioUsuario } from '@/components/formulario-usuario';
import { Pantalla } from '@/components/pantalla';
import { ThemedText } from '@/components/themed-text';
import { useSesion } from '@/context/sesion-context';

/** CU-01: alta del autónomo vinculándolo a su asesoría con el código de invitación. */
export default function RegistroScreen() {
  const { registrarse } = useSesion();

  return (
    <Pantalla>
      <ThemedText type="small" themeColor="textSecondary">
        Tu asesoría te habrá facilitado un código para vincular tu cuenta con su despacho.
      </ThemedText>
      <FormularioUsuario
        esCliente
        contrasenaObligatoria
        pedirCodigoAsesoria
        textoGuardar="Crear mi cuenta"
        onGuardar={registrarse}
      />
    </Pantalla>
  );
}
