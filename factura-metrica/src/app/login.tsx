import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Boton } from '@/components/boton';
import { CampoTexto } from '@/components/campo-texto';
import { Pantalla } from '@/components/pantalla';
import { Tarjeta } from '@/components/tarjeta';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useSesion } from '@/context/sesion-context';
import { useTheme } from '@/hooks/use-theme';
import {
  CONTRASENA_CLIENTE_DEMO,
  CONTRASENA_GESTOR_DEMO,
  EMAIL_CLIENTE_DEMO,
  EMAIL_GESTOR_DEMO,
} from '@/services/demo';

/** CU-01: inicio de sesión con correo y contraseña. */
export default function LoginScreen() {
  const theme = useTheme();
  const { iniciarSesion } = useSesion();
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  async function entrar(correo = email, clave = contrasena) {
    setEntrando(true);
    setError(await iniciarSesion(correo, clave));
    setEntrando(false);
  }

  return (
    <Pantalla>
      <CampoTexto
        etiqueta="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <CampoTexto
        etiqueta="Contraseña"
        value={contrasena}
        onChangeText={setContrasena}
        secureTextEntry
        autoComplete="current-password"
        onSubmitEditing={() => entrar()}
      />
      {error && (
        <View
          style={[styles.error, { backgroundColor: `${theme.rojo}10`, borderColor: theme.rojo }]}>
          <ThemedText type="small" style={{ color: theme.rojo }}>
            {error}
          </ThemedText>
        </View>
      )}
      <Boton
        titulo="Entrar"
        cargando={entrando}
        disabled={!email || !contrasena}
        onPress={() => entrar()}
      />
      <Boton
        titulo="Crear una cuenta"
        variante="contorno"
        onPress={() => router.replace('/registro')}
      />

      <Tarjeta variante="relleno">
        <ThemedText type="smallBold">Accesos de prueba para el tribunal</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Entorno con una asesoría, sus gestores y una cartera de autónomos con comprobantes
          precargados.
        </ThemedText>
        <Boton
          titulo="Entrar como gestor de la asesoría"
          variante="contorno"
          disabled={entrando}
          onPress={() => entrar(EMAIL_GESTOR_DEMO, CONTRASENA_GESTOR_DEMO)}
        />
        <Boton
          titulo="Entrar como autónomo"
          variante="contorno"
          disabled={entrando}
          onPress={() => entrar(EMAIL_CLIENTE_DEMO, CONTRASENA_CLIENTE_DEMO)}
        />
      </Tarjeta>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  error: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderLeftWidth: 4,
  },
});
