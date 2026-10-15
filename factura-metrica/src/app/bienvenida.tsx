import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Boton } from '@/components/boton';
import { Icono } from '@/components/icono';
import { Pantalla } from '@/components/pantalla';
import { Tarjeta } from '@/components/tarjeta';
import { ThemedText } from '@/components/themed-text';
import { Fuentes, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const VENTAJAS = [
  {
    ios: 'camera.viewfinder',
    md: 'document_scanner',
    texto: 'Fotografía tus tickets y extraemos los datos en segundos.',
  },
  {
    ios: 'checkmark.shield',
    md: 'verified_user',
    texto: 'El semáforo fiscal te avisa de los gastos que Hacienda puede rechazar.',
  },
  {
    ios: 'paperplane',
    md: 'send',
    texto: 'Tu gestoría recibe todo ordenado, sin fotos por WhatsApp.',
  },
] as const;

/** Portada para el visitante sin registrar. */
export default function BienvenidaScreen() {
  const theme = useTheme();

  return (
    <Pantalla enPestana>
      <View style={styles.hero}>
        <View style={[styles.logo, { backgroundColor: theme.primary }]}>
          <ThemedText style={styles.logoTexto}>FM</ThemedText>
        </View>
        <ThemedText type="subtitle" style={styles.centrado}>
          FacturaMétrica
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.centrado}>
          El filtro fiscal preventivo que conecta al autónomo con su despacho contable.
        </ThemedText>
      </View>

      <Tarjeta variante="relleno" style={styles.ventajas}>
        {VENTAJAS.map((ventaja) => (
          <View key={ventaja.md} style={styles.ventaja}>
            <Icono ios={ventaja.ios} md={ventaja.md} />
            <ThemedText type="small" style={styles.flex}>
              {ventaja.texto}
            </ThemedText>
          </View>
        ))}
      </Tarjeta>

      <View style={styles.acciones}>
        <Boton titulo="Iniciar sesión" onPress={() => router.push('/login')} />
        <Boton
          titulo="Crear cuenta de autónomo"
          variante="contorno"
          onPress={() => router.push('/registro')}
        />
      </View>

      <ThemedText type="smallBold" style={styles.seccion}>
        Sin registrarte
      </ThemedText>
      <Tarjeta>
        <View style={styles.ventaja}>
          <Icono ios="circle.lefthalf.filled" md="contrast" />
          <View style={styles.flex}>
            <ThemedText type="smallBold">Prueba el semáforo fiscal</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Introduce un gasto y descubre si Hacienda te lo aceptaría.
            </ThemedText>
          </View>
        </View>
        <Boton
          titulo="Probar ahora"
          variante="secundario"
          onPress={() => router.push('/simulador')}
        />
      </Tarjeta>
      <Tarjeta>
        <View style={styles.ventaja}>
          <Icono ios="book" md="menu_book" />
          <View style={styles.flex}>
            <ThemedText type="smallBold">Guía de gastos deducibles</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Qué puedes deducir como autónomo y en qué condiciones.
            </ThemedText>
          </View>
        </View>
        <Boton
          titulo="Consultar la guía"
          variante="secundario"
          onPress={() => router.push('/guia')}
        />
      </Tarjeta>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.four,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTexto: {
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 30,
    fontFamily: Fuentes.bold,
  },
  centrado: {
    textAlign: 'center',
  },
  ventajas: {
    gap: Spacing.three,
  },
  ventaja: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  flex: {
    flex: 1,
  },
  acciones: {
    gap: Spacing.two,
  },
  seccion: {
    marginTop: Spacing.two,
  },
});
