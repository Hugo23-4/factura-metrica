import { Alert, Platform } from 'react-native';

/** Diálogo de confirmación para acciones destructivas que funciona también en web. */
export function confirmar(
  titulo: string,
  mensaje: string,
  textoAccion: string,
  accion: () => void,
) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${titulo}\n\n${mensaje}`)) accion();
    return;
  }
  Alert.alert(titulo, mensaje, [
    { text: 'Cancelar', style: 'cancel' },
    { text: textoAccion, style: 'destructive', onPress: accion },
  ]);
}
