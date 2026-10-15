import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { Icono } from '@/components/icono';
import { Pantalla } from '@/components/pantalla';
import { Tarjeta } from '@/components/tarjeta';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useGastos } from '@/context/gastos-context';
import { useTheme } from '@/hooks/use-theme';
import { calcularHuella } from '@/services/documentos';
import { analizarComprobante } from '@/services/ocr';
import type { TipoDocumento } from '@/types/gasto';

const CONSEJOS = [
  'Coloca el ticket sobre una superficie oscura y lisa.',
  'Evita sombras y reflejos sobre el papel térmico.',
  'Asegúrate de que se lean el NIF, la fecha y el total.',
];

export default function CapturarScreen() {
  const theme = useTheme();
  const { setBorrador } = useGastos();
  const [vistaPrevia, setVistaPrevia] = useState<{ uri?: string; nombre?: string } | null>(null);
  const [analizando, setAnalizando] = useState(false);

  async function desdeImagen(origen: 'camara' | 'galeria') {
    const permiso =
      origen === 'camara'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso necesario', 'Activa el permiso en los ajustes del dispositivo.');
      return;
    }

    // RF-02: la cámara permite recortar el ticket antes de enviarlo.
    const opciones: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: origen === 'camara',
    };
    const resultado =
      origen === 'camara'
        ? await ImagePicker.launchCameraAsync(opciones)
        : await ImagePicker.launchImageLibraryAsync(opciones);
    if (resultado.canceled) return;

    const uri = resultado.assets[0].uri;
    setVistaPrevia({ uri });
    await procesar(uri, 'ticket');
  }

  /** RF-03: facturas recibidas por correo en PDF, PNG o JPG. */
  async function desdeArchivo() {
    const resultado = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/png', 'image/jpeg'],
      copyToCacheDirectory: true,
    });
    if (resultado.canceled) return;

    const archivo = resultado.assets[0];
    const esPdf =
      archivo.mimeType === 'application/pdf' || archivo.name.toLowerCase().endsWith('.pdf');
    setVistaPrevia(esPdf ? { nombre: archivo.name } : { uri: archivo.uri });
    await procesar(archivo.uri, esPdf ? 'factura_pdf' : 'factura_imagen', archivo.name);
  }

  async function procesar(uri: string, tipo: TipoDocumento, nombreArchivo?: string) {
    setAnalizando(true);
    try {
      const [datos, hashDocumento] = await Promise.all([
        analizarComprobante(uri, tipo),
        calcularHuella(uri),
      ]);
      setBorrador({
        datos,
        imagenUri: tipo === 'factura_pdf' ? undefined : uri,
        nombreArchivo,
        hashDocumento,
      });
      setVistaPrevia(null);
      router.push('/revisar');
    } catch (error) {
      Alert.alert(
        'No se pudo analizar el comprobante',
        error instanceof Error ? error.message : 'Inténtalo de nuevo.',
      );
    } finally {
      setAnalizando(false);
    }
  }

  return (
    <Pantalla enPestana titulo="Capturar gasto" antetitulo="Ticket o factura">
      <ThemedText type="small" themeColor="textSecondary">
        Extraemos los datos fiscales y te decimos al momento si el gasto es deducible.
      </ThemedText>

      <View
        style={[
          styles.visor,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        ]}>
        {vistaPrevia?.uri ? (
          <Image source={{ uri: vistaPrevia.uri }} style={styles.imagen} contentFit="contain" />
        ) : vistaPrevia?.nombre ? (
          <View style={styles.centro}>
            <Icono ios="doc.richtext" md="picture_as_pdf" size={48} color={theme.rojo} />
            <ThemedText type="smallBold">{vistaPrevia.nombre}</ThemedText>
          </View>
        ) : (
          <View style={styles.centro}>
            <Icono
              ios="doc.viewfinder"
              md="document_scanner"
              size={48}
              color={theme.textSecondary}
            />
            <ThemedText type="small" themeColor="textSecondary">
              Elige cómo quieres añadir tu comprobante
            </ThemedText>
          </View>
        )}
        {analizando && (
          <View style={styles.analizando}>
            <ActivityIndicator size="large" color={theme.primary} />
            <ThemedText type="smallBold" style={{ color: theme.primary }}>
              Leyendo NIF, importes e IVA…
            </ThemedText>
          </View>
        )}
      </View>

      <Opcion
        ios="camera.fill"
        md="photo_camera"
        titulo="Hacer foto al ticket"
        descripcion="Usa la cámara del móvil"
        destacada
        disabled={analizando}
        onPress={() => desdeImagen('camara')}
      />
      <Opcion
        ios="photo.on.rectangle"
        md="photo_library"
        titulo="Elegir de la galería"
        descripcion="Una foto que ya tengas guardada"
        disabled={analizando}
        onPress={() => desdeImagen('galeria')}
      />
      <Opcion
        ios="doc.fill"
        md="picture_as_pdf"
        titulo="Subir factura"
        descripcion="PDF, PNG o JPG que te llegó por correo"
        disabled={analizando}
        onPress={desdeArchivo}
      />

      <Tarjeta variante="relleno">
        <ThemedText type="smallBold">Consejos para una buena lectura</ThemedText>
        {CONSEJOS.map((consejo) => (
          <ThemedText key={consejo} type="small" themeColor="textSecondary">
            • {consejo}
          </ThemedText>
        ))}
      </Tarjeta>
    </Pantalla>
  );
}

interface OpcionProps {
  ios: 'camera.fill' | 'photo.on.rectangle' | 'doc.fill';
  md: 'photo_camera' | 'photo_library' | 'picture_as_pdf';
  titulo: string;
  descripcion: string;
  destacada?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

function Opcion({ ios, md, titulo, descripcion, destacada, disabled, onPress }: OpcionProps) {
  const theme = useTheme();
  const colorTexto = destacada ? theme.onPrimary : theme.text;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.opcion,
        destacada
          ? { backgroundColor: theme.primary, borderColor: theme.primary }
          : { backgroundColor: theme.background, borderColor: theme.border },
        (pressed || disabled) && styles.pulsado,
      ]}>
      <Icono ios={ios} md={md} color={destacada ? theme.onPrimary : theme.primary} />
      <View style={styles.flex}>
        <ThemedText type="smallBold" style={{ color: colorTexto }}>
          {titulo}
        </ThemedText>
        <ThemedText
          type="small"
          style={{ color: destacada ? `${theme.onPrimary}CC` : theme.textSecondary }}>
          {descripcion}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  visor: {
    height: 260,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  centro: {
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
  },
  imagen: {
    width: '100%',
    height: '100%',
  },
  analizando: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: 'rgba(255,255,255,0.88)',
  },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  pulsado: {
    opacity: 0.6,
  },
});
