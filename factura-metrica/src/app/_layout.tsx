import {
  GoogleSans_400Regular,
  GoogleSans_500Medium,
  GoogleSans_600SemiBold,
  GoogleSans_700Bold,
  useFonts,
} from '@expo-google-fonts/google-sans';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { Colors, Fuentes } from '@/constants/theme';
import { GastosProvider, useGastos } from '@/context/gastos-context';
import { SesionProvider, useSesion } from '@/context/sesion-context';

SplashScreen.preventAutoHideAsync();

const tema = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary,
    background: Colors.background,
    card: Colors.background,
    text: Colors.text,
    border: Colors.border,
  },
};

export default function RootLayout() {
  const [fuentesCargadas, errorFuentes] = useFonts({
    GoogleSans_400Regular,
    GoogleSans_500Medium,
    GoogleSans_600SemiBold,
    GoogleSans_700Bold,
  });

  return (
    <ThemeProvider value={tema}>
      <SesionProvider>
        <GastosProvider>
          <StatusBar style="dark" />
          <Navegacion fuentesListas={fuentesCargadas || Boolean(errorFuentes)} />
        </GastosProvider>
      </SesionProvider>
    </ThemeProvider>
  );
}

/**
 * Tres perfiles de acceso (RF-01):
 * visitante sin registrar, autónomo (cliente) y gestor de la asesoría (admin).
 */
function Navegacion({ fuentesListas }: { fuentesListas: boolean }) {
  const { usuario, cargando: cargandoSesion } = useSesion();
  const { cargando: cargandoGastos } = useGastos();
  const listo = fuentesListas && !cargandoSesion && !cargandoGastos;

  useEffect(() => {
    if (listo) {
      SplashScreen.hideAsync();
    }
  }, [listo]);

  if (!listo) {
    return null;
  }

  const rol = usuario?.rol;

  return (
    <Stack
      screenOptions={{
        headerBackButtonDisplayMode: 'minimal',
        headerShadowVisible: false,
        headerTintColor: Colors.text,
        headerTitleStyle: { fontFamily: Fuentes.semibold, color: Colors.text },
      }}>
      <Stack.Protected guard={rol === 'cliente'}>
        <Stack.Screen name="(cliente)" options={{ headerShown: false }} />
        <Stack.Screen name="revisar" options={{ title: 'Revisar datos' }} />
        <Stack.Screen name="gasto/[id]" options={{ title: 'Detalle del gasto' }} />
        <Stack.Screen name="editar/[id]" options={{ title: 'Editar gasto' }} />
        <Stack.Screen
          name="justificar/[id]"
          options={{ title: 'Asesor Fiscal Virtual', presentation: 'modal' }}
        />
        <Stack.Screen
          name="enviar"
          options={{ title: 'Cierre trimestral', presentation: 'modal' }}
        />
      </Stack.Protected>

      <Stack.Protected guard={rol === 'admin'}>
        <Stack.Screen name="admin" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Protected guard={usuario !== null}>
        <Stack.Screen name="cuenta" options={{ title: 'Mi cuenta' }} />
      </Stack.Protected>

      <Stack.Protected guard={usuario === null}>
        <Stack.Screen name="bienvenida" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'Iniciar sesión' }} />
        <Stack.Screen name="registro" options={{ title: 'Crear cuenta' }} />
        <Stack.Screen name="simulador" options={{ title: 'Prueba el semáforo fiscal' }} />
      </Stack.Protected>

      <Stack.Screen name="guia" options={{ title: 'Guía de gastos deducibles' }} />
    </Stack>
  );
}
