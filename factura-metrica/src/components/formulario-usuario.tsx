import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Boton } from '@/components/boton';
import { CampoTexto } from '@/components/campo-texto';
import { Chips } from '@/components/chips';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { buscarAsesoriaPorCodigo } from '@/services/asesorias';
import { validarDatosUsuario } from '@/services/auth';
import type { DatosUsuario, Usuario } from '@/types/usuario';

interface FormularioUsuarioProps {
  inicial?: Partial<DatosUsuario>;
  /** Datos fiscales del autónomo (NIF, actividad, domicilio). */
  esCliente: boolean;
  /** Alta: la contraseña es obligatoria. Edición: vacía = no se cambia. */
  contrasenaObligatoria: boolean;
  /** Registro de un visitante: pide el código de invitación de la asesoría. */
  pedirCodigoAsesoria?: boolean;
  /** Gestores entre los que el administrador puede repartir al cliente (RF-14). */
  gestores?: Usuario[];
  textoGuardar: string;
  onGuardar: (datos: DatosUsuario, codigoAsesoria: string) => Promise<string | null>;
}

export function FormularioUsuario({
  inicial,
  esCliente,
  contrasenaObligatoria,
  pedirCodigoAsesoria,
  gestores,
  textoGuardar,
  onGuardar,
}: FormularioUsuarioProps) {
  const theme = useTheme();
  const [datos, setDatos] = useState<DatosUsuario>({
    nombre: inicial?.nombre ?? '',
    email: inicial?.email ?? '',
    nif: inicial?.nif ?? '',
    actividad: inicial?.actividad ?? '',
    telefono: inicial?.telefono ?? '',
    domicilioFiscal: inicial?.domicilioFiscal ?? '',
    gestorId: inicial?.gestorId ?? gestores?.[0]?.id,
    contrasena: '',
  });
  const [codigo, setCodigo] = useState('');
  const [intentado, setIntentado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const errores = validarDatosUsuario(datos, { contrasenaObligatoria, esCliente });
  const asesoria = pedirCodigoAsesoria ? buscarAsesoriaPorCodigo(codigo) : null;
  const errorCodigo =
    pedirCodigoAsesoria && !asesoria ? 'Código no reconocido. Pídeselo a tu asesoría.' : undefined;
  const mostrar = (campo: keyof DatosUsuario) => intentado && errores[campo];
  const cambiar = (campo: keyof DatosUsuario) => (valor: string) =>
    setDatos((actuales) => ({ ...actuales, [campo]: valor }));

  async function guardar() {
    setIntentado(true);
    setErrorGeneral(null);
    if (Object.keys(errores).length > 0 || errorCodigo) return;
    setGuardando(true);
    const error = await onGuardar(datos, codigo);
    setGuardando(false);
    if (error) setErrorGeneral(error);
  }

  return (
    <View style={styles.formulario}>
      <CampoTexto
        etiqueta="Nombre y apellidos"
        value={datos.nombre}
        onChangeText={cambiar('nombre')}
        autoComplete="name"
        error={mostrar('nombre')}
      />
      <CampoTexto
        etiqueta="Correo electrónico"
        value={datos.email}
        onChangeText={cambiar('email')}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        error={mostrar('email')}
      />

      {esCliente && (
        <>
          <CampoTexto
            etiqueta="NIF / NIE"
            value={datos.nif}
            onChangeText={cambiar('nif')}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder="12345678Z"
            error={mostrar('nif')}
          />
          <CampoTexto
            etiqueta="Actividad económica (IAE)"
            value={datos.actividad}
            onChangeText={cambiar('actividad')}
            placeholder="Ej.: Reformas y fontanería (IAE 504.2)"
            error={mostrar('actividad')}
          />
          <CampoTexto
            etiqueta="Teléfono (opcional)"
            value={datos.telefono}
            onChangeText={cambiar('telefono')}
            keyboardType="phone-pad"
          />
          <CampoTexto
            etiqueta="Domicilio fiscal (opcional)"
            value={datos.domicilioFiscal}
            onChangeText={cambiar('domicilioFiscal')}
          />
        </>
      )}

      {gestores && gestores.length > 0 && (
        <View style={styles.grupo}>
          <ThemedText type="smallBold">Gestor asignado</ThemedText>
          <Chips
            opciones={gestores.map((g) => ({ valor: g.id, etiqueta: g.nombre }))}
            valor={datos.gestorId ?? ''}
            onCambio={cambiar('gestorId')}
          />
        </View>
      )}

      <CampoTexto
        etiqueta={contrasenaObligatoria ? 'Contraseña' : 'Nueva contraseña (opcional)'}
        value={datos.contrasena}
        onChangeText={cambiar('contrasena')}
        secureTextEntry
        autoComplete="new-password"
        ayuda={contrasenaObligatoria ? undefined : 'Déjala vacía para mantener la actual.'}
        error={mostrar('contrasena')}
      />

      {pedirCodigoAsesoria && (
        <CampoTexto
          etiqueta="Código de tu asesoría"
          value={codigo}
          onChangeText={setCodigo}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder="Te lo facilita tu gestor"
          ayuda={asesoria ? `Asesoría: ${asesoria.razonSocial}` : undefined}
          error={intentado && errorCodigo}
        />
      )}

      {errorGeneral && (
        <View
          style={[styles.error, { backgroundColor: `${theme.rojo}10`, borderColor: theme.rojo }]}>
          <ThemedText type="small" style={{ color: theme.rojo }}>
            {errorGeneral}
          </ThemedText>
        </View>
      )}

      <Boton titulo={textoGuardar} cargando={guardando} onPress={guardar} />
    </View>
  );
}

const styles = StyleSheet.create({
  formulario: {
    gap: Spacing.three,
  },
  grupo: {
    gap: Spacing.two,
  },
  error: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderLeftWidth: 4,
  },
});
