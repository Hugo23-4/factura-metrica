import * as Crypto from 'expo-crypto';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

/**
 * Custodia documental (RF-12): huella SHA-256 del comprobante original,
 * para poder demostrar ante la AEAT que el documento no se ha alterado.
 */
export async function calcularHuella(uri: string) {
  try {
    const contenido =
      Platform.OS === 'web'
        ? await (await fetch(uri)).arrayBuffer()
        : await new File(uri).arrayBuffer();
    const resumen = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, contenido);
    return Array.from(new Uint8Array(resumen), (b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Si el archivo no se puede leer, el gasto se guarda igualmente sin huella.
    return undefined;
  }
}

/** Guarda un archivo de texto y lo ofrece para compartir o descargar (RF-11). */
export async function compartirArchivo(nombre: string, contenido: string, tipoMime: string) {
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([contenido], { type: tipoMime }));
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombre;
    enlace.click();
    URL.revokeObjectURL(url);
    return;
  }

  const archivo = new File(Paths.cache, nombre);
  if (archivo.exists) archivo.delete();
  archivo.create();
  archivo.write(contenido);
  await Sharing.shareAsync(archivo.uri, { mimeType: tipoMime, dialogTitle: nombre });
}
