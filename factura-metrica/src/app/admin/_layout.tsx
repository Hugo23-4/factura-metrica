import { Stack } from 'expo-router';

import { Colors, Fuentes } from '@/constants/theme';

/** Panel del gestor de la asesoría (rol admin). */
export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackButtonDisplayMode: 'minimal',
        headerShadowVisible: false,
        headerTintColor: Colors.text,
        headerTitleStyle: { fontFamily: Fuentes.semibold, color: Colors.text },
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="cliente/[id]" options={{ title: 'Ficha del cliente' }} />
      <Stack.Screen name="cliente-formulario" options={{ title: 'Cliente' }} />
      <Stack.Screen name="gasto/[id]" options={{ title: 'Revisión del gasto' }} />
    </Stack>
  );
}
